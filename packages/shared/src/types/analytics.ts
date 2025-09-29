
export interface SeoMetrics {
  id: string;
  productId: string;
  keyword: string;
  position: number;
  searchVolume: number;
  difficulty: number;
  clickThroughRate: number;
  impressions: number;
  clicks: number;
  date: Date;
}

export interface CompetitorAnalysis {
  id: string;
  productId: string;
  competitorDomain: string;
  competitorPosition: number;
  marketShare: number;
  contentGap: string[];
  priceComparison: number;
  strengths: string[];
  weaknesses: string[];
  lastAnalyzed: Date;
}

export interface ContentQualityScore {
  id: string;
  productId: string;
  seoScore: number;
  readabilityScore: number;
  brandVoiceScore: number;
  uniquenessScore: number;
  keywordOptimization: number;
  overallScore: number;
  recommendations: string[];
  lastCalculated: Date;
}

export interface TrendAnalysis {
  id: string;
  productId: string;
  metric: string;
  timeframe: 'daily' | 'weekly' | 'monthly';
  data: TrendDataPoint[];
  trend: 'up' | 'down' | 'stable';
  changePercentage: number;
  correlation: number;
  lastUpdated: Date;
}

export interface TrendDataPoint {
  date: Date;
  value: number;
  events: string[];
}
