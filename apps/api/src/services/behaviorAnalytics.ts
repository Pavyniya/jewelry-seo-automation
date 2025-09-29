import {
  CustomerBehavior,
  ContentInteraction,
  ContentPreference,
  BehaviorAnalysisRequest,
  BehaviorAnalysisResponse,
  BehaviorInsight,
  PredictedAction,
  JourneyStage,
  CustomerSegment
} from '@jewelry-seo/shared/types/contentStrategy';
import { database } from '../utils/database';

export class BehaviorAnalytics {
  private interactionBuffer: Map<string, ContentInteraction[]> = new Map();
  private preferenceModels: Map<string, any> = new Map();
  private behaviorPatterns: Map<string, any> = new Map();
  private analyticsCache: Map<string, BehaviorAnalysisResponse> = new Map();

  constructor() {
    this.startAnalyticsProcessing();
    this.loadBehaviorPatterns();
  }

  async recordInteraction(interaction: ContentInteraction): Promise<void> {
    try {
      // Buffer interactions for batch processing
      const sessionId = interaction.sessionId;
      if (!this.interactionBuffer.has(sessionId)) {
        this.interactionBuffer.set(sessionId, []);
      }

      this.interactionBuffer.get(sessionId)!.push(interaction);

      // Process immediately if it's a high-value interaction
      if (this.isHighValueInteraction(interaction)) {
        await this.processInteraction(interaction);
      }

      // Update real-time analytics
      await this.updateRealTimeAnalytics(interaction);
    } catch (error) {
      console.error('Error recording interaction:', error);
    }
  }

  private isHighValueInteraction(interaction: ContentInteraction): boolean {
    return ['purchase', 'wishlist', 'click'].includes(interaction.type) ||
           (interaction.metadata?.highValue === true);
  }

  private async processInteraction(interaction: ContentInteraction): Promise<void> {
    try {
      // Update customer preferences
      await this.updatePreferences(interaction);

      // Update behavior patterns
      await this.updateBehaviorPatterns(interaction);

      // Predict next actions
      await this.predictNextActions(interaction);

      // Store in database
      await this.storeInteraction(interaction);
    } catch (error) {
      console.error('Error processing interaction:', error);
    }
  }

  private async updatePreferences(interaction: ContentInteraction): Promise<void> {
    const customerId = interaction.customerId;
    if (!customerId) return;

    try {
      // Get existing preferences
      const existingPrefs = await database.all(
        'SELECT * FROM content_preferences WHERE customer_id = ?',
        [customerId]
      );

      let preferences: ContentPreference[] = [];
      if (existingPrefs.length > 0) {
        preferences = JSON.parse(existingPrefs[0].preferences || '[]');
      }

      // Extract category and subcategory from interaction
      const categoryInfo = await this.extractCategoryInfo(interaction);
      if (categoryInfo) {
        // Update existing preference or create new one
        const existingPref = preferences.find(p => p.category === categoryInfo.category);
        if (existingPref) {
          existingPref.weight = Math.min(existingPref.weight + 0.1, 1.0);
          existingPref.confidence = Math.min(existingPref.confidence + 0.05, 1.0);
          existingPref.lastUpdated = new Date();
        } else {
          preferences.push({
            id: `pref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            category: categoryInfo.category,
            subcategory: categoryInfo.subcategory,
            weight: 0.5,
            confidence: 0.3,
            lastUpdated: new Date(),
            source: 'behavioral'
          });
        }

        // Save updated preferences
        await database.all(
          `INSERT OR REPLACE INTO content_preferences
           (customer_id, preferences, last_updated)
           VALUES (?, ?, ?)`,
          [customerId, JSON.stringify(preferences), new Date().toISOString()]
        );

        // Cache in memory
        this.preferenceModels.set(customerId, preferences);
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  }

  private async extractCategoryInfo(interaction: ContentInteraction): Promise<{ category: string; subcategory?: string } | null> {
    if (interaction.metadata?.category) {
      return {
        category: interaction.metadata.category,
        subcategory: interaction.metadata.subcategory
      };
    }

    if (interaction.productId) {
      // Try to get product category from database
      try {
        const productData = await database.all(
          'SELECT category FROM products WHERE id = ?',
          [interaction.productId]
        );
        if (productData.length > 0) {
          return { category: productData[0].category };
        }
      } catch (error) {
        console.error('Error getting product category:', error);
      }
    }

    return null;
  }

  private async updateBehaviorPatterns(interaction: ContentInteraction): Promise<void> {
    const customerId = interaction.customerId || interaction.sessionId;
    if (!customerId) return;

    try {
      // Get recent interactions for pattern analysis
      const recentInteractions = await this.getRecentInteractions(customerId, 50);

      // Analyze patterns
      const patterns = this.analyzePatterns(recentInteractions);

      // Store patterns
      this.behaviorPatterns.set(customerId, patterns);

      // Update pattern database
      await this.storeBehaviorPatterns(customerId, patterns);
    } catch (error) {
      console.error('Error updating behavior patterns:', error);
    }
  }

  private async getRecentInteractions(customerId: string, limit: number): Promise<ContentInteraction[]> {
    try {
      const interactionsData = await database.all(
        `SELECT * FROM content_interactions
         WHERE customer_id = ? OR session_id = ?
         ORDER BY timestamp DESC
         LIMIT ?`,
        [customerId, customerId, limit]
      );

      return interactionsData.map(row => ({
        id: row.id,
        type: row.type,
        productId: row.product_id,
        contentId: row.content_id,
        timestamp: new Date(row.timestamp),
        duration: row.duration,
        sessionId: row.session_id,
        customerId: row.customer_id,
        metadata: JSON.parse(row.metadata || '{}')
      }));
    } catch (error) {
      console.error('Error getting recent interactions:', error);
      return [];
    }
  }

  private analyzePatterns(interactions: ContentInteraction[]): any {
    const patterns = {
      timePatterns: this.analyzeTimePatterns(interactions),
      categoryPatterns: this.analyzeCategoryPatterns(interactions),
      pricePatterns: this.analyzePricePatterns(interactions),
      engagementPatterns: this.analyzeEngagementPatterns(interactions),
      conversionPatterns: this.analyzeConversionPatterns(interactions)
    };

    return patterns;
  }

  private analyzeTimePatterns(interactions: ContentInteraction[]): any {
    const hourlyActivity = new Array(24).fill(0);
    const dailyActivity = new Array(7).fill(0);

    interactions.forEach(interaction => {
      const date = new Date(interaction.timestamp);
      hourlyActivity[date.getHours()]++;
      dailyActivity[date.getDay()]++;
    });

    return {
      peakHours: this.findPeakHours(hourlyActivity),
      peakDays: this.findPeakDays(dailyActivity),
      timeOfDayPreference: this.getTimeOfDayPreference(hourlyActivity)
    };
  }

  private findPeakHours(hourlyActivity: number[]): number[] {
    const avg = hourlyActivity.reduce((sum, count) => sum + count, 0) / hourlyActivity.length;
    return hourlyActivity
      .map((count, hour) => ({ hour, count }))
      .filter(item => item.count > avg * 1.5)
      .map(item => item.hour);
  }

  private findPeakDays(dailyActivity: number[]): string[] {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const avg = dailyActivity.reduce((sum, count) => sum + count, 0) / dailyActivity.length;
    return dailyActivity
      .map((count, day) => ({ day: days[day], count }))
      .filter(item => item.count > avg * 1.5)
      .map(item => item.day);
  }

  private getTimeOfDayPreference(hourlyActivity: number[]): string {
    const morning = hourlyActivity.slice(6, 12).reduce((sum, count) => sum + count, 0);
    const afternoon = hourlyActivity.slice(12, 18).reduce((sum, count) => sum + count, 0);
    const evening = hourlyActivity.slice(18, 24).reduce((sum, count) => sum + count, 0);
    const night = hourlyActivity.slice(0, 6).reduce((sum, count) => sum + count, 0);

    const max = Math.max(morning, afternoon, evening, night);
    if (max === morning) return 'morning';
    if (max === afternoon) return 'afternoon';
    if (max === evening) return 'evening';
    return 'night';
  }

  private analyzeCategoryPatterns(interactions: ContentInteraction[]): any {
    const categoryCounts: Record<string, number> = {};
    const categorySequences: string[] = [];

    interactions.forEach(interaction => {
      const category = interaction.metadata?.category || 'unknown';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      categorySequences.push(category);
    });

    return {
      topCategories: Object.entries(categoryCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([category]) => category),
      categoryDiversity: Object.keys(categoryCounts).length,
      commonSequences: this.findCommonSequences(categorySequences)
    };
  }

  private findCommonSequences(sequences: string[]): string[] {
    const sequenceCounts: Record<string, number> = {};

    for (let i = 0; i < sequences.length - 2; i++) {
      const sequence = sequences.slice(i, i + 3).join(' -> ');
      sequenceCounts[sequence] = (sequenceCounts[sequence] || 0) + 1;
    }

    return Object.entries(sequenceCounts)
      .filter(([, count]) => count > 2)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([sequence]) => sequence);
  }

  private analyzePricePatterns(interactions: ContentInteraction[]): any {
    const pricePoints = interactions
      .filter(i => i.metadata?.price)
      .map(i => i.metadata.price);

    if (pricePoints.length === 0) {
      return { priceRange: null, preferredPriceRange: null };
    }

    const avgPrice = pricePoints.reduce((sum, price) => sum + price, 0) / pricePoints.length;
    const minPrice = Math.min(...pricePoints);
    const maxPrice = Math.max(...pricePoints);

    return {
      priceRange: { min: minPrice, max: maxPrice, average: avgPrice },
      preferredPriceRange: {
        min: avgPrice * 0.8,
        max: avgPrice * 1.2
      },
      priceSensitivity: this.calculatePriceSensitivity(pricePoints)
    };
  }

  private calculatePriceSensitivity(pricePoints: number[]): 'low' | 'medium' | 'high' {
    if (pricePoints.length < 2) return 'medium';

    const standardDeviation = Math.sqrt(
      pricePoints.reduce((sum, price) => {
        const mean = pricePoints.reduce((s, p) => s + p, 0) / pricePoints.length;
        return sum + Math.pow(price - mean, 2);
      }, 0) / pricePoints.length
    );

    const coefficientOfVariation = standardDeviation / (pricePoints.reduce((sum, price) => sum + price, 0) / pricePoints.length);

    if (coefficientOfVariation < 0.2) return 'low';
    if (coefficientOfVariation < 0.4) return 'medium';
    return 'high';
  }

  private analyzeEngagementPatterns(interactions: ContentInteraction[]): any {
    const durations = interactions
      .filter(i => i.duration)
      .map(i => i.duration!);

    const engagementTypes = interactions.reduce((acc, interaction) => {
      acc[interaction.type] = (acc[interaction.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      averageDuration: durations.length > 0 ? durations.reduce((sum, d) => sum + d, 0) / durations.length : 0,
      engagementTypes,
      engagementScore: this.calculateEngagementScore(interactions)
    };
  }

  private calculateEngagementScore(interactions: ContentInteraction[]): number {
    let score = 0;
    const weights = {
      view: 1,
      click: 2,
      wishlist: 3,
      compare: 2,
      search: 1,
      purchase: 5
    };

    interactions.forEach(interaction => {
      score += weights[interaction.type as keyof typeof weights] || 0;
    });

    return Math.min(score / interactions.length, 5);
  }

  private analyzeConversionPatterns(interactions: ContentInteraction[]): any {
    const purchaseInteractions = interactions.filter(i => i.type === 'purchase');
    const viewInteractions = interactions.filter(i => i.type === 'view');

    const conversionPath = this.getConversionPath(interactions);

    return {
      totalPurchases: purchaseInteractions.length,
      conversionRate: viewInteractions.length > 0 ? purchaseInteractions.length / viewInteractions.length : 0,
      averagePurchaseValue: this.calculateAveragePurchaseValue(purchaseInteractions),
      conversionPath,
      timeToPurchase: this.calculateTimeToPurchase(interactions)
    };
  }

  private getConversionPath(interactions: ContentInteraction[]): string[] {
    const path: string[] = [];
    const sortedInteractions = interactions.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    for (const interaction of sortedInteractions) {
      if (interaction.type === 'purchase') {
        break;
      }
      path.push(interaction.type);
    }

    return path;
  }

  private calculateAveragePurchaseValue(purchaseInteractions: ContentInteraction[]): number {
    const values = purchaseInteractions
      .filter(i => i.metadata?.value)
      .map(i => i.metadata.value);

    return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  }

  private calculateTimeToPurchase(interactions: ContentInteraction[]): number | null {
    const firstInteraction = interactions.find(i => i.type === 'view');
    const purchaseInteraction = interactions.find(i => i.type === 'purchase');

    if (!firstInteraction || !purchaseInteraction) return null;

    const firstTime = new Date(firstInteraction.timestamp).getTime();
    const purchaseTime = new Date(purchaseInteraction.timestamp).getTime();

    return (purchaseTime - firstTime) / (1000 * 60 * 60); // Return hours
  }

  private async storeBehaviorPatterns(customerId: string, patterns: any): Promise<void> {
    try {
      await database.all(
        `INSERT OR REPLACE INTO behavior_patterns
         (customer_id, patterns, last_updated)
         VALUES (?, ?, ?)`,
        [customerId, JSON.stringify(patterns), new Date().toISOString()]
      );
    } catch (error) {
      console.error('Error storing behavior patterns:', error);
    }
  }

  private async predictNextActions(interaction: ContentInteraction): Promise<void> {
    const customerId = interaction.customerId || interaction.sessionId;
    if (!customerId) return;

    try {
      const patterns = this.behaviorPatterns.get(customerId);
      if (!patterns) return;

      const predictions = this.generateActionPredictions(interaction, patterns);

      // Store predictions
      await this.storeActionPredictions(customerId, predictions);
    } catch (error) {
      console.error('Error predicting next actions:', error);
    }
  }

  private generateActionPredictions(interaction: ContentInteraction, patterns: any): PredictedAction[] {
    const predictions: PredictedAction[] = [];

    // Predict based on common sequences
    if (patterns.categoryPatterns?.commonSequences) {
      const currentCategory = interaction.metadata?.category;
      if (currentCategory) {
        const likelyNextCategories = this.predictNextCategories(
          currentCategory,
          patterns.categoryPatterns.commonSequences
        );

        likelyNextCategories.forEach(category => {
          predictions.push({
            action: `view_${category}_products`,
            probability: 0.7,
            timeframe: 'next_24h',
            triggers: [interaction.type]
          });
        });
      }
    }

    // Predict based on journey stage
    const currentStage = this.estimateJourneyStage(interaction);
    const nextActions = this.predictJourneyActions(currentStage);

    nextActions.forEach(action => {
      predictions.push({
        action,
        probability: 0.6,
        timeframe: 'next_48h',
        triggers: [currentStage]
      });
    });

    return predictions;
  }

  private predictNextCategories(currentCategory: string, sequences: string[]): string[] {
    const nextCategories: Record<string, number> = {};

    sequences.forEach(sequence => {
      const categories = sequence.split(' -> ');
      for (let i = 0; i < categories.length - 1; i++) {
        if (categories[i] === currentCategory) {
          nextCategories[categories[i + 1]] = (nextCategories[categories[i + 1]] || 0) + 1;
        }
      }
    });

    return Object.entries(nextCategories)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([category]) => category);
  }

  private estimateJourneyStage(interaction: ContentInteraction): JourneyStage {
    switch (interaction.type) {
      case 'view':
        return 'awareness';
      case 'click':
      case 'compare':
        return 'consideration';
      case 'wishlist':
        return 'decision';
      case 'purchase':
        return 'purchase';
      default:
        return 'awareness';
    }
  }

  private predictJourneyActions(stage: JourneyStage): string[] {
    const stageActions: Record<JourneyStage, string[]> = {
      awareness: ['view_products', 'search_products', 'browse_categories'],
      consideration: ['compare_products', 'view_details', 'read_reviews'],
      decision: ['add_to_cart', 'wishlist', 'check_shipping'],
      purchase: ['complete_purchase', 'apply_discount', 'choose_payment'],
      loyalty: ['write_review', 'refer_friend', 'join_loyalty']
    };

    return stageActions[stage] || [];
  }

  private async storeActionPredictions(customerId: string, predictions: PredictedAction[]): Promise<void> {
    try {
      await database.all(
        `INSERT OR REPLACE INTO action_predictions
         (customer_id, predictions, created_at)
         VALUES (?, ?, ?)`,
        [customerId, JSON.stringify(predictions), new Date().toISOString()]
      );
    } catch (error) {
      console.error('Error storing action predictions:', error);
    }
  }

  private async storeInteraction(interaction: ContentInteraction): Promise<void> {
    try {
      await database.all(
        `INSERT INTO content_interactions
         (id, type, product_id, content_id, timestamp, duration, session_id, customer_id, metadata)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          interaction.id,
          interaction.type,
          interaction.productId,
          interaction.contentId,
          interaction.timestamp.toISOString(),
          interaction.duration,
          interaction.sessionId,
          interaction.customerId,
          JSON.stringify(interaction.metadata)
        ]
      );
    } catch (error) {
      console.error('Error storing interaction:', error);
    }
  }

  async analyzeBehavior(request: BehaviorAnalysisRequest): Promise<BehaviorAnalysisResponse> {
    try {
      const cacheKey = `${request.customerId || 'anonymous'}_${request.timeRange.start.getTime()}_${request.timeRange.end.getTime()}`;

      // Check cache
      if (this.analyticsCache.has(cacheKey)) {
        return this.analyticsCache.get(cacheKey)!;
      }

      // Get behavior profile
      const behaviorProfile = await this.getCustomerBehavior(request);

      // Generate insights
      const insights = await this.generateInsights(behaviorProfile, request);

      // Get predictions
      const predictions = await this.getActionPredictions(behaviorProfile);

      const response: BehaviorAnalysisResponse = {
        behaviorProfile,
        insights,
        recommendations: await this.generateRecommendations(insights),
        predictedActions: predictions,
        confidence: this.calculateAnalysisConfidence(behaviorProfile)
      };

      // Cache result
      this.analyticsCache.set(cacheKey, response);

      return response;
    } catch (error) {
      console.error('Error analyzing behavior:', error);
      throw new Error('Failed to analyze behavior');
    }
  }

  private async getCustomerBehavior(request: BehaviorAnalysisRequest): Promise<CustomerBehavior> {
    const customerId = request.customerId;
    const sessionId = request.sessionId;

    if (customerId) {
      // Get existing customer behavior
      const existing = await database.all(
        'SELECT * FROM customer_behavior WHERE customer_id = ?',
        [customerId]
      );

      if (existing.length > 0) {
        return this.parseCustomerBehavior(existing[0]);
      }
    }

    // Create new behavior profile
    return this.createNewBehaviorProfile(customerId, sessionId, request);
  }

  private parseCustomerBehavior(data: any): CustomerBehavior {
    return {
      id: data.id,
      customerId: data.customer_id,
      sessionId: data.session_id,
      interactions: JSON.parse(data.interactions || '[]'),
      preferences: JSON.parse(data.preferences || '[]'),
      journeyStage: data.journey_stage,
      segmentation: JSON.parse(data.segmentation || '[]'),
      behaviorScore: data.behavior_score,
      lastUpdated: new Date(data.last_updated)
    };
  }

  private createNewBehaviorProfile(
    customerId: string | undefined,
    sessionId: string,
    request: BehaviorAnalysisRequest
  ): CustomerBehavior {
    return {
      id: `behavior_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      customerId,
      sessionId,
      interactions: [],
      preferences: [],
      journeyStage: 'awareness',
      segmentation: ['new_visitor'],
      behaviorScore: 0,
      lastUpdated: new Date()
    };
  }

  private async generateInsights(
    behavior: CustomerBehavior,
    request: BehaviorAnalysisRequest
  ): Promise<BehaviorInsight[]> {
    const insights: BehaviorInsight[] = [];

    // Get interactions in the specified time range
    const interactions = await this.getInteractionsInRange(
      request.customerId || request.sessionId,
      request.timeRange
    );

    // Generate preference insights
    const preferenceInsights = this.generatePreferenceInsights(behavior.preferences);
    insights.push(...preferenceInsights);

    // Generate engagement insights
    const engagementInsights = this.generateEngagementInsights(interactions);
    insights.push(...engagementInsights);

    // Generate journey insights
    const journeyInsights = this.generateJourneyInsights(behavior);
    insights.push(...journeyInsights);

    // Generate pattern insights
    if (request.customerId) {
      const patterns = this.behaviorPatterns.get(request.customerId);
      if (patterns) {
        const patternInsights = this.generatePatternInsights(patterns);
        insights.push(...patternInsights);
      }
    }

    return insights;
  }

  private generatePreferenceInsights(preferences: ContentPreference[]): BehaviorInsight[] {
    const insights: BehaviorInsight[] = [];

    if (preferences.length > 0) {
      const topPrefs = preferences
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 3);

      insights.push({
        type: 'preference',
        title: 'Top Product Preferences',
        description: `Customer shows strong preference for ${topPrefs.map(p => p.category).join(', ')}`,
        significance: 0.8,
        confidence: 0.9,
        actionItems: [
          'Prioritize similar products in recommendations',
          'Create personalized content for preferred categories',
          'Monitor preference changes over time'
        ]
      });
    }

    return insights;
  }

  private generateEngagementInsights(interactions: ContentInteraction[]): BehaviorInsight[] {
    const insights: BehaviorInsight[] = [];

    if (interactions.length > 0) {
      const engagementScore = this.calculateEngagementScore(interactions);
      const interactionTypes = interactions.reduce((acc, i) => {
        acc[i.type] = (acc[i.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      insights.push({
        type: 'pattern',
        title: 'Engagement Analysis',
        description: `Customer engagement score: ${engagementScore.toFixed(1)}/5. Most active: ${Object.entries(interactionTypes).sort(([, a], [, b]) => b - a)[0][0]}`,
        significance: 0.7,
        confidence: 0.8,
        actionItems: [
          'Optimize content for preferred interaction types',
          'Increase engagement through personalized experiences',
          'Monitor engagement trends over time'
        ]
      });
    }

    return insights;
  }

  private generateJourneyInsights(behavior: CustomerBehavior): BehaviorInsight[] {
    const insights: BehaviorInsight[] = [];

    insights.push({
      type: 'pattern',
      title: 'Customer Journey Stage',
      description: `Customer is currently in ${behavior.journeyStage} stage with behavior score ${behavior.behaviorScore.toFixed(2)}`,
      significance: 0.9,
      confidence: 0.8,
      actionItems: [
        `Provide content appropriate for ${behavior.journeyStage} stage`,
        'Guide customer to next journey stage',
        'Personalize experience based on journey progress'
      ]
    });

    return insights;
  }

  private generatePatternInsights(patterns: any): BehaviorInsight[] {
    const insights: BehaviorInsight[] = [];

    if (patterns.timePatterns) {
      insights.push({
        type: 'pattern',
        title: 'Time-Based Behavior Patterns',
        description: `Customer most active during ${patterns.timePatterns.timeOfDayPreference}, peak hours: ${patterns.timePatterns.peakHours.join(', ')}`,
        significance: 0.6,
        confidence: 0.7,
        actionItems: [
          'Schedule content delivery during peak hours',
          'Time promotional campaigns for optimal engagement',
          'Adjust customer service staffing based on activity patterns'
        ]
      });
    }

    if (patterns.categoryPatterns) {
      insights.push({
        type: 'trend',
        title: 'Category Preferences',
        description: `Top categories: ${patterns.categoryPatterns.topCategories.slice(0, 3).join(', ')}, diversity score: ${patterns.categoryPatterns.categoryDiversity}`,
        significance: 0.8,
        confidence: 0.8,
        actionItems: [
          'Expand recommendations in top categories',
          'Introduce variety if diversity score is low',
          'Create category-specific campaigns'
        ]
      });
    }

    return insights;
  }

  private async getInteractionsInRange(
    customerId: string,
    timeRange: { start: Date; end: Date }
  ): Promise<ContentInteraction[]> {
    try {
      const interactionsData = await database.all(
        `SELECT * FROM content_interactions
         WHERE (customer_id = ? OR session_id = ?)
         AND timestamp BETWEEN ? AND ?
         ORDER BY timestamp DESC`,
        [customerId, customerId, timeRange.start.toISOString(), timeRange.end.toISOString()]
      );

      return interactionsData.map(row => ({
        id: row.id,
        type: row.type,
        productId: row.product_id,
        contentId: row.content_id,
        timestamp: new Date(row.timestamp),
        duration: row.duration,
        sessionId: row.session_id,
        customerId: row.customer_id,
        metadata: JSON.parse(row.metadata || '{}')
      }));
    } catch (error) {
      console.error('Error getting interactions in range:', error);
      return [];
    }
  }

  private async getActionPredictions(behavior: CustomerBehavior): Promise<PredictedAction[]> {
    try {
      const predictionsData = await database.all(
        'SELECT predictions FROM action_predictions WHERE customer_id = ? ORDER BY created_at DESC LIMIT 1',
        [behavior.customerId]
      );

      if (predictionsData.length > 0) {
        return JSON.parse(predictionsData[0].predictions || '[]');
      }

      return [];
    } catch (error) {
      console.error('Error getting action predictions:', error);
      return [];
    }
  }

  private async generateRecommendations(insights: BehaviorInsight[]): Promise<string[]> {
    const recommendations: string[] = [];

    insights.forEach(insight => {
      recommendations.push(...insight.actionItems);
    });

    // Add strategic recommendations
    recommendations.push(
      'Implement A/B testing for personalization strategies',
      'Monitor customer behavior changes over time',
      'Update personalization rules based on performance data'
    );

    return recommendations;
  }

  private calculateAnalysisConfidence(behavior: CustomerBehavior): number {
    let confidence = 0.5;

    // Boost confidence based on data quality
    if (behavior.interactions.length > 10) confidence += 0.2;
    if (behavior.preferences.length > 3) confidence += 0.1;
    if (behavior.behaviorScore > 0.5) confidence += 0.1;

    // Boost confidence for returning customers
    if (behavior.segmentation.includes('returning_customer')) confidence += 0.1;

    return Math.min(confidence, 1.0);
  }

  private async updateRealTimeAnalytics(interaction: ContentInteraction): Promise<void> {
    // Update real-time metrics
    // This could be integrated with a real-time analytics service
    try {
      const metrics = {
        totalInteractions: 1,
        uniqueCustomers: interaction.customerId ? 1 : 0,
        interactionType: interaction.type,
        timestamp: new Date().toISOString()
      };

      // Store real-time metrics (could be sent to analytics service)
      await this.storeRealTimeMetrics(metrics);
    } catch (error) {
      console.error('Error updating real-time analytics:', error);
    }
  }

  private async storeRealTimeMetrics(metrics: any): Promise<void> {
    try {
      await database.all(
        `INSERT INTO realtime_analytics
         (timestamp, metrics)
         VALUES (?, ?)`,
        [new Date().toISOString(), JSON.stringify(metrics)]
      );
    } catch (error) {
      console.error('Error storing real-time metrics:', error);
    }
  }

  private startAnalyticsProcessing(): void {
    // Process buffered interactions every 30 seconds
    setInterval(() => {
      this.processBufferedInteractions();
    }, 30000);

    // Clean up old analytics cache every hour
    setInterval(() => {
      this.cleanupAnalyticsCache();
    }, 3600000);
  }

  private async processBufferedInteractions(): Promise<void> {
    try {
      for (const [sessionId, interactions] of this.interactionBuffer.entries()) {
        if (interactions.length > 0) {
          // Process batch of interactions
          await Promise.all(
            interactions.map(interaction => this.processInteraction(interaction))
          );

          // Clear buffer
          this.interactionBuffer.set(sessionId, []);
        }
      }
    } catch (error) {
      console.error('Error processing buffered interactions:', error);
    }
  }

  private cleanupAnalyticsCache(): void {
    const now = Date.now();
    const cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours

    for (const [key, value] of this.analyticsCache.entries()) {
      // Simple cache cleanup based on key timestamp
      if (now - parseInt(key.split('_')[1]) > cacheExpiry) {
        this.analyticsCache.delete(key);
      }
    }
  }

  private async loadBehaviorPatterns(): Promise<void> {
    try {
      const patternsData = await database.all('SELECT * FROM behavior_patterns');

      patternsData.forEach(row => {
        this.behaviorPatterns.set(row.customer_id, JSON.parse(row.patterns || '{}'));
      });
    } catch (error) {
      console.error('Error loading behavior patterns:', error);
    }
  }

  // Public API methods
  async getCustomerSegments(customerId: string): Promise<CustomerSegment[]> {
    const behavior = await this.getCustomerBehavior({
      customerId,
      sessionId: '',
      timeRange: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date()
      },
      includePurchaseHistory: true,
      includeDemographics: false
    });

    return behavior.segmentation;
  }

  async getRealtimeMetrics(timeRange: { start: Date; end: Date }): Promise<any> {
    try {
      const metricsData = await database.all(
        `SELECT * FROM realtime_analytics
         WHERE timestamp BETWEEN ? AND ?
         ORDER BY timestamp DESC`,
        [timeRange.start.toISOString(), timeRange.end.toISOString()]
      );

      return metricsData.map(row => ({
        timestamp: new Date(row.timestamp),
        metrics: JSON.parse(row.metrics || '{}')
      }));
    } catch (error) {
      console.error('Error getting real-time metrics:', error);
      return [];
    }
  }

  async exportBehaviorData(customerId: string, format: 'json' | 'csv' = 'json'): Promise<any> {
    const behavior = await this.getCustomerBehavior({
      customerId,
      sessionId: '',
      timeRange: {
        start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        end: new Date()
      },
      includePurchaseHistory: true,
      includeDemographics: true
    });

    if (format === 'json') {
      return behavior;
    } else {
      return this.convertToCSV(behavior);
    }
  }

  private convertToCSV(behavior: CustomerBehavior): string {
    const rows = [
      ['Metric', 'Value'],
      ['Customer ID', behavior.customerId || ''],
      ['Session ID', behavior.sessionId],
      ['Journey Stage', behavior.journeyStage],
      ['Behavior Score', behavior.behaviorScore.toString()],
      ['Total Interactions', behavior.interactions.length.toString()],
      ['Total Preferences', behavior.preferences.length.toString()],
      ['Segments', behavior.segmentation.join(', ')],
      ['Last Updated', behavior.lastUpdated.toISOString()]
    ];

    return rows.map(row => row.join(',')).join('\n');
  }
}

export const behaviorAnalytics = new BehaviorAnalytics();