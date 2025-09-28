import { AIProviderEngine, aiProviderEngine } from '../aiProviderEngine';
import { aiHealthMonitor } from '../aiHealthMonitor';
import { ProviderSelectionResponse, OptimizationStrategy } from '@jewelry-seo/shared/types/aiProvider';

// Mock the health monitor
jest.mock('../aiHealthMonitor', () => ({
  aiHealthMonitor: {
    getAvailableProviders: jest.fn(),
    getAllProviderConfigs: jest.fn(),
    getProviderHealth: jest.fn(),
    getProviderConfig: jest.fn(),
    recordRequestResult: jest.fn(),
  }
}));

describe('AIProviderEngine', () => {
  let engine: AIProviderEngine;

  beforeEach(() => {
    // Reset mock
    jest.clearAllMocks();
    engine = new AIProviderEngine();
  });

  describe('Initialization', () => {
    it('should initialize with default optimization strategy', () => {
      expect(engine.getOptimizationStrategy()).toBe('balanced');
    });

    it('should initialize rate limits for all providers', () => {
      // Mock available providers
      (aiHealthMonitor.getAllProviderConfigs as jest.Mock).mockReturnValue([
        { id: 'gemini-pro', rateLimit: 60, costPerToken: 0.000002 },
        { id: 'claude-3', rateLimit: 50, costPerToken: 0.000015 },
      ]);

      engine = new AIProviderEngine();
      const rateLimits = engine.getAllRateLimitStatus();

      expect(rateLimits).toHaveLength(2);
      expect(rateLimits[0].providerId).toBe('gemini-pro');
      expect(rateLimits[0].limit).toBe(60);
      expect(rateLimits[1].providerId).toBe('claude-3');
      expect(rateLimits[1].limit).toBe(50);
    });

    it('should initialize performance metrics for all providers', () => {
      // Mock available providers
      (aiHealthMonitor.getAllProviderConfigs as jest.Mock).mockReturnValue([
        { id: 'gemini-pro' },
        { id: 'claude-3' },
      ]);

      engine = new AIProviderEngine();
      const performance = engine.getAllProviderPerformance();

      expect(performance).toHaveLength(2);
      expect(performance[0].providerId).toBe('gemini-pro');
      expect(performance[0].totalRequests).toBe(0);
      expect(performance[0].uptime).toBe(100);
    });
  });

  describe('Provider Selection', () => {
    beforeEach(() => {
      // Setup mock providers
      (aiHealthMonitor.getAvailableProviders as jest.Mock).mockReturnValue(['gemini-pro', 'claude-3', 'gpt-4']);

      (aiHealthMonitor.getProviderConfig as jest.Mock).mockImplementation((providerId) => {
        const configs = {
          'gemini-pro': {
            id: 'gemini-pro',
            costPerToken: 0.000002,
            specialties: ['content_generation', 'seo_optimization', 'product_descriptions'],
            rateLimit: 60,
          },
          'claude-3': {
            id: 'claude-3',
            costPerToken: 0.000015,
            specialties: ['creative_content', 'brand_voice', 'long_form_content'],
            rateLimit: 50,
          },
          'gpt-4': {
            id: 'gpt-4',
            costPerToken: 0.00003,
            specialties: ['technical_content', 'analysis', 'complex_reasoning'],
            rateLimit: 200,
          }
        };
        return configs[providerId as keyof typeof configs];
      });

      (aiHealthMonitor.getProviderHealth as jest.Mock).mockImplementation((providerId) => {
        return {
          id: providerId,
          status: 'healthy',
          responseTime: 200,
          successRate: 95,
          errorRate: 5,
          consecutiveFailures: 0,
          circuitState: 'closed'
        };
      });
    });

    it('should select best provider for content generation', async () => {
      const response = await engine.selectProvider('product_description', 1000);

      expect(response).toBeDefined();
      expect(response.selectedProvider).toMatch(/gemini-pro|claude-3|gpt-4/);
      expect(response.estimatedCost).toBeGreaterThan(0);
      expect(response.estimatedTime).toBeGreaterThan(0);
      expect(response.fallbackProviders).toHaveLength(2);
      expect(response.confidence).toBeGreaterThan(0);
    });

    it('should throw error when no providers are available', async () => {
      (aiHealthMonitor.getAvailableProviders as jest.Mock).mockReturnValue([]);

      await expect(engine.selectProvider('product_description', 1000))
        .rejects.toThrow('No AI providers available');
    });

    it('should respect max cost requirement', async () => {
      const response = await engine.selectProvider('product_description', 1000, {
        maxCost: 0.001
      });

      // Only gemini-pro should be selected as others exceed the cost limit
      expect(response.estimatedCost).toBeLessThanOrEqual(0.001);
    });

    it('should consider provider specialties in scoring', async () => {
      const response1 = await engine.selectProvider('product_description', 1000);
      const response2 = await engine.selectProvider('technical_content', 1000);

      // Product descriptions should favor gemini-pro
      // Technical content should favor gpt-4
      expect(response1.selectedProvider).not.toBe(response2.selectedProvider);
    });

    it('should apply different optimization strategies', async () => {
      engine.setOptimizationStrategy('cost_first');
      const costFirst = await engine.selectProvider('product_description', 1000);

      engine.setOptimizationStrategy('performance_first');
      const perfFirst = await engine.selectProvider('product_description', 1000);

      engine.setOptimizationStrategy('specialized');
      const specialized = await engine.selectProvider('product_description', 1000);

      // Different strategies may select different providers
      expect([costFirst, perfFirst, specialized].map(r => r.selectedProvider))
        .toContain('gemini-pro');
    });

    it('should generate unique request IDs', async () => {
      const response1 = await engine.selectProvider('product_description', 1000);
      const response2 = await engine.selectProvider('product_description', 1000);

      expect(response1.requestId).not.toBe(response2.requestId);
      expect(response1.requestId).toMatch(/^req_\d+_[a-z0-9]+$/);
    });
  });

  describe('Rate Limiting', () => {
    beforeEach(() => {
      (aiHealthMonitor.getAvailableProviders as jest.Mock).mockReturnValue(['gemini-pro']);
      (aiHealthMonitor.getProviderConfig as jest.Mock).mockReturnValue({
        id: 'gemini-pro',
        costPerToken: 0.000002,
        specialties: ['content_generation'],
        rateLimit: 2, // Very low limit for testing
      });
      (aiHealthMonitor.getProviderHealth as jest.Mock).mockReturnValue({
        id: 'gemini-pro',
        status: 'healthy',
        responseTime: 200,
        successRate: 95,
        errorRate: 5,
        consecutiveFailures: 0,
        circuitState: 'closed'
      });
    });

    it('should track rate limit usage', async () => {
      await engine.selectProvider('product_description', 100);
      await engine.selectProvider('product_description', 100);

      const rateLimit = engine.getRateLimitStatus('gemini-pro');
      expect(rateLimit).toBeDefined();
      expect(rateLimit!.currentUsage).toBe(2);
      expect(rateLimit!.requestsInWindow).toBe(2);
    });

    it('should respect rate limits', async () => {
      // Make requests up to the limit
      await engine.selectProvider('product_description', 100);
      await engine.selectProvider('product_description', 100);

      // Third request should throw error
      await expect(engine.selectProvider('product_description', 100))
        .rejects.toThrow('No AI providers available');
    });

    it('should reset rate limits after window expires', async () => {
      // Make requests up to the limit
      await engine.selectProvider('product_description', 100);
      await engine.selectProvider('product_description', 100);

      // Mock time passing beyond the reset window
      jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 70000); // 70 seconds later

      // Should now be able to make another request
      const response = await engine.selectProvider('product_description', 100);
      expect(response).toBeDefined();
    });
  });

  describe('Performance Tracking', () => {
    beforeEach(() => {
      (aiHealthMonitor.getProviderConfig as jest.Mock).mockReturnValue({
        id: 'gemini-pro',
        costPerToken: 0.000002,
        specialties: ['content_generation'],
      });
    });

    it('should record request results and update performance metrics', () => {
      engine.recordRequestResult('gemini-pro', true, 200, 0.002);

      const performance = engine.getProviderPerformance('gemini-pro');
      expect(performance).toBeDefined();
      expect(performance!.totalRequests).toBe(1);
      expect(performance!.successfulRequests).toBe(1);
      expect(performance!.failedRequests).toBe(0);
      expect(performance!.averageResponseTime).toBeGreaterThan(0);
      expect(performance!.averageCost).toBe(0.002);
    });

    it('should handle failed requests in performance tracking', () => {
      engine.recordRequestResult('gemini-pro', false, 500, 0);

      const performance = engine.getProviderPerformance('gemini-pro');
      expect(performance!.failedRequests).toBe(1);
      expect(performance!.uptime).toBe(0);
    });

    it('should calculate performance score correctly', () => {
      // Fast, successful request
      engine.recordRequestResult('gemini-pro', true, 100, 0.001);
      let performance = engine.getProviderPerformance('gemini-pro');
      expect(performance!.performanceScore).toBeGreaterThan(90);

      // Slow, failed request
      engine.recordRequestResult('gemini-pro', false, 2000, 0);
      performance = engine.getProviderPerformance('gemini-pro');
      expect(performance!.performanceScore).toBeLessThan(90);
    });
  });

  describe('Cost Optimization', () => {
    beforeEach(() => {
      (aiHealthMonitor.getProviderConfig as jest.Mock).mockImplementation((providerId) => {
        const configs = {
          'gemini-pro': { id: 'gemini-pro', costPerToken: 0.000002 },
          'claude-3': { id: 'claude-3', costPerToken: 0.000015 },
        };
        return configs[providerId as keyof typeof configs];
      });
    });

    it('should calculate cost optimization opportunities', () => {
      // Simulate some usage
      engine.recordRequestResult('gemini-pro', true, 200, 0.002);
      engine.recordRequestResult('claude-3', true, 300, 0.005);

      const optimization = engine.getCostOptimization();
      expect(optimization).toBeDefined();
      expect(optimization.strategy).toBe('balanced');
      expect(optimization.currentSavings).toBe(0);
      expect(optimization.lastOptimized).toBeInstanceOf(Date);
    });

    it('should identify usage patterns', () => {
      // Simulate usage for different content types
      engine.recordRequestResult('gemini-pro', true, 200, 0.002);
      engine.recordRequestResult('claude-3', true, 300, 0.005);

      const optimization = engine.getCostOptimization();
      expect(optimization.usagePatterns).toHaveLength(1); // Both recorded as 'unknown'
      expect(optimization.usagePatterns[0].contentType).toBe('unknown');
    });

    it('should provide usage analytics', () => {
      engine.recordRequestResult('gemini-pro', true, 200, 0.002);
      engine.recordRequestResult('claude-3', false, 300, 0);

      const analytics = engine.getUsageAnalytics();
      expect(analytics.totalRequests).toBe(2);
      expect(analytics.successfulRequests).toBe(1);
      expect(analytics.totalCost).toBe(0.002);
      expect(analytics.totalTokens).toBe(500);
      expect(analytics.providerDistribution).toEqual({
        'gemini-pro': 1,
        'claude-3': 1
      });
    });
  });

  describe('Optimization Strategy Management', () => {
    it('should allow changing optimization strategy', () => {
      engine.setOptimizationStrategy('cost_first');
      expect(engine.getOptimizationStrategy()).toBe('cost_first');

      engine.setOptimizationStrategy('performance_first');
      expect(engine.getOptimizationStrategy()).toBe('performance_first');

      engine.setOptimizationStrategy('specialized');
      expect(engine.getOptimizationStrategy()).toBe('specialized');

      engine.setOptimizationStrategy('balanced');
      expect(engine.getOptimizationStrategy()).toBe('balanced');
    });
  });

  describe('Rate Limit Management', () => {
    it('should reset all rate limits', () => {
      engine.recordRequestResult('gemini-pro', true, 200, 0.002);

      let rateLimit = engine.getRateLimitStatus('gemini-pro');
      expect(rateLimit!.currentUsage).toBe(1);

      engine.resetRateLimits();

      rateLimit = engine.getRateLimitStatus('gemini-pro');
      expect(rateLimit!.currentUsage).toBe(0);
      expect(rateLimit!.requestsInWindow).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle non-existent provider queries gracefully', () => {
      expect(engine.getProviderPerformance('non-existent')).toBeUndefined();
      expect(engine.getRateLimitStatus('non-existent')).toBeUndefined();
    });

    it('should handle division by zero in calculations', () => {
      const performance = engine.getProviderPerformance('non-existent');
      expect(performance).toBeUndefined();
    });

    it('should handle empty usage history in analytics', () => {
      const analytics = engine.getUsageAnalytics();
      expect(analytics.totalRequests).toBe(0);
      expect(analytics.averageCostPerRequest).toBe(0);
    });
  });
});

describe('AIProviderEngine Singleton', () => {
  it('should export singleton instance', () => {
    expect(aiProviderEngine).toBeInstanceOf(AIProviderEngine);
  });

  it('should maintain state across imports', () => {
    const { aiProviderEngine: engine2 } = require('../aiProviderEngine');
    expect(engine2).toBe(aiProviderEngine);
  });
});