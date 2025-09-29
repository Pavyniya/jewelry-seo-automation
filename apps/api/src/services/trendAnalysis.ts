import {
  TrendAnalysis,
  TrendAction,
  CustomerSegment,
  JourneyStage
} from '@jewelry-seo/shared/types/contentStrategy';
import { database } from '../utils/database';
import { aiProviderEngine } from './aiProviderEngine';

export interface TrendDataSource {
  name: string;
  type: 'social_media' | 'search_trends' | 'competitor_analysis' | 'sales_data' | 'market_research';
  url?: string;
  apiKey?: string;
  isActive: boolean;
  lastUpdated: Date;
}

export interface JewelryTrend {
  category: string;
  keywords: string[];
  sentiment: number;
  popularity: number;
  trend_direction: 'rising' | 'stable' | 'declining';
  seasonal_factor: number;
  region?: string;
  demographic: string[];
}

export interface CompetitorTrend {
  competitor_id: string;
  trend_type: 'pricing' | 'product' | 'marketing' | 'content';
  description: string;
  impact: 'low' | 'medium' | 'high';
  detected_at: Date;
}

export class TrendAnalysisService {
  private dataSources: Map<string, TrendDataSource> = new Map();
  private trendCache: Map<string, TrendAnalysis[]> = new Map();
  private jewelryTrends: Map<string, JewelryTrend[]> = new Map();
  private competitorTrends: Map<string, CompetitorTrend[]> = new Map();
  private trendHistory: Map<string, TrendAnalysis[]> = new Map();

  constructor() {
    this.initializeDataSources();
    this.startTrendMonitoring();
    this.loadHistoricalTrends();
  }

  private initializeDataSources(): void {
    const sources: TrendDataSource[] = [
      {
        name: 'Google Trends',
        type: 'search_trends',
        isActive: true,
        lastUpdated: new Date()
      },
      {
        name: 'Instagram Fashion',
        type: 'social_media',
        isActive: true,
        lastUpdated: new Date()
      },
      {
        name: 'Pinterest Jewelry',
        type: 'social_media',
        isActive: true,
        lastUpdated: new Date()
      },
      {
        name: 'Competitor Analysis',
        type: 'competitor_analysis',
        isActive: true,
        lastUpdated: new Date()
      },
      {
        name: 'Sales Data',
        type: 'sales_data',
        isActive: true,
        lastUpdated: new Date()
      }
    ];

    sources.forEach(source => {
      this.dataSources.set(source.name, source);
    });
  }

  async getCurrentTrends(category?: string): Promise<TrendAnalysis[]> {
    try {
      const cacheKey = category || 'all';

      // Check cache first
      if (this.trendCache.has(cacheKey)) {
        const cached = this.trendCache.get(cacheKey)!;
        // Check if cache is still valid (less than 1 hour old)
        if (Date.now() - cached[0]?.detectedAt.getTime() < 3600000) {
          return cached;
        }
      }

      // Fetch fresh trends
      const trends = await this.fetchCurrentTrends(category);

      // Cache the results
      this.trendCache.set(cacheKey, trends);

      return trends;
    } catch (error) {
      console.error('Error getting current trends:', error);
      return [];
    }
  }

  private async fetchCurrentTrends(category?: string): Promise<TrendAnalysis[]> {
    const trends: TrendAnalysis[] = [];

    try {
      // Fetch from multiple sources
      const [searchTrends, socialTrends, salesTrends, competitorTrends] = await Promise.all([
        this.fetchSearchTrends(category),
        this.fetchSocialMediaTrends(category),
        this.fetchSalesTrends(category),
        this.fetchCompetitorTrends(category)
      ]);

      trends.push(...searchTrends, ...socialTrends, ...salesTrends, ...competitorTrends);

      // Analyze and prioritize trends
      const prioritizedTrends = this.prioritizeTrends(trends);

      // Store in history
      this.storeTrendHistory(prioritizedTrends);

      return prioritizedTrends;
    } catch (error) {
      console.error('Error fetching trends:', error);
      return [];
    }
  }

  private async fetchSearchTrends(category?: string): Promise<TrendAnalysis[]> {
    try {
      // Simulate Google Trends API call
      // In a real implementation, this would call the actual Google Trends API
      const mockSearchTrends = this.generateMockSearchTrends(category);

      return mockSearchTrends.map(trend => ({
        id: `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        trendType: 'market',
        keywords: trend.keywords,
        sentiment: trend.sentiment,
        urgency: trend.urgency,
        relevanceScore: this.calculateRelevanceScore(trend, category),
        recommendedActions: this.generateTrendActions(trend, 'search'),
        detectedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        confidence: 0.8,
        source: 'search_trends'
      }));
    } catch (error) {
      console.error('Error fetching search trends:', error);
      return [];
    }
  }

  private generateMockSearchTrends(category?: string): any[] {
    const baseTrends = [
      {
        keywords: ['sustainable jewelry', 'eco-friendly jewelry', 'recycled materials'],
        sentiment: 0.8,
        urgency: 0.7,
        category: 'sustainability'
      },
      {
        keywords: ['layered necklaces', 'stacking rings', 'mix and match'],
        sentiment: 0.9,
        urgency: 0.6,
        category: 'styling'
      },
      {
        keywords: ['birthstone jewelry', 'personalized engraving', 'custom pieces'],
        sentiment: 0.85,
        urgency: 0.5,
        category: 'personalization'
      },
      {
        keywords: ['gold jewelry', 'yellow gold', 'classic styles'],
        sentiment: 0.75,
        urgency: 0.4,
        category: 'materials'
      },
      {
        keywords: ['minimalist jewelry', 'simple designs', 'everyday wear'],
        sentiment: 0.8,
        urgency: 0.6,
        category: 'design'
      }
    ];

    if (category) {
      return baseTrends.filter(trend =>
        trend.category === category.toLowerCase() ||
        trend.keywords.some(keyword => keyword.toLowerCase().includes(category.toLowerCase()))
      );
    }

    return baseTrends;
  }

  private async fetchSocialMediaTrends(category?: string): Promise<TrendAnalysis[]> {
    try {
      // Simulate social media trend analysis
      const mockSocialTrends = this.generateMockSocialTrends(category);

      return mockSocialTrends.map(trend => ({
        id: `social_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        trendType: 'emerging',
        keywords: trend.keywords,
        sentiment: trend.sentiment,
        urgency: trend.urgency,
        relevanceScore: this.calculateRelevanceScore(trend, category),
        recommendedActions: this.generateTrendActions(trend, 'social'),
        detectedAt: new Date(),
        expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
        confidence: 0.7,
        source: 'social_media'
      }));
    } catch (error) {
      console.error('Error fetching social media trends:', error);
      return [];
    }
  }

  private generateMockSocialTrends(category?: string): any[] {
    const socialTrends = [
      {
        keywords: ['celebrity jewelry', 'red carpet', 'influencer picks'],
        sentiment: 0.9,
        urgency: 0.8,
        category: 'celebrity'
      },
      {
        keywords: ['vintage jewelry', 'antique pieces', 'retro styles'],
        sentiment: 0.85,
        urgency: 0.6,
        category: 'vintage'
      },
      {
        keywords: ['summer jewelry', 'beach accessories', 'vacation pieces'],
        sentiment: 0.8,
        urgency: 0.9,
        category: 'seasonal'
      },
      {
        keywords: ['engagement rings', 'wedding jewelry', 'bridal accessories'],
        sentiment: 0.95,
        urgency: 0.7,
        category: 'bridal'
      }
    ];

    if (category) {
      return socialTrends.filter(trend =>
        trend.category === category.toLowerCase() ||
        trend.keywords.some(keyword => keyword.toLowerCase().includes(category.toLowerCase()))
      );
    }

    return socialTrends;
  }

  private async fetchSalesTrends(category?: string): Promise<TrendAnalysis[]> {
    try {
      // Analyze internal sales data
      const salesTrends = await this.analyzeSalesData(category);

      return salesTrends.map(trend => ({
        id: `sales_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        trendType: 'market',
        keywords: trend.keywords,
        sentiment: trend.sentiment,
        urgency: trend.urgency,
        relevanceScore: this.calculateRelevanceScore(trend, category),
        recommendedActions: this.generateTrendActions(trend, 'sales'),
        detectedAt: new Date(),
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        confidence: 0.9,
        source: 'sales_data'
      }));
    } catch (error) {
      console.error('Error fetching sales trends:', error);
      return [];
    }
  }

  private async analyzeSalesData(category?: string): Promise<any[]> {
    try {
      // Query sales data from database
      const query = category
        ? `SELECT p.category, COUNT(*) as sales_count, AVG(p.price) as avg_price
           FROM products p
           JOIN order_items oi ON p.id = oi.product_id
           WHERE p.category LIKE ?
           GROUP BY p.category
           ORDER BY sales_count DESC
           LIMIT 5`
        : `SELECT p.category, COUNT(*) as sales_count, AVG(p.price) as avg_price
           FROM products p
           JOIN order_items oi ON p.id = oi.product_id
           GROUP BY p.category
           ORDER BY sales_count DESC
           LIMIT 5`;

      const salesData = await database.all(query, category ? [`%${category}%`] : []);

      return salesData.map(row => ({
        keywords: [row.category, 'trending', 'popular'],
        sentiment: Math.min(0.5 + (row.sales_count / 100), 1.0),
        urgency: row.sales_count > 50 ? 0.8 : 0.5,
        category: row.category,
        salesCount: row.sales_count,
        avgPrice: row.avg_price
      }));
    } catch (error) {
      console.error('Error analyzing sales data:', error);
      return [];
    }
  }

  private async fetchCompetitorTrends(category?: string): Promise<TrendAnalysis[]> {
    try {
      // Analyze competitor activities
      const competitorTrends = await this.analyzeCompetitorData(category);

      return competitorTrends.map(trend => ({
        id: `competitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        trendType: 'competitive',
        keywords: trend.keywords,
        sentiment: trend.sentiment,
        urgency: trend.urgency,
        relevanceScore: this.calculateRelevanceScore(trend, category),
        recommendedActions: this.generateTrendActions(trend, 'competitor'),
        detectedAt: new Date(),
        expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
        confidence: 0.6,
        source: 'competitor_analysis'
      }));
    } catch (error) {
      console.error('Error fetching competitor trends:', error);
      return [];
    }
  }

  private async analyzeCompetitorData(category?: string): Promise<any[]> {
    try {
      // Mock competitor analysis
      const competitorActivities = [
        {
          keywords: ['new collection', 'limited edition', 'exclusive'],
          sentiment: 0.7,
          urgency: 0.9,
          category: 'product_launch'
        },
        {
          keywords: ['discount promotion', 'sale event', 'special offer'],
          sentiment: 0.6,
          urgency: 0.8,
          category: 'pricing'
        },
        {
          keywords: ['social media campaign', 'influencer partnership', 'marketing'],
          sentiment: 0.8,
          urgency: 0.7,
          category: 'marketing'
        }
      ];

      if (category) {
        return competitorActivities.filter(activity =>
          activity.category.toLowerCase().includes(category.toLowerCase())
        );
      }

      return competitorActivities;
    } catch (error) {
      console.error('Error analyzing competitor data:', error);
      return [];
    }
  }

  private calculateRelevanceScore(trend: any, category?: string): number {
    let score = 0.5; // Base score

    // Boost score based on sentiment
    score += trend.sentiment * 0.2;

    // Boost score based on urgency
    score += trend.urgency * 0.2;

    // Boost score if category matches
    if (category && trend.category === category.toLowerCase()) {
      score += 0.3;
    }

    // Boost score for high-confidence sources
    if (trend.source === 'sales_data') {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  private generateTrendActions(trend: any, source: string): TrendAction[] {
    const actions: TrendAction[] = [];

    // Content-related actions
    if (trend.keywords.some((k: string) => k.includes('trending') || k.includes('popular'))) {
      actions.push({
        type: 'create_content',
        priority: 'high',
        description: `Create content around trending topic: ${trend.keywords[0]}`,
        expectedImpact: 'Increased engagement and traffic',
        timeframe: '1-2 weeks',
        resources: ['Content team', 'Design team']
      });
    }

    // Pricing-related actions
    if (trend.keywords.some((k: string) => k.includes('discount') || k.includes('sale'))) {
      actions.push({
        type: 'update_pricing',
        priority: 'medium',
        description: 'Consider competitive pricing adjustments',
        expectedImpact: 'Maintain price competitiveness',
        timeframe: '1 week',
        resources: ['Pricing team', 'Marketing']
      });
    }

    // Marketing-related actions
    if (trend.keywords.some((k: string) => k.includes('social') || k.includes('influencer'))) {
      actions.push({
        type: 'launch_campaign',
        priority: 'high',
        description: 'Launch social media campaign targeting trend',
        expectedImpact: 'Increased brand awareness and engagement',
        timeframe: '2-3 weeks',
        resources: ['Marketing team', 'Social media team']
      });
    }

    // Product-related actions
    if (trend.keywords.some((k: string) => k.includes('new') || k.includes('collection'))) {
      actions.push({
        type: 'adjust_inventory',
        priority: 'medium',
        description: 'Review inventory levels for trending products',
        expectedImpact: 'Optimize stock and prevent stockouts',
        timeframe: '1 week',
        resources: ['Inventory team', 'Buying team']
      });
    }

    return actions;
  }

  private prioritizeTrends(trends: TrendAnalysis[]): TrendAnalysis[] {
    return trends
      .sort((a, b) => {
        // Sort by relevance score, then urgency, then confidence
        if (a.relevanceScore !== b.relevanceScore) {
          return b.relevanceScore - a.relevanceScore;
        }
        if (a.urgency !== b.urgency) {
          return b.urgency - a.urgency;
        }
        return b.confidence - a.confidence;
      })
      .slice(0, 10); // Return top 10 trends
  }

  private storeTrendHistory(trends: TrendAnalysis[]): void {
    const today = new Date().toDateString();

    if (!this.trendHistory.has(today)) {
      this.trendHistory.set(today, []);
    }

    this.trendHistory.get(today)!.push(...trends);

    // Keep only last 30 days of history
    const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    for (const [date, trends] of this.trendHistory.entries()) {
      if (new Date(date) < cutoffDate) {
        this.trendHistory.delete(date);
      }
    }
  }

  async getSeasonalTrends(season?: string): Promise<TrendAnalysis[]> {
    try {
      const currentSeason = season || this.getCurrentSeason();
      const allTrends = await this.getCurrentTrends();

      // Filter for seasonal trends
      const seasonalTrends = allTrends.filter(trend =>
        trend.keywords.some(keyword =>
          keyword.toLowerCase().includes(currentSeason.toLowerCase()) ||
          this.isSeasonalKeyword(keyword, currentSeason)
        )
      );

      // Add AI-powered seasonal insights
      const aiInsights = await this.generateSeasonalInsights(currentSeason);
      seasonalTrends.push(...aiInsights);

      return seasonalTrends;
    } catch (error) {
      console.error('Error getting seasonal trends:', error);
      return [];
    }
  }

  private getCurrentSeason(): string {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }

  private isSeasonalKeyword(keyword: string, season: string): boolean {
    const seasonalKeywords: Record<string, string[]> = {
      spring: ['floral', 'pastel', 'easter', 'wedding', 'graduation'],
      summer: ['beach', 'vacation', 'bright', 'lightweight', 'outdoor'],
      fall: ['autumn', 'warm', 'earthy', 'halloween', 'thanksgiving'],
      winter: ['holiday', 'festive', 'gift', 'snow', 'celebration']
    };

    return seasonalKeywords[season]?.some(sk => keyword.toLowerCase().includes(sk)) || false;
  }

  private async generateSeasonalInsights(season: string): Promise<TrendAnalysis[]> {
    try {
      const prompt = `
        Generate seasonal jewelry trends for ${season}.

        Consider:
        - Upcoming holidays and events in ${season}
        - Fashion trends for the season
        - Color palettes and materials popular in ${season}
        - Marketing opportunities for ${season}

        Provide 3-5 trend insights with keywords, sentiment analysis, and recommended actions.
      `;

      // In a real implementation, this would call an AI provider
      const aiResponse = await aiProviderEngine.selectProvider('content_generation', 300);

      // Simulate AI response
      const mockInsights = this.generateMockSeasonalInsights(season);

      return mockInsights.map(insight => ({
        id: `seasonal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        trendType: 'seasonal',
        keywords: insight.keywords,
        sentiment: insight.sentiment,
        urgency: insight.urgency,
        relevanceScore: 0.9,
        recommendedActions: this.generateTrendActions(insight, 'seasonal'),
        detectedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        confidence: 0.8,
        source: 'market_research'
      }));
    } catch (error) {
      console.error('Error generating seasonal insights:', error);
      return [];
    }
  }

  private generateMockSeasonalInsights(season: string): any[] {
    const seasonalInsights: Record<string, any[]> = {
      spring: [
        {
          keywords: ['spring cleaning', 'renewal', 'fresh start', 'pastel colors'],
          sentiment: 0.9,
          urgency: 0.8,
          category: 'seasonal_refresh'
        },
        {
          keywords: ['wedding season', 'bridal jewelry', 'engagement rings'],
          sentiment: 0.95,
          urgency: 0.9,
          category: 'bridal'
        }
      ],
      summer: [
        {
          keywords: ['beach jewelry', 'vacation accessories', 'waterproof'],
          sentiment: 0.85,
          urgency: 0.9,
          category: 'vacation'
        },
        {
          keywords: ['bright colors', 'lightweight', 'everyday wear'],
          sentiment: 0.8,
          urgency: 0.7,
          category: 'summer_fashion'
        }
      ],
      fall: [
        {
          keywords: ['autumn colors', 'warm metals', 'earthy tones'],
          sentiment: 0.8,
          urgency: 0.6,
          category: 'autumn_palette'
        },
        {
          keywords: ['holiday gifts', 'festive jewelry', 'celebration'],
          sentiment: 0.9,
          urgency: 0.8,
          category: 'holiday_prep'
        }
      ],
      winter: [
        {
          keywords: ['holiday gifts', 'festive collections', 'limited edition'],
          sentiment: 0.95,
          urgency: 0.9,
          category: 'holiday_season'
        },
        {
          keywords: ['new year', 'resolutions', 'fresh start'],
          sentiment: 0.8,
          urgency: 0.7,
          category: 'new_year'
        }
      ]
    };

    return seasonalInsights[season] || [];
  }

  async getTrendForecast(timeframe: 'week' | 'month' | 'quarter' = 'month'): Promise<TrendAnalysis[]> {
    try {
      const historicalTrends = this.getHistoricalTrends(timeframe);
      const currentTrends = await this.getCurrentTrends();

      // Use AI to predict future trends
      const forecast = await this.generateTrendForecast(historicalTrends, currentTrends, timeframe);

      return forecast;
    } catch (error) {
      console.error('Error getting trend forecast:', error);
      return [];
    }
  }

  private getHistoricalTrends(timeframe: string): TrendAnalysis[] {
    const cutoffDate = this.getCutoffDate(timeframe);
    const historicalTrends: TrendAnalysis[] = [];

    for (const [date, trends] of this.trendHistory.entries()) {
      if (new Date(date) >= cutoffDate) {
        historicalTrends.push(...trends);
      }
    }

    return historicalTrends;
  }

  private getCutoffDate(timeframe: string): Date {
    const now = new Date();
    switch (timeframe) {
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case 'quarter':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }

  private async generateTrendForecast(
    historicalTrends: TrendAnalysis[],
    currentTrends: TrendAnalysis[],
    timeframe: string
  ): Promise<TrendAnalysis[]> {
    try {
      // Analyze patterns in historical data
      const patterns = this.analyzeTrendPatterns(historicalTrends);

      // Generate forecast based on patterns and current trends
      const forecastTrends = this.generateForecastTrends(patterns, currentTrends, timeframe);

      return forecastTrends;
    } catch (error) {
      console.error('Error generating trend forecast:', error);
      return [];
    }
  }

  private analyzeTrendPatterns(historicalTrends: TrendAnalysis[]): any {
    const patterns = {
      keywordFrequency: new Map<string, number>(),
      sentimentTrends: new Map<string, number[]>(),
      urgencyTrends: new Map<string, number[]>(),
      seasonalPatterns: new Map<string, number[]>()
    };

    historicalTrends.forEach(trend => {
      // Analyze keyword frequency
      trend.keywords.forEach(keyword => {
        patterns.keywordFrequency.set(keyword, (patterns.keywordFrequency.get(keyword) || 0) + 1);
      });

      // Analyze sentiment trends
      if (!patterns.sentimentTrends.has(trend.trendType)) {
        patterns.sentimentTrends.set(trend.trendType, []);
      }
      patterns.sentimentTrends.get(trend.trendType)!.push(trend.sentiment);

      // Analyze urgency trends
      if (!patterns.urgencyTrends.has(trend.trendType)) {
        patterns.urgencyTrends.set(trend.trendType, []);
      }
      patterns.urgencyTrends.get(trend.trendType)!.push(trend.urgency);
    });

    return patterns;
  }

  private generateForecastTrends(
    patterns: any,
    currentTrends: TrendAnalysis[],
    timeframe: string
  ): TrendAnalysis[] {
    const forecastTrends: TrendAnalysis[] = [];

    // Identify emerging keywords
    const emergingKeywords = Array.from(patterns.keywordFrequency.entries())
      .filter(([, count]) => count > 2)
      .map(([keyword]) => keyword)
      .slice(0, 10);

    // Generate forecast trends based on emerging patterns
    emergingKeywords.forEach(keyword => {
      const forecastTrend: TrendAnalysis = {
        id: `forecast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        trendType: 'emerging',
        keywords: [keyword],
        sentiment: this.calculateForecastSentiment(keyword, patterns),
        urgency: this.calculateForecastUrgency(keyword, patterns),
        relevanceScore: 0.7,
        recommendedActions: [{
          type: 'create_content',
          priority: 'medium',
          description: `Prepare content for emerging trend: ${keyword}`,
          expectedImpact: 'Early adoption advantage',
          timeframe: '2-4 weeks',
          resources: ['Content team', 'Research team']
        }],
        detectedAt: new Date(),
        expiresAt: new Date(Date.now() + this.getForecastExpiry(timeframe)),
        confidence: 0.6,
        source: 'market_research'
      };

      forecastTrends.push(forecastTrend);
    });

    return forecastTrends;
  }

  private calculateForecastSentiment(keyword: string, patterns: any): number {
    // Simple sentiment calculation based on keyword
    const positiveKeywords = ['sustainable', 'eco-friendly', 'popular', 'trending', 'new'];
    const negativeKeywords = ['declining', 'outdated', 'unpopular'];

    if (positiveKeywords.some(pk => keyword.toLowerCase().includes(pk))) {
      return 0.8;
    }
    if (negativeKeywords.some(nk => keyword.toLowerCase().includes(nk))) {
      return 0.3;
    }

    return 0.6;
  }

  private calculateForecastUrgency(keyword: string, patterns: any): number {
    // Calculate urgency based on keyword frequency and trends
    const frequency = patterns.keywordFrequency.get(keyword) || 0;
    return Math.min(frequency / 5, 1.0);
  }

  private getForecastExpiry(timeframe: string): number {
    switch (timeframe) {
      case 'week':
        return 7 * 24 * 60 * 60 * 1000;
      case 'month':
        return 30 * 24 * 60 * 60 * 1000;
      case 'quarter':
        return 90 * 24 * 60 * 60 * 1000;
      default:
        return 30 * 24 * 60 * 60 * 1000;
    }
  }

  async analyzeContentPerformance(contentId: string): Promise<any> {
    try {
      // Analyze how content performs against current trends
      const currentTrends = await this.getCurrentTrends();
      const contentData = await this.getContentData(contentId);

      if (!contentData) {
        throw new Error('Content not found');
      }

      const performance = {
        trendAlignment: this.calculateTrendAlignment(contentData, currentTrends),
        trendOpportunities: this.identifyTrendOpportunities(contentData, currentTrends),
        recommendations: await this.generateContentRecommendations(contentData, currentTrends),
        competitivePosition: this.analyzeCompetitivePosition(contentData, currentTrends)
      };

      return performance;
    } catch (error) {
      console.error('Error analyzing content performance:', error);
      throw new Error('Failed to analyze content performance');
    }
  }

  private async getContentData(contentId: string): Promise<any> {
    try {
      const contentData = await database.all(
        'SELECT * FROM product_content WHERE id = ?',
        [contentId]
      );

      return contentData.length > 0 ? contentData[0] : null;
    } catch (error) {
      console.error('Error getting content data:', error);
      return null;
    }
  }

  private calculateTrendAlignment(contentData: any, trends: TrendAnalysis[]): number {
    let alignmentScore = 0;
    const contentKeywords = this.extractContentKeywords(contentData);

    trends.forEach(trend => {
      const matchingKeywords = trend.keywords.filter(keyword =>
        contentKeywords.some(ck => ck.toLowerCase().includes(keyword.toLowerCase()))
      );

      if (matchingKeywords.length > 0) {
        alignmentScore += trend.relevanceScore * (matchingKeywords.length / trend.keywords.length);
      }
    });

    return Math.min(alignmentScore / trends.length, 1.0);
  }

  private extractContentKeywords(contentData: any): string[] {
    const text = `${contentData.title} ${contentData.description} ${contentData.tags || ''}`;
    return text.toLowerCase().split(/\s+/).filter(word => word.length > 3);
  }

  private identifyTrendOpportunities(contentData: any, trends: TrendAnalysis[]): string[] {
    const contentKeywords = this.extractContentKeywords(contentData);
    const opportunities: string[] = [];

    trends.forEach(trend => {
      const missingKeywords = trend.keywords.filter(keyword =>
        !contentKeywords.some(ck => ck.toLowerCase().includes(keyword.toLowerCase()))
      );

      if (missingKeywords.length > 0 && trend.relevanceScore > 0.7) {
        opportunities.push(`Consider incorporating: ${missingKeywords.join(', ')}`);
      }
    });

    return opportunities;
  }

  private async generateContentRecommendations(contentData: any, trends: TrendAnalysis[]): Promise<string[]> {
    const recommendations: string[] = [];

    // Get AI-powered recommendations
    try {
      const prompt = `
        Analyze this content and suggest improvements based on current trends:

        Content: ${contentData.title}
        Description: ${contentData.description}
        Tags: ${contentData.tags || ''}

        Current trends: ${trends.slice(0, 3).map(t => t.keywords.join(', ')).join('; ')}

        Provide 3-5 specific recommendations to improve trend alignment.
      `;

      const aiResponse = await aiProviderEngine.selectProvider('content_generation', 200);

      // Simulate AI recommendations
      recommendations.push(
        'Update content to include trending keywords',
        'Adjust messaging to align with current sentiment',
        'Add seasonal relevance to content',
        'Incorporate competitor insights',
        'Optimize for emerging search trends'
      );
    } catch (error) {
      console.error('Error generating AI recommendations:', error);
    }

    return recommendations;
  }

  private analyzeCompetitivePosition(contentData: any, trends: TrendAnalysis[]): any {
    // Analyze how content compares to competitors based on trends
    const competitiveAdvantages = [];
    const competitiveGaps = [];

    trends.forEach(trend => {
      if (trend.source === 'competitor_analysis') {
        // Analyze competitive positioning
        if (this.calculateTrendAlignment(contentData, [trend]) > 0.6) {
          competitiveAdvantages.push(`Strong alignment with ${trend.keywords.join(', ')}`);
        } else {
          competitiveGaps.push(`Opportunity to improve: ${trend.keywords.join(', ')}`);
        }
      }
    });

    return {
      advantages: competitiveAdvantages,
      gaps: competitiveGaps,
      overallScore: competitiveAdvantages.length / (competitiveAdvantages.length + competitiveGaps.length)
    };
  }

  private startTrendMonitoring(): void {
    // Update trends every hour
    setInterval(() => {
      this.updateTrends();
    }, 3600000);

    // Clean up old cache entries every 6 hours
    setInterval(() => {
      this.cleanupTrendCache();
    }, 21600000);
  }

  private async updateTrends(): Promise<void> {
    try {
      // Clear cache to force fresh trend data
      this.trendCache.clear();

      // Fetch fresh trends for all categories
      await this.getCurrentTrends();

      console.log('Trends updated successfully');
    } catch (error) {
      console.error('Error updating trends:', error);
    }
  }

  private cleanupTrendCache(): void {
    const now = Date.now();
    const cacheExpiry = 6 * 60 * 60 * 1000; // 6 hours

    for (const [key, trends] of this.trendCache.entries()) {
      if (now - trends[0]?.detectedAt.getTime() > cacheExpiry) {
        this.trendCache.delete(key);
      }
    }
  }

  private async loadHistoricalTrends(): Promise<void> {
    try {
      // Load trend history from database
      const historyData = await database.all(
        'SELECT * FROM trend_history ORDER BY detected_at DESC LIMIT 1000'
      );

      historyData.forEach(row => {
        const date = new Date(row.detected_at).toDateString();
        const trend = JSON.parse(row.trend_data);

        if (!this.trendHistory.has(date)) {
          this.trendHistory.set(date, []);
        }

        this.trendHistory.get(date)!.push(trend);
      });
    } catch (error) {
      console.error('Error loading historical trends:', error);
    }
  }

  // Public API methods
  async addDataSource(source: TrendDataSource): Promise<void> {
    this.dataSources.set(source.name, source);
  }

  async getDataSources(): Promise<TrendDataSource[]> {
    return Array.from(this.dataSources.values());
  }

  async getTrendSummary(timeframe: 'day' | 'week' | 'month' = 'week'): Promise<any> {
    try {
      const trends = await this.getCurrentTrends();
      const seasonalTrends = await this.getSeasonalTrends();

      return {
        totalTrends: trends.length,
        highUrgencyTrends: trends.filter(t => t.urgency > 0.7).length,
        positiveSentiment: trends.filter(t => t.sentiment > 0.7).length,
        topCategories: this.getTopCategories(trends),
        seasonalTrends: seasonalTrends.length,
        averageConfidence: trends.reduce((sum, t) => sum + t.confidence, 0) / trends.length,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error getting trend summary:', error);
      throw new Error('Failed to get trend summary');
    }
  }

  private getTopCategories(trends: TrendAnalysis[]): string[] {
    const categoryCount = new Map<string, number>();

    trends.forEach(trend => {
      trend.keywords.forEach(keyword => {
        const category = this.categorizeKeyword(keyword);
        categoryCount.set(category, (categoryCount.get(category) || 0) + 1);
      });
    });

    return Array.from(categoryCount.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category]) => category);
  }

  private categorizeKeyword(keyword: string): string {
    const categoryMap: Record<string, string> = {
      'sustainable': 'sustainability',
      'eco-friendly': 'sustainability',
      'gold': 'materials',
      'silver': 'materials',
      'wedding': 'bridal',
      'engagement': 'bridal',
      'minimalist': 'design',
      'vintage': 'style',
      'personalized': 'customization'
    };

    for (const [key, category] of Object.entries(categoryMap)) {
      if (keyword.toLowerCase().includes(key)) {
        return category;
      }
    }

    return 'general';
  }

  async exportTrendData(format: 'json' | 'csv' = 'json', timeframe?: string): Promise<any> {
    try {
      const trends = await this.getCurrentTrends();

      if (format === 'json') {
        return {
          trends,
          summary: await this.getTrendSummary(),
          exportedAt: new Date()
        };
      } else {
        return this.convertTrendsToCSV(trends);
      }
    } catch (error) {
      console.error('Error exporting trend data:', error);
      throw new Error('Failed to export trend data');
    }
  }

  private convertTrendsToCSV(trends: TrendAnalysis[]): string {
    const headers = ['ID', 'Type', 'Keywords', 'Sentiment', 'Urgency', 'Relevance', 'Confidence', 'Source', 'Detected At'];
    const rows = trends.map(trend => [
      trend.id,
      trend.trendType,
      trend.keywords.join(';'),
      trend.sentiment.toString(),
      trend.urgency.toString(),
      trend.relevanceScore.toString(),
      trend.confidence.toString(),
      trend.source,
      trend.detectedAt.toISOString()
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}

export const trendAnalysis = new TrendAnalysisService();