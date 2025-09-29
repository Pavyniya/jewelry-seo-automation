import Redis from 'ioredis';
import NodeCache from 'node-cache';
import { createHash } from 'crypto';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  strategy?: 'memory' | 'redis' | 'hybrid';
  compress?: boolean;
  serialize?: boolean;
}

export interface CacheStats {
  memory: {
    size: number;
    hits: number;
    misses: number;
    hitRate: number;
  };
  redis?: {
    size: number;
    hits: number;
    misses: number;
    hitRate: number;
  };
  total: {
    hits: number;
    misses: number;
    hitRate: number;
  };
}

export class CacheManager {
  private redis: Redis | null = null;
  private memoryCache: NodeCache;
  private stats = {
    memory: { hits: 0, misses: 0 },
    redis: { hits: 0, misses: 0 },
  };

  constructor() {
    // Initialize in-memory cache
    this.memoryCache = new NodeCache({
      stdTTL: 300, // 5 minutes default
      checkperiod: 60, // Check for expired items every minute
      useClones: false,
    });

    // Initialize Redis if available
    if (process.env.REDIS_URL) {
      try {
        this.redis = new Redis(process.env.REDIS_URL, {
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 3,
          lazyConnect: true,
          enableReadyCheck: false,
        });

        this.redis.on('error', (error) => {
          console.warn('Redis connection error, falling back to memory cache:', error.message);
          this.redis = null;
        });

        this.redis.on('connect', () => {
          console.log('Redis connected successfully');
        });
      } catch (error) {
        console.warn('Failed to initialize Redis:', error);
        this.redis = null;
      }
    }
  }

  private generateKey(key: string, prefix?: string): string {
    const baseKey = prefix ? `${prefix}:${key}` : key;
    return createHash('sha256').update(baseKey).digest('hex').substring(0, 16);
  }

  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    const { strategy = 'hybrid' } = options;
    const cacheKey = this.generateKey(key);

    // Try memory cache first
    if (strategy === 'memory' || strategy === 'hybrid') {
      const memoryResult = this.memoryCache.get<T>(cacheKey);
      if (memoryResult !== undefined) {
        this.stats.memory.hits++;
        return memoryResult;
      }
      this.stats.memory.misses++;
    }

    // Try Redis cache
    if (this.redis && (strategy === 'redis' || strategy === 'hybrid')) {
      try {
        const redisResult = await this.redis.get(cacheKey);
        if (redisResult) {
          const parsed = JSON.parse(redisResult);

          // Store in memory cache for faster subsequent access
          if (strategy === 'hybrid') {
            this.memoryCache.set(cacheKey, parsed, options.ttl);
          }

          this.stats.redis.hits++;
          return parsed;
        }
        this.stats.redis.misses++;
      } catch (error) {
        console.warn('Redis get error:', error);
      }
    }

    return null;
  }

  async set<T>(
    key: string,
    value: T,
    options: CacheOptions = {}
  ): Promise<void> {
    const { strategy = 'hybrid', ttl = 300, compress = false, serialize = true } = options;
    const cacheKey = this.generateKey(key);

    let processedValue = value;

    // Serialize value if needed
    if (serialize && typeof value === 'object') {
      processedValue = JSON.stringify(value);
    }

    // Set in memory cache
    if (strategy === 'memory' || strategy === 'hybrid') {
      this.memoryCache.set(cacheKey, value, ttl);
    }

    // Set in Redis cache
    if (this.redis && (strategy === 'redis' || strategy === 'hybrid')) {
      try {
        if (serialize && typeof value === 'object') {
          await this.redis.setex(cacheKey, ttl, processedValue);
        } else {
          await this.redis.setex(cacheKey, ttl, value);
        }
      } catch (error) {
        console.warn('Redis set error:', error);
      }
    }
  }

  async del(key: string, options: CacheOptions = {}): Promise<void> {
    const { strategy = 'hybrid' } = options;
    const cacheKey = this.generateKey(key);

    // Delete from memory cache
    if (strategy === 'memory' || strategy === 'hybrid') {
      this.memoryCache.del(cacheKey);
    }

    // Delete from Redis cache
    if (this.redis && (strategy === 'redis' || strategy === 'hybrid')) {
      try {
        await this.redis.del(cacheKey);
      } catch (error) {
        console.warn('Redis del error:', error);
      }
    }
  }

  async invalidate(pattern: string, options: CacheOptions = {}): Promise<void> {
    const { strategy = 'hybrid' } = options;

    // Clear from memory cache
    if (strategy === 'memory' || strategy === 'hybrid') {
      const keys = this.memoryCache.keys();
      const matchingKeys = keys.filter(key => key.includes(pattern));
      this.memoryCache.del(matchingKeys);
    }

    // Clear from Redis cache
    if (this.redis && (strategy === 'redis' || strategy === 'hybrid')) {
      try {
        const redisKeys = await this.redis.keys(`*${pattern}*`);
        if (redisKeys.length > 0) {
          await this.redis.del(...redisKeys);
        }
      } catch (error) {
        console.warn('Redis invalidate error:', error);
      }
    }
  }

  async exists(key: string, options: CacheOptions = {}): Promise<boolean> {
    const { strategy = 'hybrid' } = options;
    const cacheKey = this.generateKey(key);

    // Check memory cache
    if (strategy === 'memory' || strategy === 'hybrid') {
      if (this.memoryCache.has(cacheKey)) {
        return true;
      }
    }

    // Check Redis cache
    if (this.redis && (strategy === 'redis' || strategy === 'hybrid')) {
      try {
        const exists = await this.redis.exists(cacheKey);
        return exists === 1;
      } catch (error) {
        console.warn('Redis exists error:', error);
      }
    }

    return false;
  }

  async ttl(key: string, options: CacheOptions = {}): Promise<number> {
    const { strategy = 'hybrid' } = options;
    const cacheKey = this.generateKey(key);

    // Check Redis TTL (more accurate)
    if (this.redis && (strategy === 'redis' || strategy === 'hybrid')) {
      try {
        return await this.redis.ttl(cacheKey);
      } catch (error) {
        console.warn('Redis ttl error:', error);
      }
    }

    // Return memory cache TTL (less accurate)
    if (strategy === 'memory' || strategy === 'hybrid') {
      const ttl = this.memoryCache.getTTL(cacheKey);
      return ttl > 0 ? Math.floor((ttl - Date.now()) / 1000) : -1;
    }

    return -1;
  }

  getStats(): CacheStats {
    const memoryHitRate = this.stats.memory.hits + this.stats.memory.misses > 0
      ? this.stats.memory.hits / (this.stats.memory.hits + this.stats.memory.misses)
      : 0;

    const redisHitRate = this.redis && this.stats.redis.hits + this.stats.redis.misses > 0
      ? this.stats.redis.hits / (this.stats.redis.hits + this.stats.redis.misses)
      : 0;

    const totalHits = this.stats.memory.hits + this.stats.redis.hits;
    const totalMisses = this.stats.memory.misses + this.stats.redis.misses;
    const totalHitRate = totalHits + totalMisses > 0 ? totalHits / (totalHits + totalMisses) : 0;

    const stats: CacheStats = {
      memory: {
        size: this.memoryCache.keys().length,
        hits: this.stats.memory.hits,
        misses: this.stats.memory.misses,
        hitRate: memoryHitRate,
      },
      total: {
        hits: totalHits,
        misses: totalMisses,
        hitRate: totalHitRate,
      },
    };

    if (this.redis) {
      stats.redis = {
        size: -1, // Redis size would require separate command
        hits: this.stats.redis.hits,
        misses: this.stats.redis.misses,
        hitRate: redisHitRate,
      };
    }

    return stats;
  }

  // Express middleware for caching responses
  middleware(options: CacheOptions = {}) {
    return async (req: any, res: any, next: any) => {
      if (req.method !== 'GET') {
        return next();
      }

      const key = `${req.path}:${JSON.stringify(req.query)}`;
      const cached = await this.get(key, options);

      if (cached) {
        res.set('X-Cache', 'HIT');
        return res.json(cached);
      }

      const originalJson = res.json;
      res.json = (body: any) => {
        this.set(key, body, options);
        res.set('X-Cache', 'MISS');
        return originalJson.call(res, body);
      };

      next();
    };
  }

  // Cache warming utilities
  async warmCache<T>(
    keys: string[],
    fetchFn: (key: string) => Promise<T>,
    options: CacheOptions = {}
  ): Promise<void> {
    const batchSize = 10;
    for (let i = 0; i < keys.length; i += batchSize) {
      const batch = keys.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (key) => {
          try {
            if (!(await this.exists(key, options))) {
              const value = await fetchFn(key);
              await this.set(key, value, options);
            }
          } catch (error) {
            console.warn(`Failed to warm cache for key ${key}:`, error);
          }
        })
      );
    }
  }

  // Cache utility methods
  async remember<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = await this.get<T>(key, options);
    if (cached !== null) {
      return cached;
    }

    const value = await fetchFn();
    await this.set(key, value, options);
    return value;
  }

  // Clear all caches
  async clear(): Promise<void> {
    this.memoryCache.flushAll();
    if (this.redis) {
      try {
        await this.redis.flushdb();
      } catch (error) {
        console.warn('Redis clear error:', error);
      }
    }
  }

  // Cleanup
  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}

// Export singleton instance
export const cacheManager = new CacheManager();

// Cache key generators for common use cases
export const cacheKeys = {
  products: {
    list: (filters?: any) => `products:list:${JSON.stringify(filters)}`,
    detail: (id: string) => `products:detail:${id}`,
    optimization: (id: string) => `products:optimization:${id}`,
  },
  analytics: {
    summary: (dateRange: string) => `analytics:summary:${dateRange}`,
    trends: (metric: string, days: number) => `analytics:trends:${metric}:${days}`,
  },
  auth: {
    user: (id: string) => `auth:user:${id}`,
    permissions: (id: string) => `auth:permissions:${id}`,
  },
  ai: {
    usage: (provider: string, date: string) => `ai:usage:${provider}:${date}`,
    models: (provider: string) => `ai:models:${provider}`,
  },
};