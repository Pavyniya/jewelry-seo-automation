import { ABTestingEngine } from '../../services/abTestingEngine';
import { Database } from '../../utils/database';

jest.mock('../../utils/database');

describe('ABTestingEngine', () => {
  let abTestingEngine: ABTestingEngine;
  let mockDb: jest.Mocked<Database>;

  beforeEach(() => {
    mockDb = new Database() as jest.Mocked<Database>;
    abTestingEngine = new ABTestingEngine(mockDb);
    jest.clearAllMocks();
  });

  describe('createTest', () => {
    it('should create a new A/B test', async () => {
      const testData = {
        name: 'Test Product Description',
        description: 'Testing different product descriptions',
        productId: 'product-123',
        variants: [
          { name: 'Control', content: 'Original description', weight: 50 },
          { name: 'Variant A', content: 'New description', weight: 50 }
        ]
      };

      mockDb.run.mockResolvedValue({ lastID: 1 } as any);

      const result = await abTestingEngine.createTest(testData);

      expect(result.id).toBe('test-1');
      expect(result.name).toBe(testData.name);
      expect(result.variants).toHaveLength(2);
    });

    it('should validate variant weights', async () => {
      const testData = {
        name: 'Invalid Test',
        description: 'Test with invalid weights',
        productId: 'product-123',
        variants: [
          { name: 'Control', content: 'Original', weight: 30 },
          { name: 'Variant A', content: 'New', weight: 50 }
        ]
      };

      await expect(abTestingEngine.createTest(testData))
        .rejects.toThrow('Variant weights must sum to 100');
    });
  });

  describe('assignVariant', () => {
    it('should assign variant based on weights', async () => {
      const testId = 'test-123';
      const customerId = 'customer-456';
      const sessionId = 'session-789';

      mockDb.query.mockResolvedValueOnce({
        get: () => ({
          id: testId,
          variants: JSON.stringify([
            { id: 'variant-1', weight: 70 },
            { id: 'variant-2', weight: 30 }
          ])
        })
      } as any);

      mockDb.query.mockResolvedValueOnce({
        get: () => null
      } as any);

      mockDb.run.mockResolvedValue({} as any);

      const result = await abTestingEngine.assignVariant(testId, customerId, sessionId);

      expect(result.variantId).toBeDefined();
      expect(result.testId).toBe(testId);
    });

    it('should return existing assignment if already assigned', async () => {
      const testId = 'test-123';
      const customerId = 'customer-456';

      mockDb.query.mockResolvedValueOnce({
        get: () => ({ variants: '[]' })
      } as any);

      mockDb.query.mockResolvedValueOnce({
        get: () => ({ variant_id: 'variant-1', assigned_at: new Date().toISOString() })
      } as any);

      const result = await abTestingEngine.assignVariant(testId, customerId);

      expect(result.variantId).toBe('variant-1');
    });
  });

  describe('recordImpression', () => {
    it('should record test impression', async () => {
      const impression = {
        testId: 'test-123',
        variantId: 'variant-1',
        customerId: 'customer-456',
        sessionId: 'session-789'
      };

      mockDb.run.mockResolvedValue({} as any);

      await abTestingEngine.recordImpression(
        impression.testId,
        impression.variantId,
        impression.customerId,
        impression.sessionId
      );

      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO ab_test_impressions'),
        expect.arrayContaining([
          impression.testId,
          impression.variantId,
          impression.customerId,
          impression.sessionId
        ])
      );
    });
  });

  describe('recordConversion', () => {
    it('should record test conversion', async () => {
      const conversion = {
        testId: 'test-123',
        variantId: 'variant-1',
        customerId: 'customer-456',
        sessionId: 'session-789'
      };

      mockDb.run.mockResolvedValue({} as any);

      await abTestingEngine.recordConversion(
        conversion.testId,
        conversion.variantId,
        conversion.customerId,
        conversion.sessionId
      );

      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO ab_test_conversions'),
        expect.arrayContaining([
          conversion.testId,
          conversion.variantId,
          conversion.customerId,
          conversion.sessionId
        ])
      );
    });
  });

  describe('calculateStatisticalSignificance', () => {
    it('should calculate statistical significance correctly', () => {
      const control = { conversions: 50, impressions: 1000 };
      const treatment = { conversions: 70, impressions: 1000 };

      const significance = abTestingEngine['calculateStatisticalSignificance'](control, treatment);

      expect(significance.isSignificant).toBe(true);
      expect(significance.confidence).toBeGreaterThan(0.9);
      expect(significance.pValue).toBeLessThan(0.05);
    });

    it('should handle insignificant results', () => {
      const control = { conversions: 50, impressions: 1000 };
      const treatment = { conversions: 52, impressions: 1000 };

      const significance = abTestingEngine['calculateStatisticalSignificance'](control, treatment);

      expect(significance.isSignificant).toBe(false);
      expect(significance.pValue).toBeGreaterThan(0.05);
    });
  });

  describe('calculateZTest', () => {
    it('should perform Z-test calculation', () => {
      const control = { value: 0.05, size: 1000 };
      const treatment = { value: 0.07, size: 1000 };

      const result = abTestingEngine['calculateZTest'](control, treatment);

      expect(result.pValue).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.sampleSize).toBe(2000);
    });
  });

  describe('cumulativeNormalDistribution', () => {
    it('should calculate cumulative normal distribution', () => {
      const z = 1.96;

      const result = abTestingEngine['cumulativeNormalDistribution'](z);

      expect(result).toBeCloseTo(0.975, 2);
    });

    it('should handle negative Z-scores', () => {
      const z = -1.96;

      const result = abTestingEngine['cumulativeNormalDistribution'](z);

      expect(result).toBeCloseTo(0.025, 2);
    });
  });

  describe('calculateStatisticalPower', () => {
    it('should calculate statistical power', () => {
      const controlRate = 0.05;
      const treatmentRate = 0.07;
      const controlSize = 1000;
      const treatmentSize = 1000;

      const power = abTestingEngine['calculateStatisticalPower'](
        controlRate,
        treatmentRate,
        controlSize,
        treatmentSize
      );

      expect(power).toBeGreaterThan(0);
      expect(power).toBeLessThanOrEqual(1);
    });
  });

  describe('getTestResults', () => {
    it('should calculate test results', async () => {
      const testId = 'test-123';

      mockDb.query.mockResolvedValueOnce({
        get: () => ({
          id: testId,
          name: 'Test Name',
          variants: JSON.stringify([
            { id: 'variant-1', name: 'Control' },
            { id: 'variant-2', name: 'Variant A' }
          ])
        })
      } as any);

      mockDb.query.mockResolvedValueOnce({
        all: () => [
          { variant_id: 'variant-1', impressions: 1000, conversions: 50 },
          { variant_id: 'variant-2', impressions: 1000, conversions: 70 }
        ]
      } as any);

      const result = await abTestingEngine.getTestResults(testId);

      expect(result.testId).toBe(testId);
      expect(result.variantResults).toHaveLength(2);
      expect(result.statisticalSignificance.isSignificant).toBe(true);
    });
  });
});