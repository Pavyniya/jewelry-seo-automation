import {
  CustomerBehavior,
  ContentPersonalization,
  PersonalizedContentVariant,
  PersonalizationRule,
  PersonalizationStrategy,
  ContentStrategyResponse,
  PerformancePrediction,
  JourneyStage,
  CustomerSegment,
  BehaviorAnalysisRequest,
  BehaviorAnalysisResponse,
  BehaviorInsight,
  PredictedAction
} from '@jewelry-seo/shared/types/contentStrategy';
import { aiProviderEngine } from './aiProviderEngine';
import { database } from '../utils/database';

export class PersonalizationEngine {
  private personalizationRules: Map<string, PersonalizationRule> = new Map();
  private customerProfiles: Map<string, CustomerBehavior> = new Map();
  private contentCache: Map<string, PersonalizedContentVariant[]> = new Map();
  private performanceMetrics: Map<string, any> = new Map();

  constructor() {
    this.initializeDefaultRules();
    this.startPerformanceTracking();
  }

  private initializeDefaultRules(): void {
    const defaultRules: PersonalizationRule[] = [
      {
        id: 'price_sensitive_promotions',
        name: 'Price Sensitive Customer Promotions',
        condition: {
          field: 'segmentation',
          operator: 'contains',
          value: 'price_sensitive'
        },
        action: {
          type: 'modify_content',
          parameters: {
            emphasize: ['discount', 'sale', 'deal'],
            messaging: 'value_focused'
          }
        },
        priority: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'vip_exclusive_offers',
        name: 'VIP Exclusive Offers',
        condition: {
          field: 'segmentation',
          operator: 'contains',
          value: 'vip'
        },
        action: {
          type: 'modify_content',
          parameters: {
            emphasize: ['exclusive', 'premium', 'limited'],
            messaging: 'exclusive'
          }
        },
        priority: 2,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'quality_focused_features',
        name: 'Quality Focused Features',
        condition: {
          field: 'segmentation',
          operator: 'contains',
          value: 'quality_focused'
        },
        action: {
          type: 'modify_content',
          parameters: {
            emphasize: ['craftsmanship', 'materials', 'durability'],
            messaging: 'quality'
          }
        },
        priority: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'new_visitor_welcome',
        name: 'New Visitor Welcome',
        condition: {
          field: 'journeyStage',
          operator: 'equals',
          value: 'awareness'
        },
        action: {
          type: 'modify_content',
          parameters: {
            emphasize: ['welcome', 'discover', 'explore'],
            messaging: 'informational'
          }
        },
        priority: 3,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'returning_customer_loyalty',
        name: 'Returning Customer Loyalty',
        condition: {
          field: 'segmentation',
          operator: 'contains',
          value: 'returning_customer'
        },
        action: {
          type: 'modify_content',
          parameters: {
            emphasize: ['welcome_back', 'new_arrivals', 'exclusive'],
            messaging: 'personal'
          }
        },
        priority: 2,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    defaultRules.forEach(rule => {
      this.personalizationRules.set(rule.id, rule);
    });
  }

  async getPersonalizedContent(
    productId: string,
    customerId?: string,
    sessionId?: string
  ): Promise<ContentStrategyResponse> {
    try {
      // Get or create customer behavior profile
      const behaviorProfile = await this.getCustomerBehavior(customerId, sessionId);

      // Determine customer segment
      const segments = this.analyzeCustomerSegments(behaviorProfile);

      // Apply personalization rules
      const applicableRules = this.getApplicableRules(behaviorProfile);

      // Generate personalized content variants
      const contentVariants = await this.generatePersonalizedVariants(
        productId,
        behaviorProfile,
        applicableRules
      );

      // Select best variant
      const selectedVariant = this.selectBestVariant(contentVariants, behaviorProfile);

      // Generate performance prediction
      const performancePrediction = await this.predictPerformance(
        selectedVariant,
        behaviorProfile
      );

      // Generate recommendations
      const recommendations = await this.generateRecommendations(
        behaviorProfile,
        selectedVariant
      );

      const response: ContentStrategyResponse = {
        productId,
        customerId,
        segmentId: segments[0] || 'general',
        personalizedContent: {
          title: selectedVariant.title,
          description: selectedVariant.description,
          callToAction: selectedVariant.callToAction,
          imagery: selectedVariant.imagery,
          personalizationScore: selectedVariant.personalizationScore,
          confidence: selectedVariant.confidence
        },
        appliedStrategies: selectedVariant.appliedStrategies,
        expectedPerformance: performancePrediction,
        recommendations,
        alternatives: contentVariants.filter(v => v.id !== selectedVariant.id)
      };

      // Cache the result
      this.cachePersonalizationResult(customerId || sessionId, response);

      return response;
    } catch (error) {
      console.error('Error generating personalized content:', error);
      throw new Error('Failed to generate personalized content');
    }
  }

  private async getCustomerBehavior(
    customerId?: string,
    sessionId?: string
  ): Promise<CustomerBehavior> {
    const cacheKey = customerId || sessionId || 'anonymous';

    if (this.customerProfiles.has(cacheKey)) {
      return this.customerProfiles.get(cacheKey)!;
    }

    try {
      let behaviorProfile: CustomerBehavior;

      if (customerId) {
        // Load from database
        const stored = await database.all(
          'SELECT * FROM customer_behavior WHERE customer_id = ?',
          [customerId]
        );

        if (stored.length > 0) {
          behaviorProfile = this.parseDatabaseBehavior(stored[0]);
        } else {
          behaviorProfile = this.createDefaultBehavior(customerId, sessionId);
        }
      } else {
        behaviorProfile = this.createDefaultBehavior(customerId, sessionId);
      }

      this.customerProfiles.set(cacheKey, behaviorProfile);
      return behaviorProfile;
    } catch (error) {
      console.error('Error loading customer behavior:', error);
      return this.createDefaultBehavior(customerId, sessionId);
    }
  }

  private createDefaultBehavior(
    customerId?: string,
    sessionId?: string
  ): CustomerBehavior {
    return {
      id: `behavior_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      customerId,
      sessionId: sessionId || `session_${Date.now()}`,
      interactions: [],
      preferences: [],
      journeyStage: 'awareness',
      segmentation: ['new_visitor'],
      behaviorScore: 0,
      lastUpdated: new Date()
    };
  }

  private parseDatabaseBehavior(data: any): CustomerBehavior {
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

  private analyzeCustomerSegments(behavior: CustomerBehavior): CustomerSegment[] {
    const segments: CustomerSegment[] = [];

    // Analyze purchase history for VIP status
    if (behavior.purchaseHistory?.totalOrders > 10 ||
        behavior.purchaseHistory?.totalSpent > 1000) {
      segments.push('vip');
    }

    // Analyze behavior for price sensitivity
    const priceInteractions = behavior.interactions.filter(i =>
      i.metadata?.priceFilter || i.metadata?.sortby === 'price_asc'
    );
    if (priceInteractions.length > 3) {
      segments.push('price_sensitive');
    }

    // Analyze quality focus
    const qualityInteractions = behavior.interactions.filter(i =>
      i.metadata?.viewedMaterials || i.metadata?.viewedCraftsmanship
    );
    if (qualityInteractions.length > 2) {
      segments.push('quality_focused');
    }

    // Check for returning customer
    if (behavior.purchaseHistory?.totalOrders > 0) {
      segments.push('returning_customer');
    }

    // Add default segment if none identified
    if (segments.length === 0) {
      segments.push('new_visitor');
    }

    return segments;
  }

  private getApplicableRules(behavior: CustomerBehavior): PersonalizationRule[] {
    return Array.from(this.personalizationRules.values())
      .filter(rule => rule.isActive && this.evaluateCondition(rule.condition, behavior))
      .sort((a, b) => b.priority - a.priority);
  }

  private evaluateCondition(
    condition: any,
    behavior: CustomerBehavior
  ): boolean {
    const fieldValue = this.getFieldValue(condition.field, behavior);

    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'contains':
        return Array.isArray(fieldValue) && fieldValue.includes(condition.value);
      case 'greater_than':
        return fieldValue > condition.value;
      case 'less_than':
        return fieldValue < condition.value;
      case 'in':
        return condition.value.includes(fieldValue);
      case 'not_in':
        return !condition.value.includes(fieldValue);
      default:
        return false;
    }
  }

  private getFieldValue(field: string, behavior: CustomerBehavior): any {
    const fieldMap: Record<string, any> = {
      'segmentation': behavior.segmentation,
      'journeyStage': behavior.journeyStage,
      'behaviorScore': behavior.behaviorScore,
      'totalOrders': behavior.purchaseHistory?.totalOrders || 0,
      'totalSpent': behavior.purchaseHistory?.totalSpent || 0
    };

    return fieldMap[field];
  }

  private async generatePersonalizedVariants(
    productId: string,
    behavior: CustomerBehavior,
    rules: PersonalizationRule[]
  ): Promise<PersonalizedContentVariant[]> {
    try {
      // Get base product content
      const productData = await database.all(
        'SELECT * FROM products WHERE id = ?',
        [productId]
      );

      if (productData.length === 0) {
        throw new Error('Product not found');
      }

      const baseProduct = productData[0];
      const variants: PersonalizedContentVariant[] = [];

      // Generate variants using AI
      for (const rule of rules.slice(0, 3)) { // Limit to top 3 rules
        const variant = await this.generateVariantWithRule(
          baseProduct,
          rule,
          behavior
        );
        variants.push(variant);
      }

      // Add a default variant
      const defaultVariant = this.createDefaultVariant(baseProduct, behavior);
      variants.push(defaultVariant);

      return variants;
    } catch (error) {
      console.error('Error generating content variants:', error);
      throw new Error('Failed to generate content variants');
    }
  }

  private async generateVariantWithRule(
    product: any,
    rule: PersonalizationRule,
    behavior: CustomerBehavior
  ): Promise<PersonalizedContentVariant> {
    try {
      const prompt = this.buildPersonalizationPrompt(product, rule, behavior);

      const aiResponse = await aiProviderEngine.selectProvider('content_generation', 500);

      // In a real implementation, this would call the AI provider
      // For now, we'll simulate the response
      const simulatedContent = this.simulateAIPersonalization(product, rule);

      return {
        id: `variant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: simulatedContent.title,
        description: simulatedContent.description,
        callToAction: simulatedContent.callToAction,
        imagery: product.images ? JSON.parse(product.images) : [],
        personalizationScore: this.calculatePersonalizationScore(rule, behavior),
        confidence: 0.75 + Math.random() * 0.2,
        appliedStrategies: [{
          id: rule.id,
          name: rule.name,
          type: 'behavioral',
          description: `Applied rule: ${rule.name}`,
          effectiveness: 0.8,
          confidence: 0.7,
          applicableSegments: behavior.segmentation
        }],
        targetAudience: behavior.segmentation,
        contentType: 'product'
      };
    } catch (error) {
      console.error('Error generating variant with rule:', error);
      throw new Error('Failed to generate personalized variant');
    }
  }

  private buildPersonalizationPrompt(
    product: any,
    rule: PersonalizationRule,
    behavior: CustomerBehavior
  ): string {
    return `
      Product: ${product.title}
      Base Description: ${product.description}
      Price: $${product.price}

      Personalization Rule: ${rule.name}
      Rule Parameters: ${JSON.stringify(rule.action.parameters)}

      Customer Segment: ${behavior.segmentation.join(', ')}
      Journey Stage: ${behavior.journeyStage}

      Generate personalized content including:
      - Title
      - Description
      - Call to Action

      The content should appeal to ${behavior.segmentation.join(' and ')} customers
      and be appropriate for someone in the ${behavior.journeyStage} stage.
    `;
  }

  private simulateAIPersonalization(product: any, rule: PersonalizationRule) {
    const params = rule.action.parameters;
    const emphasizes = params.emphasize || [];
    const messaging = params.messaging || 'default';

    let title = product.title;
    let description = product.description;
    let callToAction = 'Shop Now';

    // Apply emphasis based on rule parameters
    if (emphasizes.includes('discount') || emphasizes.includes('sale')) {
      title = `Special Offer: ${title}`;
      description += ` Limited time discount available!`;
      callToAction = 'Get Discount Now';
    }

    if (emphasizes.includes('exclusive') || emphasizes.includes('premium')) {
      title = `Exclusive: ${title}`;
      description += ` Premium craftsmanship and exclusive design.`;
      callToAction = 'Explore Collection';
    }

    if (emphasizes.includes('quality') || emphasizes.includes('craftsmanship')) {
      title = `Premium ${title}`;
      description += ` Expertly crafted with attention to every detail.`;
      callToAction = 'Discover Quality';
    }

    return {
      title,
      description,
      callToAction
    };
  }

  private createDefaultVariant(
    product: any,
    behavior: CustomerBehavior
  ): PersonalizedContentVariant {
    return {
      id: `variant_default_${Date.now()}`,
      title: product.title,
      description: product.description,
      callToAction: 'Shop Now',
      imagery: product.images ? JSON.parse(product.images) : [],
      personalizationScore: 0.5,
      confidence: 0.5,
      appliedStrategies: [],
      targetAudience: behavior.segmentation,
      contentType: 'product'
    };
  }

  private calculatePersonalizationScore(
    rule: PersonalizationRule,
    behavior: CustomerBehavior
  ): number {
    let score = 0.5; // Base score

    // Boost score based on rule priority
    score += (rule.priority / 10) * 0.2;

    // Boost score based on customer behavior match
    if (behavior.segmentation.includes('vip') && rule.name.includes('VIP')) {
      score += 0.3;
    }

    if (behavior.segmentation.includes('price_sensitive') && rule.name.includes('Price')) {
      score += 0.2;
    }

    return Math.min(score, 1.0);
  }

  private selectBestVariant(
    variants: PersonalizedContentVariant[],
    behavior: CustomerBehavior
  ): PersonalizedContentVariant {
    return variants.reduce((best, current) => {
      const currentScore = this.calculateVariantScore(current, behavior);
      const bestScore = this.calculateVariantScore(best, behavior);
      return currentScore > bestScore ? current : best;
    });
  }

  private calculateVariantScore(
    variant: PersonalizedContentVariant,
    behavior: CustomerBehavior
  ): number {
    let score = variant.personalizationScore * variant.confidence;

    // Boost score for VIP customers with high personalization
    if (behavior.segmentation.includes('vip') && variant.personalizationScore > 0.7) {
      score += 0.2;
    }

    // Boost score based on journey stage appropriateness
    if (behavior.journeyStage === 'decision' && variant.callToAction.includes('Now')) {
      score += 0.1;
    }

    return score;
  }

  private async predictPerformance(
    variant: PersonalizedContentVariant,
    behavior: CustomerBehavior
  ): Promise<PerformancePrediction> {
    const baseCTR = 0.02; // 2% base CTR
    const baseConversionRate = 0.01; // 1% base conversion rate

    // Calculate adjustments based on personalization
    const personalizationBoost = variant.personalizationScore * 0.5;
    const segmentMultiplier = this.getSegmentMultiplier(behavior.segmentation);
    const journeyMultiplier = this.getJourneyMultiplier(behavior.journeyStage);

    const expectedCTR = baseCTR * (1 + personalizationBoost) * segmentMultiplier;
    const expectedConversionRate = baseConversionRate * (1 + personalizationBoost) * journeyMultiplier;

    return {
      expectedCTR,
      expectedConversionRate,
      expectedRevenue: expectedConversionRate * 100, // Assuming $100 average order value
      confidence: variant.confidence,
      factors: [
        {
          name: 'Personalization Quality',
          value: variant.personalizationScore,
          impact: 'positive',
          weight: 0.4
        },
        {
          name: 'Customer Segment Match',
          value: segmentMultiplier,
          impact: 'positive',
          weight: 0.3
        },
        {
          name: 'Journey Stage Alignment',
          value: journeyMultiplier,
          impact: 'positive',
          weight: 0.3
        }
      ],
      risks: [
        {
          type: 'Over-personalization',
          severity: 'low',
          likelihood: 0.1,
          mitigation: 'Monitor engagement metrics and adjust rules'
        },
        {
          type: 'Content Fatigue',
          severity: 'medium',
          likelihood: 0.2,
          mitigation: 'Rotate content variants and test performance'
        }
      ]
    };
  }

  private getSegmentMultiplier(segments: CustomerSegment[]): number {
    const multipliers: Record<CustomerSegment, number> = {
      vip: 1.5,
      returning_customer: 1.2,
      price_sensitive: 0.9,
      quality_focused: 1.3,
      new_visitor: 0.8,
      trend_conscious: 1.1,
      brand_loyal: 1.4
    };

    return segments.reduce((max, segment) => {
      return Math.max(max, multipliers[segment] || 1.0);
    }, 1.0);
  }

  private getJourneyMultiplier(stage: JourneyStage): number {
    const multipliers: Record<JourneyStage, number> = {
      awareness: 0.7,
      consideration: 1.0,
      decision: 1.3,
      purchase: 1.1,
      loyalty: 0.9
    };

    return multipliers[stage] || 1.0;
  }

  private async generateRecommendations(
    behavior: CustomerBehavior,
    variant: PersonalizedContentVariant
  ): Promise<string[]> {
    const recommendations: string[] = [];

    // Analyze behavior patterns
    if (behavior.behaviorScore > 0.7) {
      recommendations.push('Customer shows high engagement - consider premium offerings');
    }

    if (behavior.segmentation.includes('vip')) {
      recommendations.push('VIP customer detected - offer exclusive early access');
    }

    if (behavior.journeyStage === 'decision') {
      recommendations.push('Customer ready to purchase - add urgency tactics');
    }

    if (variant.personalizationScore < 0.6) {
      recommendations.push('Low personalization score - consider additional data collection');
    }

    return recommendations;
  }

  private cachePersonalizationResult(
    cacheKey: string,
    response: ContentStrategyResponse
  ): void {
    this.contentCache.set(cacheKey, [response.personalizedContent]);

    // Cache expires after 1 hour
    setTimeout(() => {
      this.contentCache.delete(cacheKey);
    }, 3600000);
  }

  private startPerformanceTracking(): void {
    setInterval(() => {
      this.updatePerformanceMetrics();
    }, 60000); // Update every minute
  }

  private updatePerformanceMetrics(): void {
    // Track key performance indicators
    const metrics = {
      totalPersonalizations: this.contentCache.size,
      averagePersonalizationScore: this.calculateAverageScore(),
      cacheHitRate: this.calculateCacheHitRate(),
      ruleEffectiveness: this.calculateRuleEffectiveness()
    };

    this.performanceMetrics.set('current', metrics);
  }

  private calculateAverageScore(): number {
    let totalScore = 0;
    let count = 0;

    for (const variants of this.contentCache.values()) {
      for (const variant of variants) {
        totalScore += variant.personalizationScore;
        count++;
      }
    }

    return count > 0 ? totalScore / count : 0;
  }

  private calculateCacheHitRate(): number {
    // This would be implemented with actual cache hit tracking
    return 0.85; // Simulated 85% cache hit rate
  }

  private calculateRuleEffectiveness(): Record<string, number> {
    const effectiveness: Record<string, number> = {};

    for (const [ruleId, rule] of this.personalizationRules) {
      effectiveness[ruleId] = 0.8 + Math.random() * 0.2; // Simulated effectiveness
    }

    return effectiveness;
  }

  // Public methods for API endpoints
  async addPersonalizationRule(rule: PersonalizationRule): Promise<void> {
    this.personalizationRules.set(rule.id, rule);
  }

  async updatePersonalizationRule(ruleId: string, updates: Partial<PersonalizationRule>): Promise<void> {
    const existing = this.personalizationRules.get(ruleId);
    if (existing) {
      this.personalizationRules.set(ruleId, { ...existing, ...updates, updatedAt: new Date() });
    }
  }

  async deletePersonalizationRule(ruleId: string): Promise<void> {
    this.personalizationRules.delete(ruleId);
  }

  async getPersonalizationRules(): Promise<PersonalizationRule[]> {
    return Array.from(this.personalizationRules.values());
  }

  async getCustomerProfile(customerId: string): Promise<CustomerBehavior | null> {
    return this.customerProfiles.get(customerId) || null;
  }

  async updateCustomerBehavior(
    customerId: string,
    interaction: any
  ): Promise<void> {
    const profile = await this.getCustomerBehavior(customerId);
    profile.interactions.push(interaction);
    profile.lastUpdated = new Date();

    // Update behavior score
    profile.behaviorScore = this.calculateBehaviorScore(profile);

    // Update journey stage
    profile.journeyStage = this.updateJourneyStage(profile);

    // Update segmentation
    profile.segmentation = this.analyzeCustomerSegments(profile);

    this.customerProfiles.set(customerId, profile);

    // Save to database
    await this.saveCustomerBehavior(profile);
  }

  private calculateBehaviorScore(behavior: CustomerBehavior): number {
    let score = 0;

    // Score based on interaction diversity
    const interactionTypes = new Set(behavior.interactions.map(i => i.type));
    score += interactionTypes.size * 0.1;

    // Score based on engagement frequency
    const recentInteractions = behavior.interactions.filter(
      i => new Date(i.timestamp).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
    );
    score += Math.min(recentInteractions.length * 0.05, 0.3);

    // Score based on purchase history
    if (behavior.purchaseHistory?.totalOrders > 0) {
      score += Math.min(behavior.purchaseHistory.totalOrders * 0.1, 0.4);
    }

    return Math.min(score, 1.0);
  }

  private updateJourneyStage(behavior: CustomerBehavior): JourneyStage {
    const hasPurchases = behavior.purchaseHistory?.totalOrders > 0;
    const hasRecentViews = behavior.interactions.filter(
      i => i.type === 'view' &&
      new Date(i.timestamp).getTime() > Date.now() - 24 * 60 * 60 * 1000
    ).length > 3;

    const hasCartActivity = behavior.interactions.some(
      i => i.type === 'click' && i.metadata?.action === 'add_to_cart'
    );

    if (hasPurchases) {
      return behavior.purchaseHistory!.totalOrders > 5 ? 'loyalty' : 'purchase';
    } else if (hasCartActivity) {
      return 'decision';
    } else if (hasRecentViews) {
      return 'consideration';
    } else {
      return 'awareness';
    }
  }

  private async saveCustomerBehavior(behavior: CustomerBehavior): Promise<void> {
    try {
      await database.all(
        `INSERT OR REPLACE INTO customer_behavior
         (id, customer_id, session_id, interactions, preferences, journey_stage,
          segmentation, behavior_score, last_updated)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          behavior.id,
          behavior.customerId,
          behavior.sessionId,
          JSON.stringify(behavior.interactions),
          JSON.stringify(behavior.preferences),
          behavior.journeyStage,
          JSON.stringify(behavior.segmentation),
          behavior.behaviorScore,
          behavior.lastUpdated.toISOString()
        ]
      );
    } catch (error) {
      console.error('Error saving customer behavior:', error);
    }
  }

  async getPerformanceMetrics(): Promise<any> {
    return Object.fromEntries(this.performanceMetrics);
  }

  async clearCache(): Promise<void> {
    this.contentCache.clear();
  }

  async warmCache(productIds: string[]): Promise<void> {
    for (const productId of productIds) {
      try {
        await this.getPersonalizedContent(productId);
      } catch (error) {
        console.error(`Error warming cache for product ${productId}:`, error);
      }
    }
  }
}

export const personalizationEngine = new PersonalizationEngine();