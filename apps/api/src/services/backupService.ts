import { promises as fs } from 'fs';
import path from 'path';
import { database } from '../utils/database';
import { logger } from '../utils/logger';
import { config } from '../config';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

export interface BackupMetadata {
  id: string;
  filename: string;
  size: number;
  createdAt: Date;
  tables: string[];
  recordCounts: Record<string, number>;
  checksum: string;
  compressionRatio?: number;
}

export interface BackupOptions {
  includeProducts?: boolean;
  includeOptimizations?: boolean;
  includeReviews?: boolean;
  includeJobs?: boolean;
  compress?: boolean;
  maxBackups?: number;
}

export class BackupService {
  private static readonly BACKUP_DIR = path.join(process.cwd(), 'backups');
  private static readonly DEFAULT_OPTIONS: Required<BackupOptions> = {
    includeProducts: true,
    includeOptimizations: true,
    includeReviews: true,
    includeJobs: true,
    compress: true,
    maxBackups: 10
  };

  static async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.BACKUP_DIR, { recursive: true });
      logger.info('Backup directory initialized', { path: this.BACKUP_DIR });
    } catch (error) {
      logger.error('Failed to initialize backup directory', { error, path: this.BACKUP_DIR });
      throw error;
    }
  }

  static async createBackup(options: BackupOptions = {}): Promise<BackupMetadata> {
    const backupOptions = { ...this.DEFAULT_OPTIONS, ...options };
    const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `jewelry_seo_backup_${timestamp}.sql`;
    const filepath = path.join(this.BACKUP_DIR, filename);

    try {
      logger.info('Starting database backup', { backupId, options: backupOptions });

      // Create backup file
      const backupContent = await this.generateBackupSQL(backupOptions);

      if (backupOptions.compress) {
        const compressedContent = await this.compressData(backupContent);
        const compressedFilename = `${filename}.gz`;
        const compressedFilepath = path.join(this.BACKUP_DIR, compressedFilename);

        await fs.writeFile(compressedFilepath, compressedContent);

        const metadata: BackupMetadata = {
          id: backupId,
          filename: compressedFilename,
          size: compressedContent.length,
          createdAt: new Date(),
          tables: this.getSelectedTables(backupOptions),
          recordCounts: await this.getRecordCounts(backupOptions),
          checksum: await this.calculateChecksum(compressedContent),
          compressionRatio: backupContent.length / compressedContent.length
        };

        await this.saveMetadata(metadata);
        await this.cleanupOldBackups(backupOptions.maxBackups);

        logger.info('Database backup completed successfully', {
          backupId,
          filename: compressedFilename,
          size: compressedContent.length,
          compressionRatio: metadata.compressionRatio
        });

        return metadata;
      } else {
        await fs.writeFile(filepath, backupContent);

        const metadata: BackupMetadata = {
          id: backupId,
          filename,
          size: backupContent.length,
          createdAt: new Date(),
          tables: this.getSelectedTables(backupOptions),
          recordCounts: await this.getRecordCounts(backupOptions),
          checksum: await this.calculateChecksum(backupContent)
        };

        await this.saveMetadata(metadata);
        await this.cleanupOldBackups(backupOptions.maxBackups);

        logger.info('Database backup completed successfully', {
          backupId,
          filename,
          size: backupContent.length
        });

        return metadata;
      }
    } catch (error) {
      logger.error('Database backup failed', { backupId, error });
      throw error;
    }
  }

  private static async generateBackupSQL(options: Required<BackupOptions>): Promise<string> {
    const tables = this.getSelectedTables(options);
    let sql = '-- Jewelry SEO Database Backup\n';
    sql += `-- Generated: ${new Date().toISOString()}\n`;
    sql += `-- Tables: ${tables.join(', ')}\n\n`;

    for (const table of tables) {
      sql += await this.getTableSQL(table);
      sql += '\n\n';
    }

    return sql;
  }

  private static async getTableSQL(table: string): Promise<string> {

    // Get table schema
    const schema = await database.get(`SELECT sql FROM sqlite_master WHERE type='table' AND name=?`, [table]);

    // Get table data
    const data = await database.all(`SELECT * FROM ${table}`);

    let sql = `-- Table: ${table}\n`;
    sql += `${schema?.sql || ''};\n\n`;

    if (data.length > 0) {
      sql += `-- Data: ${data.length} records\n`;
      sql += `INSERT INTO ${table} VALUES\n`;

      const values = data.map(row => {
        const values = Object.values(row).map(value => {
          if (value === null) return 'NULL';
          if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
          if (value instanceof Date) return `'${value.toISOString()}'`;
          return String(value);
        });
        return `(${values.join(', ')})`;
      });

      sql += values.join(',\n');
      sql += ';\n';
    }

    return sql;
  }

  private static getSelectedTables(options: Required<BackupOptions>): string[] {
    const tables = [];

    if (options.includeProducts) tables.push('products');
    if (options.includeOptimizations) tables.push('optimization_versions');
    if (options.includeReviews) tables.push('content_reviews');
    if (options.includeJobs) tables.push('optimization_jobs');

    return tables;
  }

  private static async getRecordCounts(options: Required<BackupOptions>): Promise<Record<string, number>> {
    const counts: Record<string, number> = {};
    const tables = this.getSelectedTables(options);

    for (const table of tables) {
      try {
        const result = await database.get(`SELECT COUNT(*) as count FROM ${table}`);
        counts[table] = result.count;
      } catch (error) {
        logger.warn(`Failed to get record count for table ${table}`, { error });
        counts[table] = 0;
      }
    }

    return counts;
  }

  private static async compressData(data: string): Promise<Buffer> {
    try {
      const zlib = await import('zlib');
      const gzip = promisify(zlib.gzip);
      return await gzip(data);
    } catch (error) {
      logger.error('Failed to compress backup data', { error });
      throw new Error('Compression not available');
    }
  }

  private static async calculateChecksum(data: string | Buffer): Promise<string> {
    try {
      const crypto = await import('crypto');
      const hash = crypto.createHash('sha256');
      hash.update(data);
      return hash.digest('hex');
    } catch (error) {
      logger.error('Failed to calculate checksum', { error });
      return 'unknown';
    }
  }

  private static async saveMetadata(metadata: BackupMetadata): Promise<void> {
    const metadataPath = path.join(this.BACKUP_DIR, `${metadata.id}.metadata.json`);
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
  }

  private static async cleanupOldBackups(maxBackups: number): Promise<void> {
    try {
      const files = await fs.readdir(this.BACKUP_DIR);
      const backupFiles = files.filter(file =>
        file.endsWith('.sql') || file.endsWith('.sql.gz') || file.endsWith('.metadata.json')
      );

      if (backupFiles.length > maxBackups * 2) { // *2 for metadata files
        const fileStats = await Promise.all(
          backupFiles.map(async (file) => {
            const filepath = path.join(this.BACKUP_DIR, file);
            const stats = await fs.stat(filepath);
            return { file, mtime: stats.mtime };
          })
        );

        const sortedFiles = fileStats.sort((a, b) => a.mtime.getTime() - b.mtime.getTime());
        const filesToDelete = sortedFiles.slice(0, backupFiles.length - maxBackups * 2);

        for (const { file } of filesToDelete) {
          const filepath = path.join(this.BACKUP_DIR, file);
          await fs.unlink(filepath);
          logger.debug('Deleted old backup file', { file });
        }
      }
    } catch (error) {
      logger.error('Failed to cleanup old backups', { error });
    }
  }

  static async listBackups(): Promise<BackupMetadata[]> {
    try {
      const files = await fs.readdir(this.BACKUP_DIR);
      const metadataFiles = files.filter(file => file.endsWith('.metadata.json'));

      const backups: BackupMetadata[] = [];
      for (const file of metadataFiles) {
        try {
          const filepath = path.join(this.BACKUP_DIR, file);
          const content = await fs.readFile(filepath, 'utf-8');
          const metadata = JSON.parse(content);
          backups.push(metadata);
        } catch (error) {
          logger.warn('Failed to read backup metadata', { file, error });
        }
      }

      return backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      logger.error('Failed to list backups', { error });
      return [];
    }
  }

  static async getBackup(backupId: string): Promise<{ metadata: BackupMetadata; data: Buffer } | null> {
    try {
      const metadataPath = path.join(this.BACKUP_DIR, `${backupId}.metadata.json`);
      const metadataContent = await fs.readFile(metadataPath, 'utf-8');
      const metadata: BackupMetadata = JSON.parse(metadataContent);

      const dataPath = path.join(this.BACKUP_DIR, metadata.filename);
      const data = await fs.readFile(dataPath);

      return { metadata, data };
    } catch (error) {
      logger.error('Failed to get backup', { backupId, error });
      return null;
    }
  }

  static async deleteBackup(backupId: string): Promise<boolean> {
    try {
      const metadataPath = path.join(this.BACKUP_DIR, `${backupId}.metadata.json`);
      const metadataContent = await fs.readFile(metadataPath, 'utf-8');
      const metadata: BackupMetadata = JSON.parse(metadataContent);

      const dataPath = path.join(this.BACKUP_DIR, metadata.filename);

      await fs.unlink(metadataPath);
      await fs.unlink(dataPath);

      logger.info('Backup deleted successfully', { backupId, filename: metadata.filename });
      return true;
    } catch (error) {
      logger.error('Failed to delete backup', { backupId, error });
      return false;
    }
  }

  static async restoreBackup(backupId: string): Promise<boolean> {
    try {
      const backup = await this.getBackup(backupId);
      if (!backup) {
        throw new Error('Backup not found');
      }

      const { metadata, data } = backup;
      logger.info('Starting database restore', { backupId, filename: metadata.filename });

      // Begin transaction
      await database.run('BEGIN TRANSACTION');

      try {
        // Drop existing tables
        for (const table of metadata.tables) {
          await database.run(`DROP TABLE IF EXISTS ${table}`);
        }

        // Execute backup SQL
        const sql = data.toString('utf-8');
        await database.exec(sql);

        // Commit transaction
        await database.run('COMMIT');

        logger.info('Database restore completed successfully', { backupId });
        return true;
      } catch (error) {
        // Rollback on error
        await database.run('ROLLBACK');
        throw error;
      }
    } catch (error) {
      logger.error('Database restore failed', { backupId, error });
      throw error;
    }
  }

  static async exportData(format: 'json' | 'csv' = 'json'): Promise<string> {
    try {
      const tables = ['products', 'optimization_versions', 'content_reviews', 'optimization_jobs'];

      const exportData: Record<string, any[]> = {};

      for (const table of tables) {
        const data = await database.all(`SELECT * FROM ${table}`);
        exportData[table] = data;
      }

      if (format === 'json') {
        return JSON.stringify(exportData, null, 2);
      } else if (format === 'csv') {
        let csv = '';
        for (const [table, data] of Object.entries(exportData)) {
          if (data.length > 0) {
            csv += `Table: ${table}\n`;
            csv += Object.keys(data[0]).join(',') + '\n';
            csv += data.map(row =>
              Object.values(row).map(value =>
                typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
              ).join(',')
            ).join('\n');
            csv += '\n\n';
          }
        }
        return csv;
      }

      throw new Error(`Unsupported export format: ${format}`);
    } catch (error) {
      logger.error('Data export failed', { format, error });
      throw error;
    }
  }

  static async getBackupStats(): Promise<{
    totalBackups: number;
    totalSize: number;
    oldestBackup?: Date;
    newestBackup?: Date;
    tablesBackedUp: string[];
  }> {
    try {
      const backups = await this.listBackups();

      if (backups.length === 0) {
        return {
          totalBackups: 0,
          totalSize: 0,
          tablesBackedUp: []
        };
      }

      const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);
      const allTables = new Set<string>();
      backups.forEach(backup => backup.tables.forEach(table => allTables.add(table)));

      return {
        totalBackups: backups.length,
        totalSize,
        oldestBackup: backups[backups.length - 1].createdAt,
        newestBackup: backups[0].createdAt,
        tablesBackedUp: Array.from(allTables)
      };
    } catch (error) {
      logger.error('Failed to get backup stats', { error });
      throw error;
    }
  }
}