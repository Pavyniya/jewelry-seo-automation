import { database } from './database';
import { logger } from './logger';
import { promises as fs } from 'fs';
import path from 'path';
import { createGzip } from 'zlib';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';

export interface BackupOptions {
  includeSchema?: boolean;
  includeData?: boolean;
  compression?: boolean;
  encryption?: boolean;
  tables?: string[];
}

export interface BackupResult {
  success: boolean;
  filename: string;
  size: number;
  timestamp: Date;
  tables: string[];
  recordCounts: Record<string, number>;
  checksum?: string;
  executionTime: number;
}

export interface RestoreResult {
  success: boolean;
  restoredTables: string[];
  recordCounts: Record<string, number>;
  executionTime: number;
  errors: string[];
}

export class BackupManager {
  private static instance: BackupManager;
  private backupDir: string;

  constructor() {
    this.backupDir = path.join(process.cwd(), 'backups');
    this.ensureBackupDirectory();
  }

  static getInstance(): BackupManager {
    if (!BackupManager.instance) {
      BackupManager.instance = new BackupManager();
    }
    return BackupManager.instance;
  }

  private async ensureBackupDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
    } catch (error) {
      logger.error('Failed to create backup directory:', error);
      throw error;
    }
  }

  async createBackup(options: BackupOptions = {}): Promise<BackupResult> {
    const startTime = Date.now();
    const {
      includeSchema = true,
      includeData = true,
      compression = true,
      encryption = false,
      tables,
    } = options;

    const timestamp = new Date();
    const timestampStr = timestamp.toISOString().replace(/[:.]/g, '-');
    const filename = `jewelry_seo_backup_${timestampStr}.sql${compression ? '.gz' : ''}`;
    const filepath = path.join(this.backupDir, filename);

    const result: BackupResult = {
      success: false,
      filename,
      size: 0,
      timestamp,
      tables: [],
      recordCounts: {},
      executionTime: 0,
    };

    try {
      logger.info(`Starting backup: ${filename}`);

      // Get all tables or specified tables
      const allTables = await this.getDatabaseTables();
      const backupTables = tables || allTables;
      result.tables = backupTables;

      // Get record counts for each table
      for (const table of backupTables) {
        const count = await this.getTableRecordCount(table);
        result.recordCounts[table] = count;
      }

      // Generate backup SQL
      let sql = '';

      if (includeSchema) {
        sql += await this.generateSchemaSQL(backupTables);
      }

      if (includeData) {
        sql += await this.generateDataSQL(backupTables);
      }

      // Write backup file
      if (compression) {
        const gzip = createGzip();
        const source = Readable.from([sql]);
        const dest = fs.createWriteStream(filepath);

        await pipeline(source, gzip, dest);
      } else {
        await fs.writeFile(filepath, sql, 'utf8');
      }

      // Get file size
      const stats = await fs.stat(filepath);
      result.size = stats.size;

      // Generate checksum
      result.checksum = await this.generateChecksum(sql);

      result.success = true;
      result.executionTime = Date.now() - startTime;

      logger.info(`Backup completed successfully: ${filename} (${result.size} bytes, ${result.executionTime}ms)`);
      return result;
    } catch (error) {
      result.executionTime = Date.now() - startTime;
      logger.error('Backup failed:', error);
      throw error;
    }
  }

  private async getDatabaseTables(): Promise<string[]> {
    try {
      const rows = await database.all(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
        ORDER BY name
      `);
      return rows.map(row => row.name);
    } catch (error) {
      logger.error('Failed to get database tables:', error);
      throw error;
    }
  }

  private async getTableRecordCount(table: string): Promise<number> {
    try {
      const result = await database.get(`SELECT COUNT(*) as count FROM ${table}`);
      return result.count;
    } catch (error) {
      logger.warn(`Failed to get record count for table ${table}:`, error);
      return 0;
    }
  }

  private async generateSchemaSQL(tables: string[]): Promise<string> {
    let sql = '-- Jewelry SEO Database Backup - Schema\n';
    sql += `-- Generated: ${new Date().toISOString()}\n\n`;

    for (const table of tables) {
      try {
        const schema = await database.get(`
          SELECT sql FROM sqlite_master
          WHERE type='table' AND name=?
        `, [table]);

        if (schema && schema.sql) {
          sql += `-- Table: ${table}\n`;
          sql += `${schema.sql};\n\n`;

          // Add indexes
          const indexes = await database.all(`
            SELECT sql FROM sqlite_master
            WHERE type='index' AND tbl_name=? AND sql IS NOT NULL
          `, [table]);

          for (const index of indexes) {
            sql += `${index.sql};\n`;
          }
          sql += '\n';
        }
      } catch (error) {
        logger.warn(`Failed to get schema for table ${table}:`, error);
      }
    }

    return sql;
  }

  private async generateDataSQL(tables: string[]): Promise<string> {
    let sql = '\n-- Data\n\n';

    for (const table of tables) {
      try {
        const rows = await database.all(`SELECT * FROM ${table}`);

        if (rows.length === 0) {
          continue;
        }

        sql += `-- Table: ${table} (${rows.length} records)\n`;

        for (const row of rows) {
          const columns = Object.keys(row);
          const values = columns.map(col => this.escapeValue(row[col]));
          sql += `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
        }

        sql += '\n';
      } catch (error) {
        logger.warn(`Failed to generate data for table ${table}:`, error);
      }
    }

    return sql;
  }

  private escapeValue(value: any): string {
    if (value === null || value === undefined) {
      return 'NULL';
    } else if (typeof value === 'string') {
      return `'${value.replace(/'/g, "''")}'`;
    } else if (typeof value === 'number') {
      return value.toString();
    } else if (typeof value === 'boolean') {
      return value ? '1' : '0';
    } else if (value instanceof Date) {
      return `'${value.toISOString()}'`;
    } else if (Buffer.isBuffer(value)) {
      return `X'${value.toString('hex')}'`;
    } else {
      return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
    }
  }

  private async generateChecksum(content: string): Promise<string> {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  async restoreBackup(
    backupPath: string,
    options: { dropExisting?: boolean; validateOnly?: boolean } = {}
  ): Promise<RestoreResult> {
    const startTime = Date.now();
    const { dropExisting = false, validateOnly = false } = options;

    const result: RestoreResult = {
      success: false,
      restoredTables: [],
      recordCounts: {},
      executionTime: 0,
      errors: [],
    };

    try {
      logger.info(`Starting restore from: ${backupPath}`);

      // Read backup file
      let sql: string;
      if (backupPath.endsWith('.gz')) {
        const zlib = require('zlib');
        const data = await fs.readFile(backupPath);
        sql = zlib.gunzipSync(data).toString('utf8');
      } else {
        sql = await fs.readFile(backupPath, 'utf8');
      }

      // Parse SQL to identify tables
      const tableRegex = /CREATE TABLE\s+IF\s+NOT\s+EXISTS\s+(\w+)/gi;
      const tables: string[] = [];
      let match;

      while ((match = tableRegex.exec(sql)) !== null) {
        tables.push(match[1]);
      }

      result.restoredTables = tables;

      if (validateOnly) {
        logger.info('Validation only mode - no changes made');
        result.success = true;
        result.executionTime = Date.now() - startTime;
        return result;
      }

      // Execute restore
      if (dropExisting) {
        await this.dropTables(tables);
      }

      // Execute SQL statements
      const statements = sql.split(';').filter(stmt => stmt.trim());

      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await database.run(statement);
          } catch (error) {
            result.errors.push(`Failed to execute statement: ${statement.substring(0, 100)}...`);
            logger.error('Failed to execute statement:', error);
          }
        }
      }

      // Get record counts after restore
      for (const table of tables) {
        try {
          const count = await this.getTableRecordCount(table);
          result.recordCounts[table] = count;
        } catch (error) {
          logger.warn(`Failed to get record count for table ${table} after restore:`, error);
        }
      }

      result.success = result.errors.length === 0;
      result.executionTime = Date.now() - startTime;

      if (result.success) {
        logger.info(`Restore completed successfully: ${tables.length} tables restored`);
      } else {
        logger.warn(`Restore completed with ${result.errors.length} errors`);
      }

      return result;
    } catch (error) {
      result.executionTime = Date.now() - startTime;
      result.errors.push(String(error));
      logger.error('Restore failed:', error);
      return result;
    }
  }

  private async dropTables(tables: string[]): Promise<void> {
    for (const table of tables) {
      try {
        await database.run(`DROP TABLE IF EXISTS ${table}`);
        logger.info(`Dropped table: ${table}`);
      } catch (error) {
        logger.warn(`Failed to drop table ${table}:`, error);
      }
    }
  }

  async listBackups(): Promise<Array<{
    filename: string;
    size: number;
    timestamp: Date;
    compressed: boolean;
  }>> {
    try {
      const files = await fs.readdir(this.backupDir);
      const backups = [];

      for (const file of files) {
        if (file.startsWith('jewelry_seo_backup_') && file.endsWith('.sql')) {
          const filepath = path.join(this.backupDir, file);
          const stats = await fs.stat(filepath);

          const timestampStr = file.replace('jewelry_seo_backup_', '').replace('.sql', '').replace('.gz', '');
          const timestamp = new Date(timestampStr.replace(/-/g, ':'));

          backups.push({
            filename: file,
            size: stats.size,
            timestamp,
            compressed: file.endsWith('.gz'),
          });
        }
      }

      return backups.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      logger.error('Failed to list backups:', error);
      return [];
    }
  }

  async deleteBackup(filename: string): Promise<boolean> {
    try {
      const filepath = path.join(this.backupDir, filename);
      await fs.unlink(filepath);
      logger.info(`Deleted backup: ${filename}`);
      return true;
    } catch (error) {
      logger.error(`Failed to delete backup ${filename}:`, error);
      return false;
    }
  }

  async getBackupInfo(filename: string): Promise<BackupResult | null> {
    try {
      const filepath = path.join(this.backupDir, filename);

      if (!await fs.access(filepath).catch(() => false)) {
        return null;
      }

      const stats = await fs.stat(filepath);
      const timestamp = new Date(stats.mtime);

      // Parse backup file to extract table info
      let sql: string;
      if (filename.endsWith('.gz')) {
        const zlib = require('zlib');
        const data = await fs.readFile(filepath);
        sql = zlib.gunzipSync(data).toString('utf8');
      } else {
        sql = await fs.readFile(filepath, 'utf8');
      }

      const tableRegex = /CREATE TABLE\s+IF\s+NOT\s+EXISTS\s+(\w+)/gi;
      const tables: string[] = [];
      let match;

      while ((match = tableRegex.exec(sql)) !== null) {
        tables.push(match[1]);
      }

      return {
        success: true,
        filename,
        size: stats.size,
        timestamp,
        tables,
        recordCounts: {}, // Would need to parse INSERT statements to get counts
        executionTime: 0,
      };
    } catch (error) {
      logger.error(`Failed to get backup info for ${filename}:`, error);
      return null;
    }
  }
}

export const backupManager = BackupManager.getInstance();