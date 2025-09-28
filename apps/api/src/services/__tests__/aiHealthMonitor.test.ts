import { AIHealthMonitor, aiHealthMonitor } from '../aiHealthMonitor';
import { ProviderHealth, CircuitBreakerState, AiProviderConfig } from '@jewelry-seo/shared/types/aiProvider';

// Mock environment variables
process.env.GEMINI_API_KEY = 'test-gemini-key';
process.env.CLAUDE_API_KEY = 'test-claude-key';
process.env.OPENAI_API_KEY = 'test-openai-key';

describe('AIHealthMonitor', () => {
  let monitor: AIHealthMonitor;

  beforeEach(() => {
    // Create fresh instance for each test
    monitor = new AIHealthMonitor();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    monitor.stopMonitoring();
  });

  describe('Initialization', () => {
    it('should initialize with default providers', () => {
      const configs = monitor.getAllProviderConfigs();
      expect(configs).toHaveLength(3);
      expect(configs.map(p => p.id)).toContain('gemini-pro');
      expect(configs.map(p => p.id)).toContain('claude-3');
      expect(configs.map(p => p.id)).toContain('gpt-4');
    });

    it('should initialize health checks for all providers', () => {
      const healthStatus = monitor.getAllProviderHealth();
      expect(healthStatus).toHaveLength(3);

      healthStatus.forEach(health => {
        expect(health.status).toBe('healthy');
        expect(health.circuitState).toBe('closed');
        expect(health.consecutiveFailures).toBe(0);
      });
    });

    it('should initialize circuit breakers for all providers', () => {
      const providers = monitor.getAllProviderConfigs();

      providers.forEach(provider => {
        const circuitBreaker = monitor.getCircuitBreakerState(provider.id);
        expect(circuitBreaker).toBeDefined();
        expect(circuitBreaker!.state).toBe('closed');
        expect(circuitBreaker!.failureCount).toBe(0);
      });
    });
  });

  describe('Health Monitoring', () => {
    it('should start monitoring with specified interval', () => {
      const spy = jest.spyOn(monitor as any, 'performHealthChecks');
      monitor.startMonitoring(5000);

      expect(spy).not.toHaveBeenCalled();
      jest.advanceTimersByTime(5000);
      expect(spy).toHaveBeenCalled();
    });

    it('should stop monitoring correctly', () => {
      const spy = jest.spyOn(monitor as any, 'performHealthChecks');
      monitor.startMonitoring(1000);
      monitor.stopMonitoring();

      jest.advanceTimersByTime(2000);
      expect(spy).toHaveBeenCalledTimes(1); // Only called once
    });

    it('should not start monitoring if already running', () => {
      const spy = jest.spyOn(monitor as any, 'performHealthChecks');
      monitor.startMonitoring(1000);
      monitor.startMonitoring(1000); // Second call

      jest.advanceTimersByTime(1000);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should handle health check failures gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Mock a failing health check
      jest.spyOn(monitor as any, 'checkProviderHealth').mockRejectedValue(new Error('Test error'));

      await (monitor as any).performHealthChecks();

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Provider Health Management', () => {
    it('should record successful request results', () => {
      const providerId = 'gemini-pro';

      monitor.recordRequestResult(providerId, true, 200);

      const health = monitor.getProviderHealth(providerId);
      expect(health).toBeDefined();
      expect(health!.successRate).toBeGreaterThan(100);
      expect(health!.errorRate).toBeLessThan(0);
      expect(health!.consecutiveFailures).toBe(0);
    });

    it('should record failed request results', () => {
      const providerId = 'gemini-pro';

      monitor.recordRequestResult(providerId, false, 500);

      const health = monitor.getProviderHealth(providerId);
      expect(health).toBeDefined();
      expect(health!.successRate).toBeLessThan(100);
      expect(health!.errorRate).toBeGreaterThan(0);
      expect(health!.consecutiveFailures).toBe(1);
    });

    it('should trigger circuit breaker on consecutive failures', () => {
      const providerId = 'gemini-pro';

      // Record enough failures to trigger circuit breaker
      for (let i = 0; i < 5; i++) {
        monitor.recordRequestResult(providerId, false, 500);
      }

      const health = monitor.getProviderHealth(providerId);
      const circuitBreaker = monitor.getCircuitBreakerState(providerId);

      expect(health!.circuitState).toBe('open');
      expect(circuitBreaker!.state).toBe('open');
      expect(circuitBreaker!.failureCount).toBe(5);
      expect(health!.status).toBe('down');
    });

    it('should reset circuit breaker correctly', () => {
      const providerId = 'gemini-pro';

      // Trigger circuit breaker
      for (let i = 0; i < 5; i++) {
        monitor.recordRequestResult(providerId, false, 500);
      }

      monitor.resetCircuitBreaker(providerId);

      const health = monitor.getProviderHealth(providerId);
      const circuitBreaker = monitor.getCircuitBreakerState(providerId);

      expect(health!.circuitState).toBe('closed');
      expect(circuitBreaker!.state).toBe('closed');
      expect(circuitBreaker!.failureCount).toBe(0);
      expect(health!.status).toBe('healthy');
    });

    it('should check provider availability', () => {
      expect(monitor.isProviderAvailable('gemini-pro')).toBe(true);

      // Make provider unavailable
      for (let i = 0; i < 5; i++) {
        monitor.recordRequestResult('gemini-pro', false, 500);
      }

      expect(monitor.isProviderAvailable('gemini-pro')).toBe(false);
    });

    it('should return list of available providers', () => {
      expect(monitor.getAvailableProviders()).toContain('gemini-pro');
      expect(monitor.getAvailableProviders()).toContain('claude-3');
      expect(monitor.getAvailableProviders()).toContain('gpt-4');

      // Make one provider unavailable
      for (let i = 0; i < 5; i++) {
        monitor.recordRequestResult('gemini-pro', false, 500);
      }

      const available = monitor.getAvailableProviders();
      expect(available).not.toContain('gemini-pro');
      expect(available).toContain('claude-3');
      expect(available).toContain('gpt-4');
    });
  });

  describe('Provider Configuration', () => {
    it('should update provider configuration', () => {
      const providerId = 'gemini-pro';
      const updateConfig = { isActive: false, priority: 10 };

      monitor.updateProviderConfig(providerId, updateConfig);

      const config = monitor.getProviderConfig(providerId);
      expect(config).toBeDefined();
      expect(config!.isActive).toBe(false);
      expect(config!.priority).toBe(10);
    });

    it('should handle configuration updates for non-existent providers', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      monitor.updateProviderConfig('non-existent', { isActive: false });

      expect(consoleSpy).not.toHaveBeenCalled(); // Should not error
      consoleSpy.mockRestore();
    });
  });

  describe('Events', () => {
    it('should emit health update events', (done) => {
      const providerId = 'gemini-pro';

      monitor.on('healthUpdate', (data) => {
        expect(data.providerId).toBe(providerId);
        expect(data.health).toBeDefined();
        expect(data.circuitBreaker).toBeDefined();
        done();
      });

      monitor.recordRequestResult(providerId, true, 200);
    });

    it('should emit config update events', (done) => {
      const providerId = 'gemini-pro';

      monitor.on('configUpdate', (data) => {
        expect(data.providerId).toBe(providerId);
        expect(data.config).toBeDefined();
        done();
      });

      monitor.updateProviderConfig(providerId, { isActive: false });
    });
  });

  describe('Edge Cases', () => {
    it('should handle non-existent provider queries gracefully', () => {
      expect(monitor.getProviderHealth('non-existent')).toBeUndefined();
      expect(monitor.getCircuitBreakerState('non-existent')).toBeUndefined();
      expect(monitor.getProviderConfig('non-existent')).toBeUndefined();
      expect(monitor.isProviderAvailable('non-existent')).toBe(false);
    });

    it('should handle empty provider list gracefully', () => {
      const health = monitor.getHealthyProviders();
      expect(Array.isArray(health)).toBe(true);
    });

    it('should update response time with moving average', () => {
      const providerId = 'gemini-pro';

      // Initial response time
      monitor.recordRequestResult(providerId, true, 1000);
      let health = monitor.getProviderHealth(providerId);
      expect(health!.responseTime).toBe(1000);

      // Record faster response time
      monitor.recordRequestResult(providerId, true, 200);
      health = monitor.getProviderHealth(providerId);
      expect(health!.responseTime).toBeLessThan(1000);
      expect(health!.responseTime).toBeGreaterThan(200);
    });
  });
});

describe('AIHealthMonitor Singleton', () => {
  it('should export singleton instance', () => {
    expect(aiHealthMonitor).toBeInstanceOf(AIHealthMonitor);
  });

  it('should maintain state across imports', () => {
    // Import the singleton again and verify it's the same instance
    const { aiHealthMonitor: monitor2 } = require('../aiHealthMonitor');
    expect(monitor2).toBe(aiHealthMonitor);
  });
});