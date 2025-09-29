import { JourneyOptimizer } from '../../services/journeyOptimizer';
import { Database } from '../../utils/database';

jest.mock('../../utils/database');

describe('JourneyOptimizer', () => {
  let journeyOptimizer: JourneyOptimizer;
  let mockDb: jest.Mocked<Database>;

  beforeEach(() => {
    mockDb = new Database() as jest.Mocked<Database>;
    journeyOptimizer = new JourneyOptimizer(mockDb);
    jest.clearAllMocks();
  });

  describe('trackCustomerJourney', () => {
    it('should track customer journey interaction', async () => {
      const customerId = 'customer-123';
      const sessionId = 'session-456';
      const interaction = {
        productId: 'product-789',
        interactionType: 'view',
        timestamp: new Date().toISOString()
      };

      mockDb.query.mockResolvedValueOnce({
        get: () => null
      } as any);

      mockDb.run.mockResolvedValue({ lastID: 1 } as any);

      mockDb.query.mockResolvedValueOnce({
        get: () => ({ stage: 'awareness' })
      } as any);

      const result = await journeyOptimizer.trackCustomerJourney(customerId, sessionId, interaction);

      expect(result.id).toBe('journey-1');
      expect(result.customerId).toBe(customerId);
      expect(result.sessionId).toBe(sessionId);
    });

    it('should update existing journey', async () => {
      const customerId = 'customer-123';
      const sessionId = 'session-456';
      const interaction = {
        productId: 'product-789',
        interactionType: 'purchase',
        timestamp: new Date().toISOString()
      };

      mockDb.query.mockResolvedValueOnce({
        get: () => ({
          id: 'journey-1',
          current_stage: 'consideration',
          touchpoints: '[]',
          stage_transitions: '[]'
        })
      } as any);

      mockDb.run.mockResolvedValue({} as any);

      mockDb.query.mockResolvedValueOnce({
        get: () => ({ stage: 'decision' })
      } as any);

      const result = await journeyOptimizer.trackCustomerJourney(customerId, sessionId, interaction);

      expect(result.currentStage).toBe('decision');
      expect(result.stageTransitions).toHaveLength(1);
    });
  });

  describe('getJourneyOptimization', () => {
    it('should provide journey optimization recommendations', async () => {
      const customerId = 'customer-123';
      const sessionId = 'session-456';

      mockDb.query.mockResolvedValueOnce({
        get: () => ({
          id: 'journey-1',
          current_stage: 'consideration',
          score: 0.6,
          progress: 0.4
        })
      } as any);

      const result = await journeyOptimizer.getJourneyOptimization(customerId, sessionId);

      expect(result.currentStage).toBe('consideration');
      expect(result.recommendations).toHaveLength(3);
      expect(result.nextBestActions).toHaveLength(2);
    });
  });

  describe('getJourneyFunnel', () => {
    it('should get journey funnel data', async () => {
      mockDb.query.mockResolvedValueOnce({
        all: () => [
          { stage: 'awareness', count: 1000 },
          { stage: 'consideration', count: 400 },
          { stage: 'decision', count: 150 },
          { stage: 'purchase', count: 75 }
        ]
      } as any);

      mockDb.query.mockResolvedValueOnce({
        get: () => ({ avg_duration: 259200 }) // 3 days in seconds
      } as any);

      const result = await journeyOptimizer.getJourneyFunnel();

      expect(result.stages).toHaveLength(4);
      expect(result.overallConversionRate).toBe(0.075);
      expect(result.averageJourneyDuration).toBe(259200);
    });
  });

  describe('getJourneyStageContent', () => {
    it('should get stage-specific content strategies', async () => {
      mockDb.query.mockResolvedValueOnce({
        all: () => [
          {
            stage: 'awareness',
            description: 'Top of funnel content',
            key_messages: 'brand awareness,value proposition',
            content_types: 'blog posts,social media',
            effectiveness: 0.8
          },
          {
            stage: 'consideration',
            description: 'Middle of funnel content',
            key_messages: 'product features,benefits',
            content_types: 'product guides,comparisons',
            effectiveness: 0.7
          }
        ]
      } as any);

      const result = await journeyOptimizer.getJourneyStageContent();

      expect(result).toHaveLength(2);
      expect(result[0].stage).toBe('awareness');
      expect(result[0].effectiveness).toBe(0.8);
    });
  });

  describe('analyzeCurrentStage', () => {
    it('should analyze current journey stage', () => {
      const interaction = {
        interactionType: 'purchase',
        productId: 'product-123'
      } as any;

      const journey = {
        currentStage: 'decision',
        touchpoints: [],
        stageTransitions: []
      } as any;

      const stage = journeyOptimizer['analyzeCurrentStage'](interaction, journey);

      expect(stage).toBe('purchase');
    });

    it('should maintain current stage for same-level interactions', () => {
      const interaction = {
        interactionType: 'view',
        productId: 'product-123'
      } as any;

      const journey = {
        currentStage: 'awareness',
        touchpoints: [],
        stageTransitions: []
      } as any;

      const stage = journeyOptimizer['analyzeCurrentStage'](interaction, journey);

      expect(stage).toBe('awareness');
    });
  });

  describe('updateJourneyStage', () => {
    it('should update journey stage and record transition', async () => {
      const journey = {
        id: 'journey-1',
        currentStage: 'consideration',
        touchpoints: [],
        stageTransitions: []
      } as any;

      const newStage = 'decision';
      const interaction = {
        interactionType: 'click',
        productId: 'product-123'
      };

      mockDb.run.mockResolvedValue({} as any);

      const result = await journeyOptimizer['updateJourneyStage'](journey, newStage, interaction);

      expect(result.currentStage).toBe(newStage);
      expect(result.stageTransitions).toHaveLength(1);
      expect(result.stageTransitions[0].fromStage).toBe('consideration');
      expect(result.stageTransitions[0].toStage).toBe(newStage);
    });
  });

  describe('calculateJourneyScore', () => {
    it('should calculate journey score', () => {
      const journey = {
        currentStage: 'decision',
        touchpoints: [
          { interactionType: 'view' },
          { interactionType: 'click' },
          { interactionType: 'add_to_cart' }
        ],
        stageTransitions: [
          { fromStage: 'awareness', toStage: 'consideration' },
          { fromStage: 'consideration', toStage: 'decision' }
        ]
      } as any;

      const score = journeyOptimizer['calculateJourneyScore'](journey);

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1);
    });
  });

  describe('calculateJourneyProgress', () => {
    it('should calculate journey progress', () => {
      const journey = {
        currentStage: 'decision',
        touchpoints: [],
        stageTransitions: []
      } as any;

      const progress = journeyOptimizer['calculateJourneyProgress'](journey);

      expect(progress).toBe(0.6); // decision is 60% through the journey
    });
  });

  describe('getStageRecommendations', () => {
    it('should provide stage-specific recommendations', () => {
      const stage = 'consideration';

      const recommendations = journeyOptimizer['getStageRecommendations'](stage);

      expect(recommendations).toHaveLength(3);
      expect(recommendations[0].action).toContain('detailed product information');
    });

    it('should handle all journey stages', () => {
      const stages = ['awareness', 'consideration', 'decision', 'purchase', 'retention', 'advocacy'];

      stages.forEach(stage => {
        const recommendations = journeyOptimizer['getStageRecommendations'](stage as any);
        expect(recommendations.length).toBeGreaterThan(0);
      });
    });
  });

  describe('getNextBestActions', () => {
    it('should suggest next best actions', () => {
      const stage = 'decision';

      const actions = journeyOptimizer['getNextBestActions'](stage);

      expect(actions).toHaveLength(2);
      expect(actions[0]).toContain('offer limited-time discount');
    });
  });

  describe('calculateTransitionProbability', () => {
    it('should calculate transition probability', () => {
      const fromStage = 'awareness';
      const toStage = 'consideration';

      const probability = journeyOptimizer['calculateTransitionProbability'](fromStage, toStage);

      expect(probability).toBeGreaterThan(0);
      expect(probability).toBeLessThanOrEqual(1);
    });
  });
});