import express from 'express';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { performance } from 'perf_hooks';
import { createHash } from 'crypto';

export class PerformanceOptimization {
  private app: express.Application;
  private metrics: Map<string, number[]> = new Map();
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupCaching();
    this.setupMonitoring();
    this.setupRateLimiting();
  }

  private setupMiddleware() {
    // Response compression with optimal settings
    this.app.use(compression({
      level: 6,
      threshold: 1024,
      filter: (req, res) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        return compression.filter(req, res);
      },
    }));

    // Security headers with performance optimizations
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    }));

    // Enable keep-alive connections
    this.app.set('keep alive timeout', 65000);

    // Trust proxy for accurate IP addresses
    this.app.set('trust proxy', true);
  }

  private setupCaching() {
    // Cache middleware for GET requests
    this.app.use('/api/', this.cacheMiddleware.bind(this));
  }

  private cacheMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = this.generateCacheKey(req);
    const cachedResponse = this.cache.get(cacheKey);

    if (cachedResponse && Date.now() - cachedResponse.timestamp < cachedResponse.ttl) {
      return res.json(cachedResponse.data);
    }

    // Override res.json to cache the response
    const originalJson = res.json;
    res.json = function(body: any) {
      const ttl = this.calculateTTL(req);
      this.cache.set(cacheKey, {
        data: body,
        timestamp: Date.now(),
        ttl,
      });
      return originalJson.call(this, body);
    }.bind(this);

    next();
  }

  private generateCacheKey(req: express.Request): string {
    const url = req.originalUrl;
    const queryParams = new URLSearchParams(req.query as any).toString();
    const authHeader = req.headers.authorization;

    return createHash('sha256')
      .update(`${url}?${queryParams}${authHeader || ''}`)
      .digest('hex');
  }

  private calculateTTL(req: express.Request): number {
    // Different TTLs for different endpoints
    if (req.path.includes('/products')) {
      return 5 * 60 * 1000; // 5 minutes for products
    }
    if (req.path.includes('/analytics')) {
      return 60 * 60 * 1000; // 1 hour for analytics
    }
    if (req.path.includes('/auth/me')) {
      return 2 * 60 * 1000; // 2 minutes for user info
    }
    return 30 * 1000; // 30 seconds default
  }

  private setupMonitoring() {
    // Request timing middleware
    this.app.use((req, res, next) => {
      const start = performance.now();
      const originalEnd = res.end;

      res.end = function(chunk?: any, encoding?: any) {
        const duration = performance.now() - start;

        // Record metrics
        this.recordMetrics(req.method, req.path, res.statusCode, duration);

        // Add performance headers
        res.set('X-Response-Time', `${duration.toFixed(2)}ms`);
        res.set('X-Cache', this.isCached(req.originalUrl) ? 'HIT' : 'MISS');

        return originalEnd.call(this, chunk, encoding);
      }.bind(this);

      next();
    }.bind(this));
  }

  private setupRateLimiting() {
    // General API rate limiting
    const apiLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: {
        error: 'Too many requests',
        message: 'Please try again later',
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

    this.app.use('/api/', apiLimiter);

    // Stricter rate limiting for expensive endpoints
    const expensiveLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 20,
      message: {
        error: 'Too many expensive operations',
        message: 'Please reduce your request rate',
      },
    });

    this.app.use('/api/analytics/', expensiveLimiter);
    this.app.use('/api/products/optimize', expensiveLimiter);

    // Slow down middleware to prevent abuse
    const speedLimiter = slowDown({
      windowMs: 15 * 60 * 1000, // 15 minutes
      delayAfter: 50, // allow 50 requests per 15 minutes, then...
      delayMs: 500, // begin adding 500ms of delay per request
      maxDelayMs: 5000, // max delay of 5 seconds
    });

    this.app.use('/api/', speedLimiter);
  }

  private recordMetrics(method: string, path: string, statusCode: number, duration: number) {
    const key = `${method} ${path}`;

    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }

    const metrics = this.metrics.get(key)!;
    metrics.push(duration);

    // Keep only last 100 requests
    if (metrics.length > 100) {
      metrics.shift();
    }
  }

  private isCached(url: string): boolean {
    for (const [key, value] of this.cache.entries()) {
      if (url.includes(key.split('_')[0]) && Date.now() - value.timestamp < value.ttl) {
        return true;
      }
    }
    return false;
  }

  // Public methods for performance management
  getMetrics() {
    const result: Record<string, any> = {};

    for (const [key, durations] of this.metrics.entries()) {
      const sorted = [...durations].sort((a, b) => a - b);
      const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
      const p50 = sorted[Math.floor(sorted.length * 0.5)];
      const p95 = sorted[Math.floor(sorted.length * 0.95)];
      const p99 = sorted[Math.floor(sorted.length * 0.99)];

      result[key] = {
        count: durations.length,
        avg: avg.toFixed(2),
        p50: p50.toFixed(2),
        p95: p95.toFixed(2),
        p99: p99.toFixed(2),
        min: Math.min(...durations).toFixed(2),
        max: Math.max(...durations).toFixed(2),
      };
    }

    return result;
  }

  clearCache(pattern?: string) {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  getCacheStats() {
    let hits = 0;
    let misses = 0;
    const now = Date.now();

    for (const value of this.cache.values()) {
      if (now - value.timestamp < value.ttl) {
        hits++;
      } else {
        misses++;
      }
    }

    return {
      size: this.cache.size,
      hits,
      misses,
      hitRate: hits / (hits + misses) || 0,
    };
  }

  // Express middleware for use in routes
  getCacheMiddleware(ttl: number = 30000) {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
      if (req.method !== 'GET') {
        return next();
      }

      const cacheKey = this.generateCacheKey(req);
      const cached = this.cache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < ttl) {
        return res.json(cached.data);
      }

      const originalJson = res.json;
      res.json = function(body: any) {
        this.cache.set(cacheKey, {
          data: body,
          timestamp: Date.now(),
          ttl,
        });
        return originalJson.call(this, body);
      }.bind(this);

      next();
    }.bind(this);
  }

  // Middleware for request/response size optimization
  getOptimizationMiddleware() {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
      // Add response compression hints
      res.set('Vary', 'Accept-Encoding');

      // Enable Brotli compression if available
      if (req.acceptsEncodings('br')) {
        res.set('Content-Encoding', 'br');
      } else if (req.acceptsEncodings('gzip')) {
        res.set('Content-Encoding', 'gzip');
      }

      // Add connection keep-alive
      res.set('Connection', 'keep-alive');

      next();
    };
  }
}

// Export singleton instance
export const performanceOptimization = new PerformanceOptimization();