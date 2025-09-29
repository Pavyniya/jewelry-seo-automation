import { performance } from 'perf_hooks';
import { EventSource } from 'eventsource';

export interface PerformanceMetrics {
  timestamp: number;
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  memory: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  api: {
    requests: number;
    responseTime: {
      p50: number;
      p95: number;
      p99: number;
    };
    errorRate: number;
  };
  database: {
    connections: number;
    queries: number;
    avgQueryTime: number;
  };
  cache: {
    hitRate: number;
    size: number;
    memoryUsage: number;
  };
}

export interface AlertConfig {
  cpu: {
    warning: number;
    critical: number;
  };
  memory: {
    warning: number;
    critical: number;
  };
  responseTime: {
    warning: number;
    critical: number;
  };
  errorRate: {
    warning: number;
    critical: number;
  };
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private alerts: string[] = [];
  private subscribers: Array<(metrics: PerformanceMetrics) => void> = [];
  private alertHandlers: Array<(alert: string, level: 'warning' | 'critical') => void> = [];
  private intervalId: NodeJS.Timeout | null = null;
  private apiMetrics: Map<string, number[]> = new Map();

  private readonly config: AlertConfig = {
    cpu: { warning: 70, critical: 90 },
    memory: { warning: 80, critical: 95 },
    responseTime: { warning: 200, critical: 500 },
    errorRate: { warning: 5, critical: 10 },
  };

  constructor() {
    this.startMonitoring();
  }

  public startMonitoring(interval: number = 30000) {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.intervalId = setInterval(async () => {
      try {
        const metrics = await this.collectMetrics();
        this.processMetrics(metrics);
      } catch (error) {
        console.error('Error collecting metrics:', error);
      }
    }, interval);

    console.log(`Performance monitoring started with ${interval}ms interval`);
  }

  public stopMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Performance monitoring stopped');
    }
  }

  private async collectMetrics(): Promise<PerformanceMetrics> {
    const timestamp = Date.now();

    // Collect CPU metrics
    const cpu = await this.getCPUMetrics();

    // Collect memory metrics
    const memory = this.getMemoryMetrics();

    // Collect API metrics
    const api = this.getAPIMetrics();

    // Collect database metrics
    const database = await this.getDatabaseMetrics();

    // Collect cache metrics
    const cache = this.getCacheMetrics();

    return {
      timestamp,
      cpu,
      memory,
      api,
      database,
      cache,
    };
  }

  private async getCPUMetrics() {
    // Simple CPU usage calculation
    const startUsage = process.cpuUsage();
    await new Promise(resolve => setTimeout(resolve, 100));
    const endUsage = process.cpuUsage(startUsage);

    const totalUsage = endUsage.user + endUsage.system;
    const percentage = (totalUsage / 100000) * 100; // Convert to percentage

    return {
      usage: Math.min(percentage, 100),
      loadAverage: this.getLoadAverage(),
    };
  }

  private getLoadAverage(): number[] {
    // This would typically read from /proc/loadavg on Linux
    // For now, return simulated values
    return [0.5, 0.6, 0.7];
  }

  private getMemoryMetrics() {
    const usage = process.memoryUsage();
    const total = require('os').totalmem();
    const free = require('os').freemem();
    const used = total - free;

    return {
      total,
      used,
      free,
      percentage: (used / total) * 100,
    };
  }

  private getAPIMetrics() {
    const responseTimes = Array.from(this.apiMetrics.values()).flat();
    const sorted = responseTimes.sort((a, b) => a - b);

    const p50 = this.percentile(sorted, 50);
    const p95 = this.percentile(sorted, 95);
    const p99 = this.percentile(sorted, 99);

    return {
      requests: responseTimes.length,
      responseTime: { p50, p95, p99 },
      errorRate: this.calculateErrorRate(),
    };
  }

  private async getDatabaseMetrics() {
    // This would typically query database statistics
    // For now, return simulated values
    return {
      connections: 5,
      queries: 150,
      avgQueryTime: 45,
    };
  }

  private getCacheMetrics() {
    // This would typically query cache statistics
    // For now, return simulated values
    return {
      hitRate: 0.85,
      size: 1000,
      memoryUsage: 50 * 1024 * 1024, // 50MB
    };
  }

  private calculateErrorRate(): number {
    // This would typically track HTTP errors
    // For now, return a simulated low error rate
    return 0.5;
  }

  private percentile(sortedArray: number[], p: number): number {
    if (sortedArray.length === 0) return 0;
    const index = Math.ceil((p / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, Math.min(index, sortedArray.length - 1))];
  }

  private processMetrics(metrics: PerformanceMetrics) {
    // Store metrics (keep last 1000 entries)
    this.metrics.push(metrics);
    if (this.metrics.length > 1000) {
      this.metrics.shift();
    }

    // Check for alerts
    this.checkAlerts(metrics);

    // Notify subscribers
    this.subscribers.forEach(subscriber => {
      try {
        subscriber(metrics);
      } catch (error) {
        console.error('Error in metrics subscriber:', error);
      }
    });
  }

  private checkAlerts(metrics: PerformanceMetrics) {
    const timestamp = new Date(metrics.timestamp).toISOString();

    // CPU alerts
    if (metrics.cpu.usage > this.config.cpu.critical) {
      this.triggerAlert(`CRITICAL: CPU usage at ${metrics.cpu.usage.toFixed(1)}% (>${this.config.cpu.critical}%)`, 'critical');
    } else if (metrics.cpu.usage > this.config.cpu.warning) {
      this.triggerAlert(`WARNING: CPU usage at ${metrics.cpu.usage.toFixed(1)}% (>${this.config.cpu.warning}%)`, 'warning');
    }

    // Memory alerts
    if (metrics.memory.percentage > this.config.memory.critical) {
      this.triggerAlert(`CRITICAL: Memory usage at ${metrics.memory.percentage.toFixed(1)}% (>${this.config.memory.critical}%)`, 'critical');
    } else if (metrics.memory.percentage > this.config.memory.warning) {
      this.triggerAlert(`WARNING: Memory usage at ${metrics.memory.percentage.toFixed(1)}% (>${this.config.memory.warning}%)`, 'warning');
    }

    // Response time alerts
    if (metrics.api.responseTime.p95 > this.config.responseTime.critical) {
      this.triggerAlert(`CRITICAL: P95 response time at ${metrics.api.responseTime.p95}ms (>${this.config.responseTime.critical}ms)`, 'critical');
    } else if (metrics.api.responseTime.p95 > this.config.responseTime.warning) {
      this.triggerAlert(`WARNING: P95 response time at ${metrics.api.responseTime.p95}ms (>${this.config.responseTime.warning}ms)`, 'warning');
    }

    // Error rate alerts
    if (metrics.api.errorRate > this.config.errorRate.critical) {
      this.triggerAlert(`CRITICAL: Error rate at ${metrics.api.errorRate}% (>${this.config.errorRate.critical}%)`, 'critical');
    } else if (metrics.api.errorRate > this.config.errorRate.warning) {
      this.triggerAlert(`WARNING: Error rate at ${metrics.api.errorRate}% (>${this.config.errorRate.warning}%)`, 'warning');
    }
  }

  private triggerAlert(message: string, level: 'warning' | 'critical') {
    const alert = `[${level.toUpperCase()}] ${message}`;

    // Avoid duplicate alerts within 5 minutes
    const recentAlerts = this.alerts.slice(-10);
    if (recentAlerts.some(a => a.includes(message))) {
      return;
    }

    this.alerts.push(alert);
    if (this.alerts.length > 100) {
      this.alerts.shift();
    }

    console.error(alert);

    // Notify alert handlers
    this.alertHandlers.forEach(handler => {
      try {
        handler(message, level);
      } catch (error) {
        console.error('Error in alert handler:', error);
      }
    });
  }

  // Public API
  public recordAPIMetrics(endpoint: string, responseTime: number, isError: boolean = false) {
    if (!this.apiMetrics.has(endpoint)) {
      this.apiMetrics.set(endpoint, []);
    }

    const metrics = this.apiMetrics.get(endpoint)!;
    metrics.push(responseTime);

    // Keep only last 1000 requests per endpoint
    if (metrics.length > 1000) {
      metrics.shift();
    }
  }

  public subscribe(callback: (metrics: PerformanceMetrics) => void) {
    this.subscribers.push(callback);
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  public onAlert(callback: (alert: string, level: 'warning' | 'critical') => void) {
    this.alertHandlers.push(callback);
    return () => {
      const index = this.alertHandlers.indexOf(callback);
      if (index > -1) {
        this.alertHandlers.splice(index, 1);
      }
    };
  }

  public getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  public getRecentMetrics(minutes: number = 60): PerformanceMetrics[] {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    return this.metrics.filter(m => m.timestamp > cutoff);
  }

  public getAlerts(): string[] {
    return [...this.alerts];
  }

  public getSummary() {
    const recentMetrics = this.getRecentMetrics(60);

    if (recentMetrics.length === 0) {
      return {
        status: 'insufficient_data',
        message: 'No metrics available in the last hour',
      };
    }

    const avgCpu = recentMetrics.reduce((sum, m) => sum + m.cpu.usage, 0) / recentMetrics.length;
    const avgMemory = recentMetrics.reduce((sum, m) => sum + m.memory.percentage, 0) / recentMetrics.length;
    const avgResponseTime = recentMetrics.reduce((sum, m) => sum + m.api.responseTime.p95, 0) / recentMetrics.length;
    const avgErrorRate = recentMetrics.reduce((sum, m) => sum + m.api.errorRate, 0) / recentMetrics.length;

    let status = 'healthy';
    const issues = [];

    if (avgCpu > this.config.cpu.warning) {
      status = 'degraded';
      issues.push(`High CPU usage: ${avgCpu.toFixed(1)}%`);
    }

    if (avgMemory > this.config.memory.warning) {
      status = 'degraded';
      issues.push(`High memory usage: ${avgMemory.toFixed(1)}%`);
    }

    if (avgResponseTime > this.config.responseTime.warning) {
      status = 'degraded';
      issues.push(`High response time: ${avgResponseTime.toFixed(0)}ms`);
    }

    if (avgErrorRate > this.config.errorRate.warning) {
      status = 'degraded';
      issues.push(`High error rate: ${avgErrorRate.toFixed(1)}%`);
    }

    return {
      status,
      issues,
      metrics: {
        cpu: avgCpu.toFixed(1),
        memory: avgMemory.toFixed(1),
        responseTime: avgResponseTime.toFixed(0),
        errorRate: avgErrorRate.toFixed(1),
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      },
    };
  }

  // Express middleware for API monitoring
  public middleware() {
    return (req: any, res: any, next: any) => {
      const start = performance.now();
      const endpoint = `${req.method} ${req.route?.path || req.path}`;

      res.on('finish', () => {
        const responseTime = performance.now() - start;
        const isError = res.statusCode >= 400;

        this.recordAPIMetrics(endpoint, responseTime, isError);
      });

      next();
    };
  }

  // Health check endpoint
  public healthCheck() {
    const summary = this.getSummary();

    return {
      status: summary.status === 'healthy' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      metrics: summary.metrics,
      alerts: this.alerts.slice(-5), // Last 5 alerts
    };
  }

  // Cleanup
  public destroy() {
    this.stopMonitoring();
    this.subscribers.length = 0;
    this.alertHandlers.length = 0;
    this.metrics.length = 0;
    this.alerts.length = 0;
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();