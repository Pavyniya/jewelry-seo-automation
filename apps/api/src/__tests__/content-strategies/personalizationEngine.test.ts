import { PersonalizationEngine } from '../../services/personalizationEngine';
import { Database } from '../../utils/database';

jest.mock('../../utils/database');

describe('PersonalizationEngine', () => {
  let personalizationEngine: PersonalizationEngine;
  let mockDb: jest.Mocked<Database>;

  beforeEach(() => {
    mockDb = new Database() as jest.Mocked<Database>;
    personalizationEngine = new PersonalizationEngine(mockDb);
    jest.clearAllMocks();
  });

  describe('getPersonalizedContent', () => {
    it('should generate personalized content for a product', async () => {
      const productId = 'test-product-123';
      const customerId = 'customer-456';
      const sessionId = 'session-789';

      mockDb.query.mockResolvedValueOnce({
        all: () => [{ id: productId, title: 'Test Product', description: 'A test product' }]
      } as any);

      mockDb.query.mockResolvedValueOnce({
        all: () => []
      } as any);

      const result = await personalizationEngine.getPersonalizedContent(productId, customerId, sessionId);

      expect(result).toBeDefined();
      expect(result.contentVariants).toHaveLength(2);
      expect(result.recommendations).toHaveLength(3);
      expect(result.customerSegments).toEqual(['new_visitor']);
    });

    it('should handle returning customer segments', async () => {
      const productId = 'test-product-123';
      const customerId = 'customer-456';

      mockDb.query.mockResolvedValueOnce({
        all: () => [{ id: productId, title: 'Test Product', description: 'A test product' }]
      } as any);

      mockDb.query.mockResolvedValueOnce({
        all: () => [
          { customer_id: customerId, interaction_type: 'purchase' },
          { customer_id: customerId, interaction_type: 'view' }
        ]
      } as any);

      const result = await personalizationEngine.getPersonalizedContent(productId, customerId);

      expect(result.customerSegments).toContain('returning_customer');
    });

    it('should handle missing product', async () => {
      const productId = 'non-existent-product';

      mockDb.query.mockResolvedValueOnce({
        all: () => []
      } as any);

      await expect(personalizationEngine.getPersonalizedContent(productId))
        .rejects.toThrow('Product not found');
    });
  });

  describe('getCustomerBehavior', () => {
    it('should retrieve customer behavior profile', async () => {
      const customerId = 'customer-456';
      const sessionId = 'session-789';

      mockDb.query.mockResolvedValueOnce({
        all: () => [
          { interaction_type: 'view', count: 5 },
          { interaction_type: 'click', count: 3 }
        ]
      } as any);

      mockDb.query.mockResolvedValueOnce({
        get: () => ({ avg_duration: 300 })
      } as any);

      const result = await personalizationEngine.getCustomerBehavior(customerId, sessionId);

      expect(result.totalInteractions).toBe(8);
      expect(result.uniqueCustomers).toBe(1);
      expect(result.averageSessionDuration).toBe(300);
    });
  });

  describe('analyzeCustomerSegments', () => {
    it('should analyze and categorize customer segments', async () => {
      const behavior = {
        totalInteractions: 15,
        uniqueCustomers: 1,
        averageSessionDuration: 600,
        conversionRate: 0.8,
        interactionDistribution: {
          view: 10,
          click: 3,
          purchase: 2
        }
      };

      const segments = personalizationEngine['analyzeCustomerSegments'](behavior);

      expect(segments).toContain('high_value');
      expect(segments).toContain('returning_customer');
    });
  });

  describe('generatePersonalizedVariants', () => {
    it('should generate content variants based on segments', async () => {
      const productId = 'test-product-123';
      const behavior = {
        segments: ['new_visitor', 'price_sensitive'],
        preferences: { priceRange: 'low' }
      } as any;

      const variants = await personalizationEngine['generatePersonalizedVariants'](productId, behavior, []);

      expect(variants).toHaveLength(2);
      expect(variants[0].content).toContain('affordable');
      expect(variants[0].segments).toContain('price_sensitive');
    });
  });

  describe('getApplicableRules', () => {
    it('should return applicable personalization rules', () => {
      const behavior = {
        segments: ['new_visitor'],
        timeOfDay: 'morning',
        season: 'summer'
      } as any;

      const rules = personalizationEngine['getApplicableRules'](behavior);

      expect(rules).toHaveLength(2);
      expect(rules[0].segment).toBe('new_visitor');
    });
  });

  describe('selectBestVariant', () => {
    it('should select the best content variant', () => {
      const variants = [
        { content: 'Variant 1', confidence: 0.8, segments: ['new_visitor'] },
        { content: 'Variant 2', confidence: 0.9, segments: ['returning_customer'] }
      ] as any;

      const behavior = { segments: ['returning_customer'] } as any;

      const bestVariant = personalizationEngine['selectBestVariant'](variants, behavior);

      expect(bestVariant.content).toBe('Variant 2');
      expect(bestVariant.confidence).toBe(0.9);
    });
  });
});