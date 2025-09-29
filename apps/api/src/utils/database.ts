import sqlite3 from 'sqlite3';
import { config } from '../config';
import { logger } from './logger';

console.log('LOADING DATABASE.TS - V3');

class Database {
  private db: sqlite3.Database | null = null;
  private dbPath: string;
  private static instance: Database | null = null;

  constructor() {
    console.log('DATABASE CONSTRUCTOR, isTest:', config.isTest);
    if (config.isTest) {
      this.dbPath = ':memory:';
    } else {
      this.dbPath = process.env.DATABASE_URL || (config.isDevelopment ? './jewelry_seo_simple.db' : './jewelry_seo.db');
    }
  }

  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  async connect(): Promise<void> {
    console.log('🔌 Attempting to connect to database:', this.dbPath);
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('❌ Database connection error:', err);
          logger.error('Failed to connect to database:', err);
          return reject(err);
        }
        console.log('✅ Database connected successfully');
        logger.info(`Connected to SQLite database: ${this.dbPath}`);
        this.createTables().then(resolve).catch((tableErr) => {
          console.error('❌ Table creation error:', tableErr);
          reject(tableErr);
        });
      });
    });
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not connected');

    const queries = [
      `CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        vendor TEXT,
        product_type TEXT,
        tags TEXT,
        variants TEXT,
        images TEXT,
        price REAL,
        sku TEXT,
        seo_title TEXT,
        seo_description TEXT,
        optimized_description TEXT,
        status TEXT DEFAULT 'active',
        last_optimized DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        shopify_data TEXT,
        sync_version INTEGER DEFAULT 1
      )`,
      `CREATE INDEX IF NOT EXISTS idx_products_status ON products(status)`,
      `CREATE TABLE IF NOT EXISTS optimization_versions (
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
      )`,
      `CREATE TABLE IF NOT EXISTS content_reviews (
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
      )`,
      `CREATE TABLE IF NOT EXISTS ai_providers (
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
      )`,
      `CREATE TABLE IF NOT EXISTS ai_usage_records (
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
      )`,
       `CREATE TABLE IF NOT EXISTS optimization_jobs (
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
      )`,
      `CREATE TABLE IF NOT EXISTS seo_metrics (
        id TEXT PRIMARY KEY,
        productId TEXT NOT NULL,
        keyword TEXT NOT NULL,
        position INTEGER,
        searchVolume INTEGER,
        difficulty INTEGER,
        clickThroughRate REAL,
        impressions INTEGER,
        clicks INTEGER,
        date DATETIME NOT NULL,
        FOREIGN KEY (productId) REFERENCES products (id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS competitor_analysis (
        id TEXT PRIMARY KEY,
        productId TEXT NOT NULL,
        competitorDomain TEXT NOT NULL,
        competitorPosition INTEGER,
        marketShare REAL,
        contentGap TEXT,
        priceComparison REAL,
        strengths TEXT,
        weaknesses TEXT,
        lastAnalyzed DATETIME NOT NULL,
        FOREIGN KEY (productId) REFERENCES products (id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS content_quality_scores (
        id TEXT PRIMARY KEY,
        productId TEXT NOT NULL,
        seoScore REAL,
        readabilityScore REAL,
        brandVoiceScore REAL,
        uniquenessScore REAL,
        keywordOptimization REAL,
        overallScore REAL,
        recommendations TEXT,
        lastCalculated DATETIME NOT NULL,
        FOREIGN KEY (productId) REFERENCES products (id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS trend_analysis (
        id TEXT PRIMARY KEY,
        productId TEXT NOT NULL,
        metric TEXT NOT NULL,
        timeframe TEXT NOT NULL,
        data TEXT,
        trend TEXT,
        changePercentage REAL,
        correlation REAL,
        lastUpdated DATETIME NOT NULL,
        FOREIGN KEY (productId) REFERENCES products (id) ON DELETE CASCADE
      )`,
      `CREATE TABLE IF NOT EXISTS optimization_rules (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT,
        conditions TEXT,
        actions TEXT,
        schedule TEXT,
        isActive BOOLEAN,
        priority INTEGER,
        lastRun DATETIME,
        nextRun DATETIME,
        performance TEXT,
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS customer_segments (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        criteria TEXT,
        customerCount INTEGER DEFAULT 0,
        avgOrderValue REAL,
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS customer_journeys (
        id TEXT PRIMARY KEY,
        customerId TEXT NOT NULL,
        journeyStage TEXT NOT NULL,
        score REAL DEFAULT 0,
        progress REAL DEFAULT 0,
        entryPoint TEXT,
        currentStep TEXT,
        nextStep TEXT,
        metadata TEXT,
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS ab_tests (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'draft',
        variants TEXT,
        metrics TEXT,
        startDate DATETIME,
        endDate DATETIME,
        results TEXT,
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS realtime_analytics (
        id TEXT PRIMARY KEY,
        customerId TEXT,
        productId TEXT,
        action TEXT NOT NULL,
        category TEXT,
        metadata TEXT,
        timestamp DATETIME NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS content_performance (
        id TEXT PRIMARY KEY,
        productId TEXT NOT NULL,
        contentType TEXT NOT NULL,
        views INTEGER DEFAULT 0,
        engagement REAL DEFAULT 0,
        conversions INTEGER DEFAULT 0,
        revenue REAL DEFAULT 0,
        date DATETIME NOT NULL,
        createdAt DATETIME NOT NULL,
        FOREIGN KEY (productId) REFERENCES products (id) ON DELETE CASCADE
      )`
    ];

    for (const query of queries) {
      await this.run(query);
    }

    logger.info('Database tables created successfully');
  }

  async run(query: string, params: any[] = []): Promise<sqlite3.RunResult> {
    if (!this.db) throw new Error('Database not connected');
    return new Promise((resolve, reject) => {
      this.db!.run(query, params, function (err) {
        if (err) {
          logger.error('Database run error:', { query, params, error: err });
          return reject(err);
        }
        resolve(this);
      });
    });
  }

  async get(query: string, params: any[] = []): Promise<any> {
    if (!this.db) throw new Error('Database not connected');
    return new Promise((resolve, reject) => {
      this.db!.get(query, params, (err, row) => {
        if (err) {
          logger.error('Database get error:', { query, params, error: err });
          return reject(err);
        }
        resolve(row);
      });
    });
  }

  async all(query: string, params: any[] = []): Promise<any[]> {
    if (!this.db) throw new Error('Database not connected');
    return new Promise((resolve, reject) => {
      this.db!.all(query, params, (err, rows) => {
        if (err) {
          logger.error('Database all error:', { query, params, error: err });
          return reject(err);
        }
        resolve(rows);
      });
    });
  }

  isConnected(): boolean {
    return this.db !== null;
  }

  async exec(query: string): Promise<void> {
    if (!this.db) throw new Error('Database not connected');
    return new Promise((resolve, reject) => {
      this.db!.exec(query, (err) => {
        if (err) {
          logger.error('Database exec error:', { query, error: err });
          return reject(err);
        }
        resolve();
      });
    });
  }

  async close(): Promise<void> {
    if (!this.db) return;
    return new Promise((resolve, reject) => {
      this.db!.close((err) => {
        if (err) {
          logger.error('Error closing database:', err);
          return reject(err);
        }
        logger.info('Database connection closed');
        resolve();
      });
    });
  }
}

export const database = Database.getInstance();
