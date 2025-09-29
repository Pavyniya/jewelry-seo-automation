import { TrendAnalysis } from '../../services/trendAnalysis';
import { Database } from '../../utils/database';

jest.mock('../../utils/database');

describe('TrendAnalysis', () => {
  let trendAnalysis: TrendAnalysis;
  let mockDb: jest.Mocked<Database>;

  beforeEach(() => {
    mockDb = new Database() as jest.Mocked<Database>;
    trendAnalysis = new TrendAnalysis(mockDb);
    jest.clearAllMocks();
  });

  describe('getCurrentTrends', () => {
    it('should fetch current trends', async () => {
      const category = 'jewelry';

      mockDb.query.mockResolvedValueOnce({
        all: () => [
          {
            name: 'Gold Necklaces',
            category: 'style',
            search_volume: 10000,
            growth_rate: 0.15,
            competition: 0.6,
            confidence: 0.85
          }
        ]
      } as any);

      const result = await trendAnalysis.getCurrentTrends(category);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Gold Necklaces');
      expect(result[0].growthRate).toBe(0.15);
    });
  });

  describe('getSeasonalTrends', () => {
    it('should fetch seasonal trends', async () => {
      mockDb.query.mockResolvedValueOnce({
        all: () => [
          {
            season: 'Summer 2024',
            year: 2024,
            trend_items: 'beach jewelry,sun necklaces',
            peak_start: '2024-06-01',
            peak_end: '2024-08-31',
            expected_growth: 0.25
          }
        ]
      } as any);

      const result = await trendAnalysis.getSeasonalTrends();

      expect(result).toHaveLength(1);
      expect(result[0].season).toBe('Summer 2024');
      expect(result[0].trendingItems).toEqual(['beach jewelry', 'sun necklaces']);
    });
  });

  describe('getTrendForecast', () => {
    it('should generate trend forecast', async () => {
      const timeframe = '30d';

      mockDb.query.mockResolvedValueOnce({
        all: () => [
          {
            name: 'Emerald Rings',
            predicted_growth: 0.20,
            confidence: 0.75,
            predicted_peak: '2024-12-15'
          }
        ]
      } as any);

      const result = await trendAnalysis.getTrendForecast(timeframe);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Emerald Rings');
      expect(result[0].growthRate).toBe(0.20);
    });
  });

  describe('fetchSearchTrends', () => {
    it('should fetch search trends', async () => {
      const category = 'rings';

      mockDb.query.mockResolvedValueOnce({
        all: () => [
          {
            keyword: 'engagement rings',
            search_volume: 50000,
            growth_rate: 0.12
          }
        ]
      } as any);

      const result = await trendAnalysis['fetchSearchTrends'](category);

      expect(result).toHaveLength(1);
      expect(result[0].keyword).toBe('engagement rings');
      expect(result[0].searchVolume).toBe(50000);
    });
  });

  describe('fetchSocialMediaTrends', () => {
    it('should fetch social media trends', async () => {
      const category = 'necklaces';

      mockDb.query.mockResolvedValueOnce({
        all: () => [
          {
            platform: 'instagram',
            hashtag: 'layerednecklaces',
            mention_count: 25000,
            sentiment_score: 0.8
          }
        ]
      } as any);

      const result = await trendAnalysis['fetchSocialMediaTrends'](category);

      expect(result).toHaveLength(1);
      expect(result[0].platform).toBe('instagram');
      expect(result[0].hashtag).toBe('layerednecklaces');
    });
  });

  describe('analyzeTrendPatterns', () => {
    it('should analyze trend patterns', () => {
      const trends = [
        {
          name: 'Trend 1',
          searchVolume: 10000,
          growthRate: 0.15,
          competition: 0.6
        },
        {
          name: 'Trend 2',
          searchVolume: 5000,
          growthRate: 0.25,
          competition: 0.4
        }
      ] as any;

      const patterns = trendAnalysis['analyzeTrendPatterns'](trends);

      expect(patterns).toHaveLength(2);
      expect(patterns[0].opportunityScore).toBeGreaterThan(0);
    });
  });

  describe('prioritizeTrends', () => {
    it('should prioritize trends by opportunity score', () => {
      const trends = [
        { name: 'Low Priority', opportunityScore: 0.3 },
        { name: 'High Priority', opportunityScore: 0.8 },
        { name: 'Medium Priority', opportunityScore: 0.5 }
      ] as any;

      const prioritized = trendAnalysis['prioritizeTrends'](trends);

      expect(prioritized[0].name).toBe('High Priority');
      expect(prioritized[1].name).toBe('Medium Priority');
      expect(prioritized[2].name).toBe('Low Priority');
    });
  });

  describe('calculateOpportunityScore', () => {
    it('should calculate opportunity score', () => {
      const trend = {
        searchVolume: 10000,
        growthRate: 0.2,
        competition: 0.5,
        confidence: 0.8
      } as any;

      const score = trendAnalysis['calculateOpportunityScore'](trend);

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrThan(1);
    });
  });

  describe('getTrendKeywords', () => {
    it('should extract trend keywords', () => {
      const trend = {
        name: 'Gold Diamond Rings',
        keywords: 'gold rings,diamond rings,engagement rings'
      } as any;

      const keywords = trendAnalysis['getTrendKeywords'](trend);

      expect(keywords).toEqual(['gold rings', 'diamond rings', 'engagement rings']);
    });
  });
});