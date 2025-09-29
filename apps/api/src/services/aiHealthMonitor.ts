import {
  ProviderHealth,
  ProviderHealthCheck,
  CircuitBreakerState,
  AiProviderConfig,
  FailoverConfig,
  RetryStrategy
} from '@jewelry-seo/shared/types/aiProvider';
import { EventEmitter } from 'events';

export class AIHealthMonitor extends EventEmitter {
  private healthChecks: Map<string, ProviderHealth> = new Map();
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private providers: Map<string, AiProviderConfig> = new Map();
  private failoverConfigs: Map<string, FailoverConfig> = new Map();
  private healthCheckInterval: any | null = null;
  private isMonitoring = false;

  constructor() {
    super();
    this.initializeDefaultProviders();
  }

  private initializeDefaultProviders() {
    // Initialize with real AI provider configurations
    const defaultProviders: AiProviderConfig[] = [
      {
        id: 'gemini-pro',
        name: 'Google Gemini Pro',
        apiKey: process.env.GEMINI_API_KEY || '',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
        model: 'gemini-pro',
        maxTokens: 2048,
        rateLimit: 60,
        costPerToken: 0.000002,
        priority: 1,
        specialties: ['content_generation', 'seo_optimization', 'product_descriptions'],
        isActive: true,
        circuitBreakerThreshold: 5,
        retryAttempts: 3
      },
      {
        id: 'claude-3',
        name: 'Anthropic Claude 3',
        apiKey: process.env.CLAUDE_API_KEY || '',
        baseUrl: 'https://api.anthropic.com/v1',
        model: 'claude-3-sonnet-20240229',
        maxTokens: 4096,
        rateLimit: 50,
        costPerToken: 0.000015,
        priority: 2,
        specialties: ['creative_content', 'brand_voice', 'long_form_content'],
        isActive: true,
        circuitBreakerThreshold: 3,
        retryAttempts: 3
      },
      {
        id: 'gpt-4',
        name: 'OpenAI GPT-4',
        apiKey: process.env.OPENAI_API_KEY || '',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4',
        maxTokens: 8192,
        rateLimit: 200,
        costPerToken: 0.00003,
        priority: 3,
        specialties: ['technical_content', 'analysis', 'complex_reasoning'],
        isActive: true,
        circuitBreakerThreshold: 3,
        retryAttempts: 3
      }
    ];

    defaultProviders.forEach(provider => {
      this.providers.set(provider.id, provider);
      this.initializeHealthCheck(provider);
      this.initializeCircuitBreaker(provider);
    });
  }

  private initializeHealthCheck(provider: AiProviderConfig) {
    const health: ProviderHealth = {
      id: provider.id,
      provider: provider.name,
      status: 'healthy',
      responseTime: 0,
      errorRate: 0,
      successRate: 100,
      lastChecked: new Date(),
      consecutiveFailures: 0,
      circuitState: 'closed'
    };
    this.healthChecks.set(provider.id, health);
  }

  private initializeCircuitBreaker(provider: AiProviderConfig) {
    const circuitBreaker: CircuitBreakerState = {
      providerId: provider.id,
      state: 'closed',
      failureCount: 0,
      threshold: provider.circuitBreakerThreshold,
      timeout: 60000, // 1 minute timeout
      recoveryTime: undefined
    };
    this.circuitBreakers.set(provider.id, circuitBreaker);
  }

  public startMonitoring(intervalMs: number = 30000) {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, intervalMs);

    console.log(`AI Health Monitor started with ${intervalMs}ms interval`);
  }

  public stopMonitoring() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    this.isMonitoring = false;
    console.log('AI Health Monitor stopped');
  }

  private async performHealthChecks() {
    const checkPromises = Array.from(this.providers.values())
      .filter(provider => provider.isActive)
      .map(provider => this.checkProviderHealth(provider));

    const results = await Promise.allSettled(checkPromises);

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const healthCheck = result.value;
        this.updateProviderHealth(healthCheck);
      } else {
        console.error(`Health check failed for provider ${index}:`, result.reason);
      }
    });
  }

  private async checkProviderHealth(provider: AiProviderConfig): Promise<ProviderHealthCheck> {
    const startTime = Date.now();

    try {
      // Simulate real API health check - in production, this would make actual API calls
      const responseTime = Math.random() * 500 + 100; // 100-600ms
      const isSuccess = Math.random() > 0.05; // 95% success rate

      await new Promise(resolve => setTimeout(resolve, responseTime));

      const healthCheck: ProviderHealthCheck = {
        providerId: provider.id,
        status: isSuccess ? 'pass' : 'fail',
        responseTime,
        timestamp: new Date(),
        metrics: {
          requestsPerMinute: Math.floor(Math.random() * 50) + 10,
          errorRate: isSuccess ? Math.random() * 2 : Math.random() * 10 + 5,
          cpu: Math.random() * 70 + 20,
          memory: Math.random() * 60 + 30
        }
      };

      if (!isSuccess) {
        healthCheck.error = 'Service temporarily unavailable';
      }

      return healthCheck;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        providerId: provider.id,
        status: 'fail',
        responseTime,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
        metrics: {
          requestsPerMinute: 0,
          errorRate: 100,
          cpu: 0,
          memory: 0
        }
      };
    }
  }

  private updateProviderHealth(healthCheck: ProviderHealthCheck) {
    const currentHealth = this.healthChecks.get(healthCheck.providerId);
    const circuitBreaker = this.circuitBreakers.get(healthCheck.providerId);

    if (!currentHealth || !circuitBreaker) return;

    // Update basic health metrics
    currentHealth.responseTime = healthCheck.responseTime;
    currentHealth.lastChecked = healthCheck.timestamp;

    if (healthCheck.status === 'pass') {
      currentHealth.consecutiveFailures = 0;
      currentHealth.successRate = Math.min(100, currentHealth.successRate + 1);
      currentHealth.errorRate = Math.max(0, currentHealth.errorRate - 1);

      // Reset circuit breaker on success
      if (circuitBreaker.state === 'half-open') {
        circuitBreaker.state = 'closed';
        circuitBreaker.failureCount = 0;
        currentHealth.circuitState = 'closed';
      }
    } else {
      currentHealth.consecutiveFailures++;
      currentHealth.successRate = Math.max(0, currentHealth.successRate - 5);
      currentHealth.errorRate = Math.min(100, currentHealth.errorRate + 5);

      // Update circuit breaker
      circuitBreaker.failureCount++;
      circuitBreaker.lastFailureTime = new Date();

      if (circuitBreaker.failureCount >= circuitBreaker.threshold) {
        circuitBreaker.state = 'open';
        circuitBreaker.recoveryTime = new Date(Date.now() + circuitBreaker.timeout);
        currentHealth.circuitState = 'open';
      }
    }

    // Update overall status
    if (currentHealth.circuitState === 'open') {
      currentHealth.status = 'down';
    } else if (currentHealth.errorRate > 10 || currentHealth.responseTime > 2000) {
      currentHealth.status = 'degraded';
    } else {
      currentHealth.status = 'healthy';
    }

    // Emit health update event
    this.emit('healthUpdate', {
      providerId: healthCheck.providerId,
      health: currentHealth,
      circuitBreaker
    });

    // Check if circuit breaker should attempt recovery
    if (circuitBreaker.state === 'open' && circuitBreaker.recoveryTime) {
      if (new Date() >= circuitBreaker.recoveryTime) {
        circuitBreaker.state = 'half-open';
        currentHealth.circuitState = 'half-open';
        currentHealth.status = 'degraded';
      }
    }
  }

  public getProviderHealth(providerId: string): ProviderHealth | undefined {
    return this.healthChecks.get(providerId);
  }

  public getAllProviderHealth(): ProviderHealth[] {
    return Array.from(this.healthChecks.values());
  }

  public getHealthyProviders(): ProviderHealth[] {
    return Array.from(this.healthChecks.values())
      .filter(health => health.status === 'healthy');
  }

  public getCircuitBreakerState(providerId: string): CircuitBreakerState | undefined {
    return this.circuitBreakers.get(providerId);
  }

  public isProviderAvailable(providerId: string): boolean {
    const health = this.healthChecks.get(providerId);
    const circuitBreaker = this.circuitBreakers.get(providerId);

    if (!health || !circuitBreaker) return false;

    return health.status === 'healthy' && circuitBreaker.state === 'closed';
  }

  public getAvailableProviders(): string[] {
    return Array.from(this.healthChecks.values())
      .filter(health => this.isProviderAvailable(health.id))
      .map(health => health.id);
  }

  public recordRequestResult(providerId: string, success: boolean, responseTime: number) {
    const health = this.healthChecks.get(providerId);
    const circuitBreaker = this.circuitBreakers.get(providerId);

    if (!health || !circuitBreaker) return;

    // Update health metrics
    if (success) {
      health.consecutiveFailures = 0;
      health.successRate = Math.min(100, health.successRate + 0.5);
      health.errorRate = Math.max(0, health.errorRate - 0.5);
    } else {
      health.consecutiveFailures++;
      health.successRate = Math.max(0, health.successRate - 2);
      health.errorRate = Math.min(100, health.errorRate + 2);

      // Update circuit breaker
      circuitBreaker.failureCount++;
      circuitBreaker.lastFailureTime = new Date();

      if (circuitBreaker.failureCount >= circuitBreaker.threshold) {
        circuitBreaker.state = 'open';
        circuitBreaker.recoveryTime = new Date(Date.now() + circuitBreaker.timeout);
        health.circuitState = 'open';
        health.status = 'down';
      }
    }

    health.responseTime = Math.round((health.responseTime * 0.7) + (responseTime * 0.3));
    health.lastChecked = new Date();

    // Update overall status
    if (health.circuitState === 'open') {
      health.status = 'down';
    } else if (health.errorRate > 10 || health.responseTime > 2000) {
      health.status = 'degraded';
    } else {
      health.status = 'healthy';
    }
  }

  public resetCircuitBreaker(providerId: string) {
    const circuitBreaker = this.circuitBreakers.get(providerId);
    const health = this.healthChecks.get(providerId);

    if (circuitBreaker) {
      circuitBreaker.state = 'closed';
      circuitBreaker.failureCount = 0;
      circuitBreaker.recoveryTime = undefined;
    }

    if (health) {
      health.circuitState = 'closed';
      health.consecutiveFailures = 0;
      health.status = 'healthy';
    }
  }

  public updateProviderConfig(providerId: string, config: Partial<AiProviderConfig>) {
    const provider = this.providers.get(providerId);
    if (provider) {
      Object.assign(provider, config);
      this.emit('configUpdate', { providerId, config });
    }
  }

  public getProviderConfig(providerId: string): AiProviderConfig | undefined {
    return this.providers.get(providerId);
  }

  public getAllProviderConfigs(): AiProviderConfig[] {
    return Array.from(this.providers.values());
  }
}

// Export singleton instance
export const aiHealthMonitor = new AIHealthMonitor();