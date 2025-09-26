import { create } from 'zustand'
import { KeywordData, CompetitorData, SEOTrendData, PerformanceMetrics, AnalyticsFilters } from '@/types/analytics'

interface AnalyticsState {
  keywords: KeywordData[]
  competitors: CompetitorData[]
  trends: SEOTrendData[]
  performance: PerformanceMetrics | null
  loading: boolean
  error: string | null
  filters: AnalyticsFilters
  lastUpdated: string | null
}

interface AnalyticsActions {
  setKeywords: (_keywords: KeywordData[]) => void
  setCompetitors: (_competitors: CompetitorData[]) => void
  setTrends: (_trends: SEOTrendData[]) => void
  setPerformance: (_performance: PerformanceMetrics) => void
  setLoading: (_loading: boolean) => void
  setError: (_error: string | null) => void
  setFilters: (_filters: Partial<AnalyticsFilters>) => void
  refreshData: () => Promise<void>
}

export const useAnalyticsStore = create<AnalyticsState & AnalyticsActions>((set, get) => ({
  keywords: [],
  competitors: [],
  trends: [],
  performance: null,
  loading: false,
  error: null,
  filters: {
    dateRange: '30d',
    status: 'all'
  },
  lastUpdated: null,

  setKeywords: (_keywords) => set({ keywords: _keywords }),
  setCompetitors: (_competitors) => set({ competitors: _competitors }),
  setTrends: (_trends) => set({ trends: _trends }),
  setPerformance: (_performance) => set({ performance: _performance }),
  setLoading: (_loading) => set({ loading: _loading }),
  setError: (_error) => set({ error: _error }),
  setFilters: (_filters) => set((state) => ({
    filters: { ...state.filters, ..._filters }
  })),

  refreshData: async () => {
    const { setLoading, setError, filters } = get()

    try {
      setLoading(true)
      setError(null)

      const [keywordsRes, competitorsRes, trendsRes, performanceRes] = await Promise.all([
        fetch(`/api/v1/analytics/keywords?${new URLSearchParams(filters as any)}`),
        fetch(`/api/v1/analytics/competitors?${new URLSearchParams(filters as any)}`),
        fetch(`/api/v1/analytics/trends?${new URLSearchParams(filters as any)}`),
        fetch(`/api/v1/analytics/performance?${new URLSearchParams(filters as any)}`)
      ])

      if (!keywordsRes.ok || !competitorsRes.ok || !trendsRes.ok || !performanceRes.ok) {
        throw new Error('Failed to fetch analytics data')
      }

      const [keywords, competitors, trends, performance] = await Promise.all([
        keywordsRes.json(),
        competitorsRes.json(),
        trendsRes.json(),
        performanceRes.json()
      ])

      set({
        keywords: keywords.data || [],
        competitors: competitors.data || [],
        trends: trends.data || [],
        performance: performance.data || null,
        lastUpdated: new Date().toISOString()
      })
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }
}))