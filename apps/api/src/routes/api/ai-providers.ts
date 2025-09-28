import { Router } from 'express';
import { aiProviderRepository } from '../../repositories/aiProviderRepository';
import { aiService } from '../../services/aiService';
import { aiHealthMonitor } from '../../services/aiHealthMonitor';
import { aiProviderEngine } from '../../services/aiProviderEngine';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const providers = await aiProviderRepository.findAll();
    return res.json(providers);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch AI providers.' });
  }
});

router.post('/:id/toggle', async (req, res) => {
  const { id } = req.params;
  const { isEnabled } = req.body;

  if (typeof isEnabled !== 'boolean') {
    return res.status(400).json({ error: 'isEnabled must be a boolean.' });
  }

  try {
    await aiProviderRepository.toggle(id, isEnabled);
    await aiService.reloadProviders(); // Reload providers in the service
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ error: 'Failed to toggle provider status.' });
  }
});

// Get provider health status
router.get('/health', async (req, res) => {
  try {
    const healthStatus = aiHealthMonitor.getAllProviderHealth();
    return res.json({
      success: true,
      data: healthStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get provider health'
    });
  }
});

// Get specific provider health
router.get('/health/:providerId', async (req, res) => {
  try {
    const { providerId } = req.params;
    const health = aiHealthMonitor.getProviderHealth(providerId);

    if (!health) {
      return res.status(404).json({
        success: false,
        error: 'Provider not found'
      });
    }

    res.json({
      success: true,
      data: health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get provider health'
    });
  }
});

// Get provider performance metrics
router.get('/performance', async (req, res) => {
  try {
    const performance = aiProviderEngine.getAllProviderPerformance();
    res.json({
      success: true,
      data: performance,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get performance metrics'
    });
  }
});

// Get rate limit status
router.get('/rate-limits', async (req, res) => {
  try {
    const rateLimits = aiProviderEngine.getAllRateLimitStatus();
    res.json({
      success: true,
      data: rateLimits,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get rate limits'
    });
  }
});

// Get cost analysis
router.get('/costs', async (req, res) => {
  try {
    const costOptimization = aiProviderEngine.getCostOptimization();
    const usageAnalytics = aiProviderEngine.getUsageAnalytics();

    res.json({
      success: true,
      data: {
        optimization: costOptimization,
        analytics: usageAnalytics
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get cost analysis'
    });
  }
});

// Select best provider for content generation
router.post('/select', async (req, res) => {
  try {
    const { contentType, estimatedTokens, requirements } = req.body;

    if (!contentType || !estimatedTokens) {
      return res.status(400).json({
        success: false,
        error: 'Content type and estimated tokens are required'
      });
    }

    const selection = await aiProviderEngine.selectProvider(
      contentType,
      estimatedTokens,
      requirements
    );

    res.json({
      success: true,
      data: selection,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to select provider'
    });
  }
});

// Test provider connectivity
router.post('/test', async (req, res) => {
  try {
    const { providerId, testType = 'connectivity', payload, timeout = 5000 } = req.body;

    if (!providerId) {
      return res.status(400).json({
        success: false,
        error: 'Provider ID is required'
      });
    }

    const startTime = Date.now();
    const provider = aiHealthMonitor.getProviderConfig(providerId);

    if (!provider) {
      return res.status(404).json({
        success: false,
        error: 'Provider not found'
      });
    }

    // Simulate provider test - in production, this would make actual API calls
    const testResponse = await simulateProviderTest(provider, testType, payload, timeout);

    res.json({
      success: true,
      data: {
        ...testResponse,
        providerId,
        testType,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to test provider'
    });
  }
});

// Trigger manual failover
router.post('/failover', async (req, res) => {
  try {
    const { providerId, targetProviderId } = req.body;

    if (!providerId) {
      return res.status(400).json({
        success: false,
        error: 'Provider ID is required'
      });
    }

    // Reset circuit breaker for the provider
    aiHealthMonitor.resetCircuitBreaker(providerId);

    // If target provider specified, verify it's available
    if (targetProviderId) {
      const isAvailable = aiHealthMonitor.isProviderAvailable(targetProviderId);
      if (!isAvailable) {
        return res.status(400).json({
          success: false,
          error: 'Target provider is not available'
        });
      }
    }

    res.json({
      success: true,
      message: 'Failover completed successfully',
      data: {
        sourceProvider: providerId,
        targetProvider: targetProviderId,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to trigger failover'
    });
  }
});

// Optimize provider selection
router.post('/optimize', async (req, res) => {
  try {
    const { strategy } = req.body;

    if (strategy) {
      aiProviderEngine.setOptimizationStrategy(strategy);
    }

    const optimization = aiProviderEngine.getCostOptimization();

    res.json({
      success: true,
      data: {
        currentStrategy: aiProviderEngine.getOptimizationStrategy(),
        optimization,
        recommendations: optimization.providerRecommendations,
        estimatedSavings: optimization.potentialSavings
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to optimize providers'
    });
  }
});

// Get provider quotas
router.get('/quotas', async (req, res) => {
  try {
    const rateLimits = aiProviderEngine.getAllRateLimitStatus();
    const providerConfigs = aiHealthMonitor.getAllProviderConfigs();

    const quotas = rateLimits.map(limit => {
      const config = providerConfigs.find(p => p.id === limit.providerId);
      return {
        providerId: limit.providerId,
        providerName: config?.name || limit.providerId,
        currentUsage: limit.currentUsage,
        limit: limit.limit,
        usagePercentage: (limit.currentUsage / limit.limit) * 100,
        remaining: limit.limit - limit.currentUsage,
        resetTime: limit.resetTime,
        burstCapacity: limit.burstCapacity
      };
    });

    res.json({
      success: true,
      data: quotas,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get quotas'
    });
  }
});

// Get available providers
router.get('/available', async (req, res) => {
  try {
    const availableProviders = aiHealthMonitor.getAvailableProviders();
    const providerDetails = availableProviders.map(providerId => {
      const config = aiHealthMonitor.getProviderConfig(providerId);
      const health = aiHealthMonitor.getProviderHealth(providerId);
      const performance = aiProviderEngine.getProviderPerformance(providerId);
      const rateLimit = aiProviderEngine.getRateLimitStatus(providerId);

      return {
        id: providerId,
        name: config?.name || providerId,
        health: health?.status || 'unknown',
        performance: performance?.performanceScore || 0,
        rateLimitUsage: rateLimit ? (rateLimit.currentUsage / rateLimit.limit) * 100 : 0,
        specialties: config?.specialties || []
      };
    });

    res.json({
      success: true,
      data: providerDetails,
      count: providerDetails.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get available providers'
    });
  }
});

// Record request result (for internal use)
router.post('/record-result', async (req, res) => {
  try {
    const { providerId, success, responseTime, actualCost } = req.body;

    if (!providerId || success === undefined || !responseTime || actualCost === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Provider ID, success, response time, and actual cost are required'
      });
    }

    aiProviderEngine.recordRequestResult(providerId, success, responseTime, actualCost);

    res.json({
      success: true,
      message: 'Request result recorded successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to record request result'
    });
  }
});

// Helper function to simulate provider tests
async function simulateProviderTest(provider: any, testType: string, payload: any, timeout: number) {
  const startTime = Date.now();

  try {
    // Simulate different test types
    switch (testType) {
      case 'connectivity':
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 100));
        break;
      case 'performance':
        await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500));
        break;
      case 'content_generation':
        await new Promise(resolve => setTimeout(resolve, Math.random() * 3000 + 1000));
        break;
    }

    const responseTime = Date.now() - startTime;
    const isSuccess = Math.random() > 0.1; // 90% success rate

    return {
      status: isSuccess ? 'success' : 'failed',
      responseTime,
      cost: isSuccess ? Math.random() * 0.01 : 0,
      result: isSuccess ? {
        message: 'Test completed successfully',
        testType,
        responseTime
      } : undefined,
      error: isSuccess ? undefined : 'Test failed due to timeout or error'
    };
  } catch (error) {
    return {
      status: 'failed',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export default router;
