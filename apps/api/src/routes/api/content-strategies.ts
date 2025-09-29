import { Router } from 'express';
import { personalizationEngine } from '../../services/personalizationEngine';
import { behaviorAnalytics } from '../../services/behaviorAnalytics';
import { trendAnalysis } from '../../services/trendAnalysis';
import { abTestingEngine } from '../../services/abTestingEngine';
import { journeyOptimizer } from '../../services/journeyOptimizer';
import { authMiddleware, AuthenticatedRequest } from '../../middleware/auth';

const router = Router();

// Apply authentication to all routes
router.use(authMiddleware);

// Personalization endpoints
router.get('/personalization/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const customerId = req.user?.id;
    const sessionId = req.headers['x-session-id'] as string;

    const personalizedContent = await personalizationEngine.getPersonalizedContent(
      productId,
      customerId,
      sessionId
    );

    res.json({
      success: true,
      data: personalizedContent
    });
  } catch (error) {
    console.error('Error getting personalized content:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get personalized content'
    });
  }
});

router.post('/personalization/rules', async (req, res) => {
  try {
    const ruleData = req.body;
    const rule = await personalizationEngine.addPersonalizationRule(ruleData);

    res.json({
      success: true,
      data: rule
    });
  } catch (error) {
    console.error('Error creating personalization rule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create personalization rule'
    });
  }
});

router.get('/personalization/rules', async (req, res) => {
  try {
    const rules = await personalizationEngine.getPersonalizationRules();

    res.json({
      success: true,
      data: rules
    });
  } catch (error) {
    console.error('Error getting personalization rules:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get personalization rules'
    });
  }
});

router.put('/personalization/rules/:ruleId', async (req, res) => {
  try {
    const { ruleId } = req.params;
    const updates = req.body;

    await personalizationEngine.updatePersonalizationRule(ruleId, updates);

    res.json({
      success: true,
      message: 'Personalization rule updated successfully'
    });
  } catch (error) {
    console.error('Error updating personalization rule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update personalization rule'
    });
  }
});

router.delete('/personalization/rules/:ruleId', async (req, res) => {
  try {
    const { ruleId } = req.params;

    await personalizationEngine.deletePersonalizationRule(ruleId);

    res.json({
      success: true,
      message: 'Personalization rule deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting personalization rule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete personalization rule'
    });
  }
});

router.get('/personalization/customer/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;

    const profile = await personalizationEngine.getCustomerProfile(customerId);

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Customer profile not found'
      });
    }

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Error getting customer profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get customer profile'
    });
  }
});

router.post('/personalization/behavior', async (req, res) => {
  try {
    const { customerId, sessionId, interaction } = req.body;

    await personalizationEngine.updateCustomerBehavior(customerId, interaction);

    res.json({
      success: true,
      message: 'Customer behavior updated successfully'
    });
  } catch (error) {
    console.error('Error updating customer behavior:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update customer behavior'
    });
  }
});

router.get('/personalization/performance', async (req, res) => {
  try {
    const metrics = await personalizationEngine.getPerformanceMetrics();

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Error getting personalization performance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get personalization performance'
    });
  }
});

router.post('/personalization/cache/warm', async (req, res) => {
  try {
    const { productIds } = req.body;

    await personalizationEngine.warmCache(productIds);

    res.json({
      success: true,
      message: 'Cache warmed successfully'
    });
  } catch (error) {
    console.error('Error warming cache:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to warm cache'
    });
  }
});

router.post('/personalization/cache/clear', async (req, res) => {
  try {
    await personalizationEngine.clearCache();

    res.json({
      success: true,
      message: 'Cache cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear cache'
    });
  }
});

// Behavior analytics endpoints
router.post('/behavior/analyze', async (req, res) => {
  try {
    const analysisRequest = req.body;

    const analysis = await behaviorAnalytics.analyzeBehavior(analysisRequest);

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Error analyzing behavior:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze behavior'
    });
  }
});

router.get('/behavior/segments/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;

    const segments = await behaviorAnalytics.getCustomerSegments(customerId);

    res.json({
      success: true,
      data: segments
    });
  } catch (error) {
    console.error('Error getting customer segments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get customer segments'
    });
  }
});

router.post('/behavior/interaction', async (req, res) => {
  try {
    const interaction = req.body;

    await behaviorAnalytics.recordInteraction(interaction);

    res.json({
      success: true,
      message: 'Interaction recorded successfully'
    });
  } catch (error) {
    console.error('Error recording interaction:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record interaction'
    });
  }
});

router.get('/behavior/metrics', async (req, res) => {
  try {
    const { start, end } = req.query;

    const timeRange = {
      start: start ? new Date(start as string) : new Date(Date.now() - 24 * 60 * 60 * 1000),
      end: end ? new Date(end as string) : new Date()
    };

    const metrics = await behaviorAnalytics.getRealtimeMetrics(timeRange);

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Error getting behavior metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get behavior metrics'
    });
  }
});

router.get('/behavior/export/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    const { format = 'json' } = req.query;

    const exportData = await behaviorAnalytics.exportBehaviorData(customerId, format as 'json' | 'csv');

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=behavior_${customerId}.csv`);
      res.send(exportData);
    } else {
      res.json({
        success: true,
        data: exportData
      });
    }
  } catch (error) {
    console.error('Error exporting behavior data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export behavior data'
    });
  }
});

// Trend analysis endpoints
router.get('/trends/current', async (req, res) => {
  try {
    const { category } = req.query;

    const trends = await trendAnalysis.getCurrentTrends(category as string);

    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    console.error('Error getting current trends:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get current trends'
    });
  }
});

router.get('/trends/seasonal', async (req, res) => {
  try {
    const { season } = req.query;

    const trends = await trendAnalysis.getSeasonalTrends(season as string);

    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    console.error('Error getting seasonal trends:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get seasonal trends'
    });
  }
});

router.get('/trends/forecast', async (req, res) => {
  try {
    const { timeframe = 'month' } = req.query;

    const forecast = await trendAnalysis.getTrendForecast(timeframe as 'week' | 'month' | 'quarter');

    res.json({
      success: true,
      data: forecast
    });
  } catch (error) {
    console.error('Error getting trend forecast:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get trend forecast'
    });
  }
});

router.get('/trends/summary', async (req, res) => {
  try {
    const { timeframe = 'week' } = req.query;

    const summary = await trendAnalysis.getTrendSummary(timeframe as 'day' | 'week' | 'month');

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error getting trend summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get trend summary'
    });
  }
});

router.get('/trends/content/:contentId/performance', async (req, res) => {
  try {
    const { contentId } = req.params;

    const performance = await trendAnalysis.analyzeContentPerformance(contentId);

    res.json({
      success: true,
      data: performance
    });
  } catch (error) {
    console.error('Error analyzing content performance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze content performance'
    });
  }
});

router.get('/trends/export', async (req, res) => {
  try {
    const { format = 'json', timeframe } = req.query;

    const exportData = await trendAnalysis.exportTrendData(format as 'json' | 'csv', timeframe as string);

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=trends.csv');
      res.send(exportData);
    } else {
      res.json({
        success: true,
        data: exportData
      });
    }
  } catch (error) {
    console.error('Error exporting trend data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export trend data'
    });
  }
});

router.get('/trends/data-sources', async (req, res) => {
  try {
    const dataSources = await trendAnalysis.getDataSources();

    res.json({
      success: true,
      data: dataSources
    });
  } catch (error) {
    console.error('Error getting data sources:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get data sources'
    });
  }
});

// A/B testing endpoints
router.post('/ab-tests', async (req, res) => {
  try {
    const testData = req.body;

    const test = await abTestingEngine.createTest(testData);

    res.json({
      success: true,
      data: test
    });
  } catch (error) {
    console.error('Error creating A/B test:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create A/B test'
    });
  }
});

router.get('/ab-tests', async (req, res) => {
  try {
    const tests = await abTestingEngine.getActiveTests();

    res.json({
      success: true,
      data: tests
    });
  } catch (error) {
    console.error('Error getting A/B tests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get A/B tests'
    });
  }
});

router.get('/ab-tests/:testId', async (req, res) => {
  try {
    const { testId } = req.params;

    const test = await abTestingEngine.getTest(testId);

    if (!test) {
      return res.status(404).json({
        success: false,
        error: 'Test not found'
      });
    }

    res.json({
      success: true,
      data: test
    });
  } catch (error) {
    console.error('Error getting A/B test:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get A/B test'
    });
  }
});

router.post('/ab-tests/:testId/assign', async (req, res) => {
  try {
    const { testId } = req.params;
    const { userId, sessionId } = req.body;

    const variant = await abTestingEngine.assignVariant(testId, userId, sessionId);

    res.json({
      success: true,
      data: variant
    });
  } catch (error) {
    console.error('Error assigning variant:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign variant'
    });
  }
});

router.post('/ab-tests/:testId/impression', async (req, res) => {
  try {
    const { testId } = req.params;
    const { variantId, type, userId, sessionId, value, metadata } = req.body;

    await abTestingEngine.recordImpression(testId, variantId, type, userId, sessionId, value, metadata);

    res.json({
      success: true,
      message: 'Impression recorded successfully'
    });
  } catch (error) {
    console.error('Error recording impression:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record impression'
    });
  }
});

router.get('/ab-tests/:testId/results', async (req, res) => {
  try {
    const { testId } = req.params;

    const results = await abTestingEngine.getTestResults(testId);

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error getting test results:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get test results'
    });
  }
});

router.get('/ab-tests/:testId/summary', async (req, res) => {
  try {
    const { testId } = req.params;

    const summary = await abTestingEngine.getTestSummary(testId);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error getting test summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get test summary'
    });
  }
});

router.post('/ab-tests/:testId/pause', async (req, res) => {
  try {
    const { testId } = req.params;

    await abTestingEngine.pauseTest(testId);

    res.json({
      success: true,
      message: 'Test paused successfully'
    });
  } catch (error) {
    console.error('Error pausing test:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to pause test'
    });
  }
});

router.post('/ab-tests/:testId/resume', async (req, res) => {
  try {
    const { testId } = req.params;

    await abTestingEngine.resumeTest(testId);

    res.json({
      success: true,
      message: 'Test resumed successfully'
    });
  } catch (error) {
    console.error('Error resuming test:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resume test'
    });
  }
});

router.delete('/ab-tests/:testId', async (req, res) => {
  try {
    const { testId } = req.params;

    await abTestingEngine.deleteTest(testId);

    res.json({
      success: true,
      message: 'Test deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting test:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete test'
    });
  }
});

router.post('/ab-tests/personalized', async (req, res) => {
  try {
    const { productId, userId, sessionId } = req.body;

    const test = await abTestingEngine.createPersonalizedTest(productId, userId, sessionId);

    res.json({
      success: true,
      data: test
    });
  } catch (error) {
    console.error('Error creating personalized test:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create personalized test'
    });
  }
});

router.get('/ab-tests/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10 } = req.query;

    const history = await abTestingEngine.getTestHistory(userId, Number(limit));

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Error getting test history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get test history'
    });
  }
});

router.get('/ab-tests/stats', async (req, res) => {
  try {
    const stats = await abTestingEngine.getTestStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting test stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get test stats'
    });
  }
});

// Journey optimization endpoints
router.post('/journey/track', async (req, res) => {
  try {
    const { customerId, sessionId, interaction } = req.body;

    const journeyPath = await journeyOptimizer.trackCustomerJourney(customerId, sessionId, interaction);

    res.json({
      success: true,
      data: journeyPath
    });
  } catch (error) {
    console.error('Error tracking journey:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track journey'
    });
  }
});

router.get('/journey/optimization', async (req, res) => {
  try {
    const { customerId, sessionId } = req.query;

    const optimization = await journeyOptimizer.getJourneyOptimization(
      customerId as string,
      sessionId as string
    );

    res.json({
      success: true,
      data: optimization
    });
  } catch (error) {
    console.error('Error getting journey optimization:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get journey optimization'
    });
  }
});

router.get('/journey/funnel', async (req, res) => {
  try {
    const { start, end } = req.query;

    const timeRange = {
      start: start ? new Date(start as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: end ? new Date(end as string) : new Date()
    };

    const funnel = await journeyOptimizer.getJourneyFunnel(timeRange);

    res.json({
      success: true,
      data: funnel
    });
  } catch (error) {
    console.error('Error getting journey funnel:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get journey funnel'
    });
  }
});

router.get('/journey/insights/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;

    const insights = await journeyOptimizer.getJourneyInsights(customerId);

    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    console.error('Error getting journey insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get journey insights'
    });
  }
});

router.put('/journey/configuration/:stage', async (req, res) => {
  try {
    const { stage } = req.params;
    const configuration = req.body;

    await journeyOptimizer.updateJourneyConfiguration(stage as any, configuration);

    res.json({
      success: true,
      message: 'Journey configuration updated successfully'
    });
  } catch (error) {
    console.error('Error updating journey configuration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update journey configuration'
    });
  }
});

router.get('/journey/statistics', async (req, res) => {
  try {
    const { start, end } = req.query;

    const timeRange = {
      start: start ? new Date(start as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: end ? new Date(end as string) : new Date()
    };

    const stats = await journeyOptimizer.getJourneyStatistics(timeRange);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting journey statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get journey statistics'
    });
  }
});

router.get('/journey/customer/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;

    const journeyPath = await journeyOptimizer.getJourneyPath(customerId);

    res.json({
      success: true,
      data: journeyPath
    });
  } catch (error) {
    console.error('Error getting customer journey:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get customer journey'
    });
  }
});

// Content strategy dashboard endpoints
router.get('/dashboard/overview', async (req, res) => {
  try {
    const [personalizationMetrics, testStats, journeyStats, trendSummary] = await Promise.all([
      personalizationEngine.getPerformanceMetrics(),
      abTestingEngine.getTestStats(),
      journeyOptimizer.getJourneyStatistics(),
      trendAnalysis.getTrendSummary()
    ]);

    res.json({
      success: true,
      data: {
        personalization: personalizationMetrics,
        abTesting: testStats,
        journey: journeyStats,
        trends: trendSummary
      }
    });
  } catch (error) {
    console.error('Error getting dashboard overview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get dashboard overview'
    });
  }
});

router.get('/dashboard/performance', async (req, res) => {
  try {
    const { timeframe = 'week' } = req.query;

    const timeRange = {
      start: new Date(Date.now() - this.getTimeframeInMs(timeframe as string)),
      end: new Date()
    };

    const [journeyFunnel, testPerformance, behaviorMetrics] = await Promise.all([
      journeyOptimizer.getJourneyFunnel(timeRange),
      abTestingEngine.getTestStats(),
      behaviorAnalytics.getRealtimeMetrics(timeRange)
    ]);

    res.json({
      success: true,
      data: {
        journey: journeyFunnel,
        abTesting: testPerformance,
        behavior: behaviorMetrics
      }
    });
  } catch (error) {
    console.error('Error getting dashboard performance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get dashboard performance'
    });
  }
});

router.get('/dashboard/recommendations', async (req, res) => {
  try {
    const recommendations = await this.generateDashboardRecommendations();

    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('Error getting dashboard recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get dashboard recommendations'
    });
  }
});

// Helper methods
function getTimeframeInMs(timeframe: string): number {
  const timeframes: Record<string, number> = {
    'day': 24 * 60 * 60 * 1000,
    'week': 7 * 24 * 60 * 60 * 1000,
    'month': 30 * 24 * 60 * 60 * 1000,
    'quarter': 90 * 24 * 60 * 60 * 1000
  };

  return timeframes[timeframe] || timeframes['week'];
}

async function generateDashboardRecommendations(): Promise<Array<{
  type: string;
  priority: string;
  title: string;
  description: string;
  action: string;
  impact: string;
}>> {
  const recommendations = [];

  try {
    // Get current metrics
    const [personalizationMetrics, testStats, journeyStats] = await Promise.all([
      personalizationEngine.getPerformanceMetrics(),
      abTestingEngine.getTestStats(),
      journeyOptimizer.getJourneyStatistics()
    ]);

    // Analyze metrics and generate recommendations
    if (personalizationMetrics.current?.averagePersonalizationScore < 0.6) {
      recommendations.push({
        type: 'personalization',
        priority: 'high',
        title: 'Improve Personalization Quality',
        description: 'Current personalization score is below optimal levels',
        action: 'Review personalization rules and customer data quality',
        impact: 'Higher engagement and conversion rates'
      });
    }

    if (testStats.activeTests < 3) {
      recommendations.push({
        type: 'testing',
        priority: 'medium',
        title: 'Increase A/B Testing',
        description: 'Consider running more A/B tests to optimize content',
        action: 'Create tests for high-traffic pages and key user flows',
        impact: 'Data-driven optimization and improved performance'
      });
    }

    const journeyDropoff = journeyStats.overview?.dropoffRate || 0;
    if (journeyDropoff > 0.5) {
      recommendations.push({
        type: 'journey',
        priority: 'high',
        title: 'Reduce Journey Dropoff',
        description: 'High dropoff rate detected in customer journey',
        action: 'Analyze journey barriers and optimize key transition points',
        impact: 'Higher conversion rates and better customer experience'
      });
    }

    // Add trend-based recommendations
    const currentTrends = await trendAnalysis.getCurrentTrends();
    if (currentTrends.length > 0) {
      const highUrgencyTrends = currentTrends.filter(t => t.urgency > 0.7);
      if (highUrgencyTrends.length > 0) {
        recommendations.push({
          type: 'trends',
          priority: 'medium',
          title: 'Capitalize on Emerging Trends',
          description: `High urgency trends detected: ${highUrgencyTrends[0].keywords.join(', ')}`,
          action: 'Create content and campaigns aligned with current trends',
          impact: 'Increased relevance and engagement'
        });
      }
    }

    return recommendations;
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return [];
  }
}

export default router;