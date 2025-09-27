import { database } from './database';
import { logger } from './logger';

export interface DatabaseHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  connected: boolean;
  responseTime: number;
  tables: TableHealth[];
  errors?: string[];
  lastChecked: Date;
}

export interface TableHealth {
  name: string;
  exists: boolean;
  rowCount?: number;
  errors?: string[];
}

export interface SystemHealth {
  database: DatabaseHealth;
  memory: MemoryHealth;
  uptime: number;
  version: string;
}

export interface MemoryHealth {
  used: number;
  total: number;
  percentage: number;
  status: 'healthy' | 'warning' | 'critical';
}

export class HealthChecker {
  private static instance: HealthChecker;
  private lastHealthCheck: DatabaseHealth | null = null;
  private startTime: number = Date.now();

  static getInstance(): HealthChecker {
    if (!HealthChecker.instance) {
      HealthChecker.instance = new HealthChecker();
    }
    return HealthChecker.instance;
  }

  async checkDatabase(): Promise<DatabaseHealth> {
    const startTime = Date.now();
    const errors: string[] = [];
    const tables: TableHealth[] = [];

    try {
      // Check basic connectivity
      const isConnected = database.isConnected();

      if (!isConnected) {
        return {
          status: 'unhealthy',
          connected: false,
          responseTime: 0,
          tables: [],
          errors: ['Database not connected'],
          lastChecked: new Date(),
        };
      }

      // Check basic query performance
      await database.get('SELECT 1 as test');

      // Check each required table
      const requiredTables = [
        'products',
        'optimization_versions',
        'content_reviews',
        'ai_providers',
        'ai_usage_records',
        'optimization_jobs',
      ];

      for (const tableName of requiredTables) {
        try {
          // Check if table exists and get row count
          const result = await database.get(`
            SELECT COUNT(*) as count FROM sqlite_master
            WHERE type='table' AND name=?
          `, [tableName]);

          const tableExists = result.count > 0;

          let rowCount: number | undefined;
          if (tableExists) {
            try {
              const countResult = await database.get(`SELECT COUNT(*) as count FROM ${tableName}`);
              rowCount = countResult.count;
            } catch (error) {
              errors.push(`Failed to get row count for ${tableName}: ${error}`);
            }
          }

          tables.push({
            name: tableName,
            exists: tableExists,
            rowCount,
            errors: tableExists ? undefined : ['Table does not exist'],
          });

          if (!tableExists) {
            errors.push(`Required table ${tableName} does not exist`);
          }
        } catch (error) {
          errors.push(`Error checking table ${tableName}: ${error}`);
          tables.push({
            name: tableName,
            exists: false,
            errors: [String(error)],
          });
        }
      }

      // Check database performance
      const perfStartTime = Date.now();
      await database.get('SELECT COUNT(*) as total FROM products');
      const queryTime = Date.now() - perfStartTime;

      // Determine overall status
      let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';

      if (errors.length > 0) {
        status = 'unhealthy';
      } else if (queryTime > 1000) { // Slow query response
        status = 'degraded';
      }

      const responseTime = Date.now() - startTime;
      const health: DatabaseHealth = {
        status,
        connected: true,
        responseTime,
        tables,
        errors: errors.length > 0 ? errors : undefined,
        lastChecked: new Date(),
      };

      this.lastHealthCheck = health;
      return health;

    } catch (error) {
      logger.error('Database health check failed:', error);
      return {
        status: 'unhealthy',
        connected: false,
        responseTime: Date.now() - startTime,
        tables,
        errors: [String(error)],
        lastChecked: new Date(),
      };
    }
  }

  async checkMemory(): Promise<MemoryHealth> {
    const usage = process.memoryUsage();
    const used = Math.round(usage.heapUsed / 1024 / 1024); // MB
    const total = Math.round(usage.heapTotal / 1024 / 1024); // MB
    const percentage = Math.round((used / total) * 100);

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    if (percentage > 90) {
      status = 'critical';
    } else if (percentage > 75) {
      status = 'warning';
    }

    return {
      used,
      total,
      percentage,
      status,
    };
  }

  async checkSystem(): Promise<SystemHealth> {
    const [database, memory] = await Promise.all([
      this.checkDatabase(),
      this.checkMemory(),
    ]);

    return {
      database,
      memory,
      uptime: Date.now() - this.startTime,
      version: process.version,
    };
  }

  getLastHealthCheck(): DatabaseHealth | null {
    return this.lastHealthCheck;
  }

  async quickCheck(): Promise<boolean> {
    try {
      await database.get('SELECT 1 as test');
      return true;
    } catch {
      return false;
    }
  }
}

export const healthChecker = HealthChecker.getInstance();

// Health check middleware for Express
export function healthCheckMiddleware(req: any, res: any, next: any) {
  res.setHeader('Cache-Control', 'no-store');
  next();
}

// Health check endpoint handlers
export async function getDatabaseHealth(req: any, res: any) {
  try {
    const health = await healthChecker.checkDatabase();

    const statusCode = health.status === 'healthy' ? 200 :
                      health.status === 'degraded' ? 206 : 503;

    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Health check endpoint error:', error);
    res.status(503).json({
      status: 'unhealthy',
      connected: false,
      responseTime: 0,
      tables: [],
      errors: [String(error)],
      lastChecked: new Date(),
    });
  }
}

export async function getSystemHealth(req: any, res: any) {
  try {
    const health = await healthChecker.checkSystem();

    const overallStatus = health.database.status === 'healthy' &&
                         health.memory.status === 'healthy' ? 'healthy' : 'degraded';

    const statusCode = overallStatus === 'healthy' ? 200 : 206;

    res.status(statusCode).json({
      status: overallStatus,
      ...health,
    });
  } catch (error) {
    logger.error('System health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      database: {
        status: 'unhealthy',
        connected: false,
        responseTime: 0,
        tables: [],
        errors: [String(error)],
        lastChecked: new Date(),
      },
      memory: {
        used: 0,
        total: 0,
        percentage: 0,
        status: 'critical',
      },
      uptime: 0,
      version: process.version,
    });
  }
}

// Ready check for Kubernetes/liveness probes
export async function readyCheck(req: any, res: any) {
  const isReady = await healthChecker.quickCheck();

  if (isReady) {
    res.status(200).json({ status: 'ready' });
  } else {
    res.status(503).json({ status: 'not ready' });
  }
}

// Live check for Kubernetes/liveness probes
export async function liveCheck(req: any, res: any) {
  res.status(200).json({ status: 'alive' });
}