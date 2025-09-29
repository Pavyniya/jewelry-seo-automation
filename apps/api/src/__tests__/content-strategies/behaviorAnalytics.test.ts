import { BehaviorAnalytics } from '../../services/behaviorAnalytics';
import { Database } from '../../utils/database';

jest.mock('../../utils/database');

describe('BehaviorAnalytics', () => {
  let behaviorAnalytics: BehaviorAnalytics;
  let mockDb: jest.Mocked<Database>;

  beforeEach(() => {
    mockDb = new Database() as jest.Mocked<Database>;
    behaviorAnalytics = new BehaviorAnalytics(mockDb);
    jest.clearAllMocks();
  });

  describe('recordInteraction', () => {
    it('should record customer interaction', async () => {
      const interaction = {
        customerId: 'customer-123',
        sessionId: 'session-456',
        productId: 'product-789',
        interactionType: 'view',
        timestamp: new Date().toISOString()
      };

      mockDb.run.mockResolvedValue({} as any);

      await behaviorAnalytics.recordInteraction(interaction);

      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO customer_interactions'),
        expect.arrayContaining([
          interaction.customerId,
          interaction.sessionId,
          interaction.productId,
          interaction.interactionType,
          expect.any(String)
        ])
      );
    });

    it('should process interaction buffer when full', async () => {
      const interaction = {
        sessionId: 'session-456',
        productId: 'product-789',
        interactionType: 'view' as const,
        timestamp: new Date().toISOString()
      };

      mockDb.run.mockResolvedValue({} as any);

      // Fill buffer to capacity
      for (let i = 0; i < 100; i++) {
        await behaviorAnalytics.recordInteraction({ ...interaction, sessionId: `session-${i}` });
      }

      expect(mockDb.run).toHaveBeenCalled();
    });
  });

  describe('analyzeBehavior', () => {
    it('should analyze customer behavior patterns', async () => {
      const customerId = 'customer-123';

      mockDb.query.mockResolvedValueOnce({
        all: () => [
          { interaction_type: 'view', count: 10 },
          { interaction_type: 'click', count: 5 },
          { interaction_type: 'purchase', count: 2 }
        ]
      } as any);

      mockDb.query.mockResolvedValueOnce({
        get: () => ({ avg_duration: 450 })
      } as any);

      const result = await behaviorAnalytics.analyzeBehavior(customerId);

      expect(result.totalInteractions).toBe(17);
      expect(result.conversionRate).toBeCloseTo(0.118, 2);
      expect(result.interactionDistribution.view).toBe(10);
    });
  });

  describe('getBehaviorPatterns', () => {
    it('should identify behavior patterns', async () => {
      const timeframe = '7d';

      mockDb.query.mockResolvedValueOnce({
        all: () => [
          {
            pattern_type: 'browse_then_buy',
            sequence: 'view,click,purchase',
            frequency: 15,
            confidence: 0.85
          }
        ]
      } as any);

      const result = await behaviorAnalytics.getBehaviorPatterns(timeframe);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Browse Then Buy');
      expect(result[0].confidence).toBe(0.85);
    });
  });

  describe('generateInsights', () => {
    it('should generate insights from behavior data', () => {
      const behavior = {
        totalInteractions: 50,
        uniqueCustomers: 20,
        averageSessionDuration: 300,
        conversionRate: 0.25,
        interactionDistribution: {
          view: 30,
          click: 15,
          purchase: 5
        }
      } as any;

      const insights = behaviorAnalytics['generateInsights'](behavior);

      expect(insights).toHaveLength(3);
      expect(insights[0].type).toBe('high_engagement');
      expect(insights[0].action).toContain('create personalized recommendations');
    });
  });

  describe('identifyPatterns', () => {
    it('should identify patterns from interactions', () => {
      const interactions = [
        { interactionType: 'view', timestamp: new Date(Date.now() - 3600000).toISOString() },
        { interactionType: 'click', timestamp: new Date(Date.now() - 1800000).toISOString() },
        { interactionType: 'purchase', timestamp: new Date().toISOString() }
      ] as any;

      const patterns = behaviorAnalytics['identifyPatterns'](interactions);

      expect(patterns).toHaveLength(1);
      expect(patterns[0].actions).toEqual(['view', 'click', 'purchase']);
    });
  });

  describe('calculatePatternConfidence', () => {
    it('should calculate pattern confidence', () => {
      const pattern = {
        frequency: 20,
        totalInteractions: 100,
        conversionRate: 0.3
      } as any;

      const confidence = behaviorAnalytics['calculatePatternConfidence'](pattern);

      expect(confidence).toBeGreaterThan(0);
      expect(confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('isHighValueInteraction', () => {
    it('should identify high-value interactions', () => {
      const purchaseInteraction = { interactionType: 'purchase' } as any;
      const viewInteraction = { interactionType: 'view' } as any;

      expect(behaviorAnalytics['isHighValueInteraction'](purchaseInteraction)).toBe(true);
      expect(behaviorAnalytics['isHighValueInteraction'](viewInteraction)).toBe(false);
    });
  });

  describe('processBatchInteractions', () => {
    it('should process batch interactions efficiently', async () => {
      const interactions = [
        { sessionId: 'session-1', interactionType: 'view' },
        { sessionId: 'session-2', interactionType: 'click' }
      ] as any;

      mockDb.run.mockResolvedValue({} as any);

      await behaviorAnalytics['processBatchInteractions'](interactions);

      expect(mockDb.run).toHaveBeenCalledTimes(1);
    });
  });
});