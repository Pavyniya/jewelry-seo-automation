import request from 'supertest';
import express from 'express';
import contentStrategiesRoutes from '../../routes/api/content-strategies';
import { PersonalizationEngine } from '../../services/personalizationEngine';
import { BehaviorAnalytics } from '../../services/behaviorAnalytics';
import { TrendAnalysis } from '../../services/trendAnalysis';
import { ABTestingEngine } from '../../services/abTestingEngine';
import { JourneyOptimizer } from '../../services/journeyOptimizer';

jest.mock('../../services/personalizationEngine');
jest.mock('../../services/behaviorAnalytics');
jest.mock('../../services/trendAnalysis');
jest.mock('../../services/abTestingEngine');
jest.mock('../../services/journeyOptimizer');

const mockPersonalizationEngine = PersonalizationEngine as jest.MockedClass<typeof PersonalizationEngine>;
const mockBehaviorAnalytics = BehaviorAnalytics as jest.MockedClass<typeof BehaviorAnalytics>;
const mockTrendAnalysis = TrendAnalysis as jest.MockedClass<typeof TrendAnalysis>;
const mockABTestingEngine = ABTestingEngine as jest.MockedClass<typeof ABTestingEngine>;
const mockJourneyOptimizer = JourneyOptimizer as jest.MockedClass<typeof JourneyOptimizer>;

describe('Content Strategies API', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/v1/content-strategies', contentStrategiesRoutes);

    // Mock user authentication
    app.use((req, res, next) => {
      req.user = { id: 'user-123' };
      next();
    });

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('Personalization Endpoints', () => {
    describe('GET /personalization/:productId', () => {
      it('should get personalized content for a product', async () => {
        const mockResponse = {
          contentVariants: [
            { content: 'Variant 1', confidence: 0.8, segments: ['new_visitor'] }
          ],
          recommendations: [
            { action: 'Optimize for mobile', reason: 'High mobile traffic' }
          ],
          customerSegments: ['new_visitor']
        };

        mockPersonalizationEngine.prototype.getPersonalizedContent.mockResolvedValue(mockResponse);

        const response = await request(app)
          .get('/api/v1/content-strategies/personalization/product-123')
          .set('x-session-id', 'session-456');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toEqual(mockResponse);
      });

      it('should handle missing session ID', async () => {
        const mockResponse = {
          contentVariants: [],
          recommendations: [],
          customerSegments: ['new_visitor']
        };

        mockPersonalizationEngine.prototype.getPersonalizedContent.mockResolvedValue(mockResponse);

        const response = await request(app)
          .get('/api/v1/content-strategies/personalization/product-123');

        expect(response.status).toBe(200);
        expect(response.body.data).toEqual(mockResponse);
      });
    });

    describe('GET /behavior/customer', () => {
      it('should get customer behavior data', async () => {
        const mockResponse = {
          totalInteractions: 15,
          uniqueCustomers: 1,
          averageSessionDuration: 300,
          conversionRate: 0.2,
          segments: ['returning_customer']
        };

        mockPersonalizationEngine.prototype.getCustomerBehavior.mockResolvedValue(mockResponse);

        const response = await request(app)
          .get('/api/v1/content-strategies/behavior/customer')
          .set('x-session-id', 'session-456');

        expect(response.status).toBe(200);
        expect(response.body.data).toEqual(mockResponse);
      });
    });
  });

  describe('Behavior Analytics Endpoints', () => {
    describe('GET /behavior/patterns', () => {
      it('should get behavior patterns', async () => {
        const mockResponse = [
          {
            name: 'Browse Then Buy',
            description: 'Customers who browse multiple products before buying',
            confidence: 0.85,
            frequency: 25
          }
        ];

        mockBehaviorAnalytics.prototype.getBehaviorPatterns.mockResolvedValue(mockResponse);

        const response = await request(app)
          .get('/api/v1/content-strategies/behavior/patterns')
          .query({ timeframe: '7d' });

        expect(response.status).toBe(200);
        expect(response.body.data).toEqual(mockResponse);
      });
    });

    describe('POST /behavior/interactions', () => {
      it('should record interaction', async () => {
        const interactionData = {
          customerId: 'customer-123',
          sessionId: 'session-456',
          productId: 'product-789',
          interactionType: 'view',
          timestamp: new Date().toISOString()
        };

        mockBehaviorAnalytics.prototype.recordInteraction.mockResolvedValue({} as any);

        const response = await request(app)
          .post('/api/v1/content-strategies/behavior/interactions')
          .send(interactionData);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      it('should validate required fields', async () => {
        const response = await request(app)
          .post('/api/v1/content-strategies/behavior/interactions')
          .send({});

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });
  });

  describe('Trend Analysis Endpoints', () => {
    describe('GET /trends/current', () => {
      it('should get current trends', async () => {
        const mockResponse = [
          {
            name: 'Gold Necklaces',
            category: 'style',
            searchVolume: 10000,
            growthRate: 0.15,
            confidence: 0.8
          }
        ];

        mockTrendAnalysis.prototype.getCurrentTrends.mockResolvedValue(mockResponse);

        const response = await request(app)
          .get('/api/v1/content-strategies/trends/current')
          .query({ category: 'jewelry' });

        expect(response.status).toBe(200);
        expect(response.body.data).toEqual(mockResponse);
      });
    });

    describe('GET /trends/seasonal', () => {
      it('should get seasonal trends', async () => {
        const mockResponse = [
          {
            season: 'Summer 2024',
            year: 2024,
            trendingItems: ['beach jewelry', 'sun necklaces'],
            expectedGrowth: 0.25
          }
        ];

        mockTrendAnalysis.prototype.getSeasonalTrends.mockResolvedValue(mockResponse);

        const response = await request(app)
          .get('/api/v1/content-strategies/trends/seasonal');

        expect(response.status).toBe(200);
        expect(response.body.data).toEqual(mockResponse);
      });
    });
  });

  describe('A/B Testing Endpoints', () => {
    describe('GET /ab-testing/tests', () => {
      it('should get A/B tests', async () => {
        const mockResponse = [
          {
            id: 'test-123',
            name: 'Product Description Test',
            status: 'running',
            variants: [
              { name: 'Control', weight: 50 },
              { name: 'Variant A', weight: 50 }
            ]
          }
        ];

        mockABTestingEngine.prototype.getTests.mockResolvedValue(mockResponse);

        const response = await request(app)
          .get('/api/v1/content-strategies/ab-testing/tests')
          .query({ status: 'running' });

        expect(response.status).toBe(200);
        expect(response.body.data).toEqual(mockResponse);
      });
    });

    describe('POST /ab-testing/tests', () => {
      it('should create new A/B test', async () => {
        const testData = {
          name: 'New Test',
          description: 'Test description',
          productId: 'product-123',
          variants: [
            { name: 'Control', content: 'Original', weight: 50 },
            { name: 'Variant A', content: 'New', weight: 50 }
          ]
        };

        const mockResponse = {
          id: 'test-123',
          ...testData,
          status: 'draft'
        };

        mockABTestingEngine.prototype.createTest.mockResolvedValue(mockResponse);

        const response = await request(app)
          .post('/api/v1/content-strategies/ab-testing/tests')
          .send(testData);

        expect(response.status).toBe(200);
        expect(response.body.data).toEqual(mockResponse);
      });

      it('should validate variant weights', async () => {
        const testData = {
          name: 'Invalid Test',
          variants: [
            { name: 'Control', weight: 30 },
            { name: 'Variant A', weight: 50 }
          ]
        };

        const response = await request(app)
          .post('/api/v1/content-strategies/ab-testing/tests')
          .send(testData);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });

    describe('POST /ab-testing/assign', () => {
      it('should assign variant to user', async () => {
        const assignmentData = {
          testId: 'test-123',
          customerId: 'customer-456',
          sessionId: 'session-789'
        };

        const mockResponse = {
          testId: 'test-123',
          variantId: 'variant-1',
          assignedAt: new Date().toISOString()
        };

        mockABTestingEngine.prototype.assignVariant.mockResolvedValue(mockResponse);

        const response = await request(app)
          .post('/api/v1/content-strategies/ab-testing/assign')
          .send(assignmentData);

        expect(response.status).toBe(200);
        expect(response.body.data).toEqual(mockResponse);
      });
    });
  });

  describe('Journey Optimizer Endpoints', () => {
    describe('GET /journey/funnel', () => {
      it('should get journey funnel data', async () => {
        const mockResponse = {
          stages: [
            { stage: 'awareness', count: 1000, conversionRate: 1.0 },
            { stage: 'consideration', count: 400, conversionRate: 0.4 },
            { stage: 'decision', count: 150, conversionRate: 0.15 },
            { stage: 'purchase', count: 75, conversionRate: 0.075 }
          ],
          overallConversionRate: 0.075,
          averageJourneyDuration: 259200
        };

        mockJourneyOptimizer.prototype.getJourneyFunnel.mockResolvedValue(mockResponse);

        const response = await request(app)
          .get('/api/v1/content-strategies/journey/funnel');

        expect(response.status).toBe(200);
        expect(response.body.data).toEqual(mockResponse);
      });
    });

    describe('POST /journey/track', () => {
      it('should track journey interaction', async () => {
        const trackData = {
          customerId: 'customer-123',
          sessionId: 'session-456',
          interaction: {
            productId: 'product-789',
            interactionType: 'view',
            timestamp: new Date().toISOString()
          }
        };

        const mockResponse = {
          id: 'journey-123',
          customerId: 'customer-123',
          sessionId: 'session-456',
          currentStage: 'awareness'
        };

        mockJourneyOptimizer.prototype.trackCustomerJourney.mockResolvedValue(mockResponse);

        const response = await request(app)
          .post('/api/v1/content-strategies/journey/track')
          .send(trackData);

        expect(response.status).toBe(200);
        expect(response.body.data).toEqual(mockResponse);
      });
    });
  });

  describe('Dashboard Endpoints', () => {
    describe('GET /dashboard/overview', () => {
      it('should get dashboard overview', async () => {
        const mockResponse = {
          totalProducts: 215,
          activeTests: 5,
          avgConversionRate: 0.08,
          topTrends: ['Gold Necklaces', 'Diamond Rings']
        };

        mockPersonalizationEngine.prototype.getCustomerBehavior.mockResolvedValue({
          totalInteractions: 1000,
          uniqueCustomers: 200
        } as any);

        mockTrendAnalysis.prototype.getCurrentTrends.mockResolvedValue([
          { name: 'Gold Necklaces', growthRate: 0.15 },
          { name: 'Diamond Rings', growthRate: 0.12 }
        ] as any);

        mockABTestingEngine.prototype.getTests.mockResolvedValue([
          { status: 'running' },
          { status: 'running' }
        ] as any);

        const response = await request(app)
          .get('/api/v1/content-strategies/dashboard/overview');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors', async () => {
      mockPersonalizationEngine.prototype.getPersonalizedContent.mockRejectedValue(
        new Error('Service unavailable')
      );

      const response = await request(app)
        .get('/api/v1/content-strategies/personalization/product-123');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Service unavailable');
    });

    it('should handle not found errors', async () => {
      mockPersonalizationEngine.prototype.getPersonalizedContent.mockRejectedValue(
        new Error('Product not found')
      );

      const response = await request(app)
        .get('/api/v1/content-strategies/personalization/non-existent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});