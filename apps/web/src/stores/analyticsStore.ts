
import { create } from 'zustand';
import { SeoMetrics, CompetitorAnalysis, ContentQualityScore, TrendAnalysis } from 'packages/shared/src/types/analytics';
import { getSeoMetrics, getCompetitorAnalysis, getContentQualityScores, getTrendAnalysis } from '../services/analyticsService';

interface Filters {
  dateRange: string;
}

interface Performance {
  impressions: number;
  ctr: number;
  position: number;
  clicks: number;
}

interface AnalyticsState {
  seoMetrics: SeoMetrics[];
  competitorData: CompetitorAnalysis[];
  qualityScores: ContentQualityScore[];
  trendData: TrendAnalysis[];
  contentGapData: string[];
  keywords: any[];
  performance: Performance | null;
  loading: boolean;
  error: string | null;
  filters: Filters;
  lastUpdated: string | null;
  setFilters: (filters: Partial<Filters>) => void;
  refreshData: () => Promise<void>;
}

const useAnalyticsStore = create<AnalyticsState>((set) => ({
  seoMetrics: [],
  competitorData: [],
  qualityScores: [],
  trendData: [],
  contentGapData: [],
  keywords: [],
  performance: null,
  loading: false,
  error: null,
  filters: {
    dateRange: '30d'
  },
  lastUpdated: null,
  setFilters: (newFilters) => set((state) => ({
    filters: { ...state.filters, ...newFilters }
  })),
  refreshData: async () => {
    set({ loading: true, error: null });
    try {
      const [seoMetrics, competitorData, qualityScores, trendData] = await Promise.all([
        getSeoMetrics(),
        getCompetitorAnalysis(),
        getContentQualityScores(),
        getTrendAnalysis(),
      ]);

      // Calculate performance metrics from SEO metrics
      const performance = seoMetrics.length > 0 ? {
        impressions: seoMetrics.reduce((sum, metric) => sum + (metric.impressions || 0), 0),
        ctr: seoMetrics.reduce((sum, metric) => sum + (metric.clickThroughRate || 0), 0) / seoMetrics.length,
        position: seoMetrics.reduce((sum, metric) => sum + (metric.position || 0), 0) / seoMetrics.length,
        clicks: seoMetrics.reduce((sum, metric) => sum + (metric.clicks || 0), 0),
      } : {
        impressions: 0,
        ctr: 0,
        position: 0,
        clicks: 0,
      };

      set({
        seoMetrics,
        competitorData,
        qualityScores,
        trendData,
        contentGapData: [], // This will be populated from a real source later
        performance,
        loading: false,
        lastUpdated: new Date().toISOString(),
        error: null,
      });
    } catch (error) {
      console.error("Failed to refresh analytics data:", error);
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch analytics data',
        lastUpdated: new Date().toISOString()
      });
    }
  },
}));

export { useAnalyticsStore };
export default useAnalyticsStore;
