import { database } from './database';
import { logger } from './logger';

export interface Migration {
  id: string;
  name: string;
  up: string;
  down?: string;
  version: number;
  description: string;
  createdAt: Date;
}

export interface MigrationRecord {
  id: string;
  name: string;
  version: number;
  executedAt: Date;
  executionTime: number;
  success: boolean;
  errorMessage?: string;
}

export class MigrationManager {
  private static instance: MigrationManager;
  private migrations: Migration[] = [];
  private tableName = 'schema_migrations';

  static getInstance(): MigrationManager {
    if (!MigrationManager.instance) {
      MigrationManager.instance = new MigrationManager();
    }
    return MigrationManager.instance;
  }

  constructor() {
    this.initializeMigrations();
  }

  private initializeMigrations(): void {
    this.migrations = [
      {
        id: '001_initial_schema',
        name: 'Initial Database Schema',
        version: 1,
        description: 'Create initial database tables for products, optimization, and AI management',
        up: `
          CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            vendor TEXT,
            productType TEXT,
            tags TEXT,
            variants TEXT,
            images TEXT,
            price REAL,
            sku TEXT,
            seoTitle TEXT,
            seoDescription TEXT,
            optimizedDescription TEXT,
            optimizationStatus TEXT NOT NULL DEFAULT 'pending',
            lastOptimized DATETIME,
            createdAt DATETIME NOT NULL,
            updatedAt DATETIME NOT NULL,
            shopifyData TEXT,
            syncVersion INTEGER DEFAULT 1
          );

          CREATE INDEX IF NOT EXISTS idx_products_status ON products(optimizationStatus);
          CREATE INDEX IF NOT EXISTS idx_products_vendor ON products(vendor);
          CREATE INDEX IF NOT EXISTS idx_products_created ON products(createdAt);

          CREATE TABLE IF NOT EXISTS optimization_versions (
            id TEXT PRIMARY KEY,
            productId TEXT NOT NULL,
            version INTEGER NOT NULL,
            originalTitle TEXT NOT NULL,
            originalDescription TEXT,
            originalSeoTitle TEXT,
            originalSeoDescription TEXT,
            optimizedTitle TEXT NOT NULL,
            optimizedDescription TEXT,
            optimizedSeoTitle TEXT,
            optimizedSeoDescription TEXT,
            aiProvider TEXT NOT NULL,
            tokensUsed INTEGER DEFAULT 0,
            cost REAL DEFAULT 0.0,
            responseTime INTEGER DEFAULT 0,
            isActive BOOLEAN DEFAULT 1,
            createdAt DATETIME NOT NULL,
            FOREIGN KEY (productId) REFERENCES products (id) ON DELETE CASCADE
          );

          CREATE INDEX IF NOT EXISTS idx_optimization_versions_product ON optimization_versions(productId);
          CREATE INDEX IF NOT EXISTS idx_optimization_versions_active ON optimization_versions(isActive);
          CREATE INDEX IF NOT EXISTS idx_optimization_versions_created ON optimization_versions(createdAt);

          CREATE TABLE IF NOT EXISTS content_reviews (
            id TEXT PRIMARY KEY,
            productId TEXT NOT NULL,
            versionId TEXT NOT NULL,
            reviewer TEXT NOT NULL,
            status TEXT NOT NULL,
            feedback TEXT,
            approvedAt DATETIME,
            createdAt DATETIME NOT NULL,
            FOREIGN KEY (productId) REFERENCES products (id) ON DELETE CASCADE,
            FOREIGN KEY (versionId) REFERENCES optimization_versions (id) ON DELETE CASCADE
          );

          CREATE INDEX IF NOT EXISTS idx_content_reviews_product ON content_reviews(productId);
          CREATE INDEX IF NOT EXISTS idx_content_reviews_status ON content_reviews(status);

          CREATE TABLE IF NOT EXISTS ai_providers (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            apiKey TEXT NOT NULL,
            baseUrl TEXT,
            isEnabled BOOLEAN NOT NULL DEFAULT 1,
            rateLimit INTEGER,
            currentUsage INTEGER DEFAULT 0,
            usageLimit INTEGER,
            lastUsed DATETIME,
            createdAt DATETIME NOT NULL,
            updatedAt DATETIME NOT NULL
          );

          CREATE INDEX IF NOT EXISTS idx_ai_providers_enabled ON ai_providers(isEnabled);

          CREATE TABLE IF NOT EXISTS ai_usage_records (
            id TEXT PRIMARY KEY,
            providerId TEXT NOT NULL,
            productId TEXT,
            requestType TEXT NOT NULL,
            tokensUsed INTEGER NOT NULL,
            cost REAL NOT NULL,
            responseTime INTEGER NOT NULL,
            success BOOLEAN NOT NULL,
            errorMessage TEXT,
            createdAt DATETIME NOT NULL,
            updatedAt DATETIME NOT NULL,
            FOREIGN KEY (providerId) REFERENCES ai_providers (id) ON DELETE CASCADE
          );

          CREATE INDEX IF NOT EXISTS idx_ai_usage_provider ON ai_usage_records(providerId);
          CREATE INDEX IF NOT EXISTS idx_ai_usage_created ON ai_usage_records(createdAt);
          CREATE INDEX IF NOT EXISTS idx_ai_usage_success ON ai_usage_records(success);
        `,
        down: `
          DROP TABLE IF EXISTS ai_usage_records;
          DROP TABLE IF EXISTS ai_providers;
          DROP TABLE IF EXISTS content_reviews;
          DROP TABLE IF EXISTS optimization_versions;
          DROP TABLE IF EXISTS products;
        `,
        createdAt: new Date('2024-01-01'),
      },
      {
        id: '002_add_optimization_jobs',
        name: 'Add Optimization Jobs Table',
        version: 2,
        description: 'Add optimization jobs table for background processing',
        up: `
          CREATE TABLE IF NOT EXISTS optimization_jobs (
            id TEXT PRIMARY KEY,
            productId TEXT NOT NULL,
            jobType TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            providerId TEXT,
            priority INTEGER DEFAULT 5,
            retryCount INTEGER DEFAULT 0,
            maxRetries INTEGER DEFAULT 3,
            errorMessage TEXT,
            startedAt DATETIME,
            completedAt DATETIME,
            createdAt DATETIME NOT NULL,
            FOREIGN KEY (productId) REFERENCES products (id) ON DELETE CASCADE,
            FOREIGN KEY (providerId) REFERENCES ai_providers (id) ON DELETE SET NULL
          );

          CREATE INDEX IF NOT EXISTS idx_optimization_jobs_status ON optimization_jobs(status);
          CREATE INDEX IF NOT EXISTS idx_optimization_jobs_priority ON optimization_jobs(priority);
          CREATE INDEX IF NOT EXISTS idx_optimization_jobs_created ON optimization_jobs(createdAt);
          CREATE INDEX IF NOT EXISTS idx_optimization_jobs_product ON optimization_jobs(productId);
        `,
        down: `
          DROP TABLE IF EXISTS optimization_jobs;
        `,
        createdAt: new Date('2024-01-02'),
      },
      {
        id: '003_add_product_indexes',
        name: 'Add Product Performance Indexes',
        version: 3,
        description: 'Add additional indexes for better query performance',
        up: `
          CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
          CREATE INDEX IF NOT EXISTS idx_products_type ON products(productType);
          CREATE INDEX IF NOT EXISTS idx_products_tags ON products(tags);
          CREATE INDEX IF NOT EXISTS idx_products_optimized ON products(lastOptimized);
        `,
        down: `
          DROP INDEX IF EXISTS idx_products_price;
          DROP INDEX IF EXISTS idx_products_type;
          DROP INDEX IF EXISTS idx_products_tags;
          DROP INDEX IF EXISTS idx_products_optimized;
        `,
        createdAt: new Date('2024-01-03'),
      },
      {
        id: '004_add_performance_monitoring',
        name: 'Add Performance Monitoring',
        version: 4,
        description: 'Add tables for query performance monitoring',
        up: `
          CREATE TABLE IF NOT EXISTS query_performance (
            id TEXT PRIMARY KEY,
            queryType TEXT NOT NULL,
            tableName TEXT,
            executionTime INTEGER NOT NULL,
            rowCount INTEGER,
            success BOOLEAN NOT NULL,
            errorMessage TEXT,
            timestamp DATETIME NOT NULL
          );

          CREATE INDEX IF NOT EXISTS idx_query_performance_type ON query_performance(queryType);
          CREATE INDEX IF NOT EXISTS idx_query_performance_table ON query_performance(tableName);
          CREATE INDEX IF NOT EXISTS idx_query_performance_timestamp ON query_performance(timestamp);
        `,
        down: `
          DROP TABLE IF EXISTS query_performance;
        `,
        createdAt: new Date('2024-01-04'),
      },
    ];
  }

  async initialize(): Promise<void> {
    try {
      // Create migrations table if it doesn't exist
      await database.run(`
        CREATE TABLE IF NOT EXISTS ${this.tableName} (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          version INTEGER NOT NULL,
          executedAt DATETIME NOT NULL,
          executionTime INTEGER NOT NULL,
          success BOOLEAN NOT NULL DEFAULT 1,
          errorMessage TEXT,
          UNIQUE(id)
        );
      `);

      // Create index on version for faster lookups
      await database.run(`
        CREATE INDEX IF NOT EXISTS idx_migrations_version ON ${this.tableName}(version);
      `);

      logger.info('Migration system initialized');
    } catch (error) {
      logger.error('Failed to initialize migration system:', error);
      throw error;
    }
  }

  async getExecutedMigrations(): Promise<MigrationRecord[]> {
    try {
      const rows = await database.all(`
        SELECT id, name, version, executedAt, executionTime, success, errorMessage
        FROM ${this.tableName}
        ORDER BY version ASC
      `);

      return rows.map(row => ({
        id: row.id,
        name: row.name,
        version: row.version,
        executedAt: new Date(row.executedAt),
        executionTime: row.executionTime,
        success: Boolean(row.success),
        errorMessage: row.errorMessage,
      }));
    } catch (error) {
      logger.error('Failed to get executed migrations:', error);
      throw error;
    }
  }

  async getPendingMigrations(): Promise<Migration[]> {
    try {
      const executed = await this.getExecutedMigrations();
      const executedIds = new Set(executed.map(m => m.id));

      return this.migrations.filter(migration => !executedIds.has(migration.id));
    } catch (error) {
      logger.error('Failed to get pending migrations:', error);
      throw error;
    }
  }

  async runMigration(migration: Migration): Promise<MigrationRecord> {
    const startTime = Date.now();
    let success = false;
    let errorMessage: string | undefined;

    try {
      logger.info(`Running migration: ${migration.name} (${migration.id})`);

      // Execute the migration
      await database.exec(migration.up);

      const executionTime = Date.now() - startTime;
      success = true;

      logger.info(`Migration completed successfully: ${migration.name} (${executionTime}ms)`);

      const record: MigrationRecord = {
        id: migration.id,
        name: migration.name,
        version: migration.version,
        executedAt: new Date(),
        executionTime,
        success,
      };

      // Record the migration
      await database.run(`
        INSERT INTO ${this.tableName} (id, name, version, executedAt, executionTime, success)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [record.id, record.name, record.version, record.executedAt.toISOString(), record.executionTime, record.success ? 1 : 0]);

      return record;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      success = false;
      errorMessage = String(error);

      logger.error(`Migration failed: ${migration.name}`, error);

      const record: MigrationRecord = {
        id: migration.id,
        name: migration.name,
        version: migration.version,
        executedAt: new Date(),
        executionTime,
        success,
        errorMessage,
      };

      // Record the failed migration
      await database.run(`
        INSERT INTO ${this.tableName} (id, name, version, executedAt, executionTime, success, errorMessage)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [record.id, record.name, record.version, record.executedAt.toISOString(), record.executionTime, record.success ? 1 : 0, record.errorMessage]);

      throw error;
    }
  }

  async rollbackMigration(migration: Migration): Promise<void> {
    if (!migration.down) {
      throw new Error(`Migration ${migration.id} does not support rollback`);
    }

    try {
      logger.info(`Rolling back migration: ${migration.name} (${migration.id})`);

      // Execute the rollback
      await database.exec(migration.down);

      // Remove the migration record
      await database.run(`DELETE FROM ${this.tableName} WHERE id = ?`, [migration.id]);

      logger.info(`Migration rolled back successfully: ${migration.name}`);
    } catch (error) {
      logger.error(`Rollback failed: ${migration.name}`, error);
      throw error;
    }
  }

  async migrateTo(version?: number): Promise<MigrationRecord[]> {
    await this.initialize();

    const pending = await this.getPendingMigrations();
    const targetVersion = version || Math.max(...this.migrations.map(m => m.version));
    const toRun = pending.filter(m => m.version <= targetVersion);

    if (toRun.length === 0) {
      logger.info('No pending migrations to run');
      return [];
    }

    logger.info(`Running ${toRun.length} pending migrations`);

    const results: MigrationRecord[] = [];

    for (const migration of toRun.sort((a, b) => a.version - b.version)) {
      try {
        const result = await this.runMigration(migration);
        results.push(result);
      } catch (error) {
        logger.error(`Migration ${migration.id} failed, stopping migration process`);
        throw error;
      }
    }

    logger.info(`Successfully ran ${results.length} migrations`);
    return results;
  }

  async rollbackTo(version: number): Promise<void> {
    await this.initialize();

    const executed = await this.getExecutedMigrations();
    const toRollback = executed
      .filter(m => m.version > version)
      .sort((a, b) => b.version - a.version); // Rollback in reverse order

    if (toRollback.length === 0) {
      logger.info('No migrations to rollback');
      return;
    }

    logger.info(`Rolling back ${toRollback.length} migrations`);

    for (const record of toRollback) {
      const migration = this.migrations.find(m => m.id === record.id);
      if (!migration) {
        logger.warn(`Migration ${record.id} not found in migration definitions`);
        continue;
      }

      try {
        await this.rollbackMigration(migration);
      } catch (error) {
        logger.error(`Rollback ${migration.id} failed, stopping rollback process`);
        throw error;
      }
    }

    logger.info(`Successfully rolled back ${toRollback.length} migrations`);
  }

  async getStatus(): Promise<{
    current: number;
    latest: number;
    pending: number;
    executed: number;
    migrations: MigrationRecord[];
  }> {
    await this.initialize();

    const executed = await this.getExecutedMigrations();
    const pending = await this.getPendingMigrations();
    const latestVersion = Math.max(...this.migrations.map(m => m.version));
    const currentVersion = executed.length > 0 ? Math.max(...executed.map(m => m.version)) : 0;

    return {
      current: currentVersion,
      latest: latestVersion,
      pending: pending.length,
      executed: executed.length,
      migrations: executed,
    };
  }
}

export const migrationManager = MigrationManager.getInstance();