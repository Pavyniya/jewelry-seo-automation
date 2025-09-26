export interface KeywordData {
  keyword: string
  position: number
  searchVolume: number
  difficulty: number
  traffic: number
  impressions: number
  clicks: number
  ctr: number
  trend: 'up' | 'down' | 'stable'
  change: number
  lastUpdated: string
}

export interface CompetitorData {
  domain: string
  name: string
  keywords: number
  traffic: number
  authority: number
  overlap: number
  sharedKeywords: string[]
  topKeywords: KeywordData[]
}

export interface ContentQualityMetrics {
  readability: number
  keywordDensity: number
  contentLength: number
  headingStructure: number
  imageOptimization: number
  metaTags: number
  internalLinks: number
  overallScore: number
}

export interface SEOTrendData {
  date: string
  organicTraffic: number
  keywordPositions: number
  backlinks: number
  pageSpeed: number
  mobileUsability: number
  overallScore: number
}

export interface PerformanceMetrics {
  impressions: number
  clicks: number
  ctr: number
  conversions: number
  conversionRate: number
  revenue: number
  bounceRate: number
  avgSessionDuration: number
  pagesPerSession: number
}

export interface AnalyticsFilters {
  dateRange: '7d' | '30d' | '90d' | '1y' | 'custom'
  startDate?: string
  endDate?: string
  category?: string
  vendor?: string
  status?: 'all' | 'optimized' | 'needs-optimization' | 'not-optimized'
}

export interface AnalyticsReport {
  id: string
  name: string
  type: 'keyword' | 'competitor' | 'content' | 'performance' | 'trend'
  filters: AnalyticsFilters
  data: any
  createdAt: string
  scheduled?: boolean
  schedule?: 'daily' | 'weekly' | 'monthly'
}