import {
  ProviderSelection,
  ProviderAlternative,
  RateLimitState,
  CostOptimization,
  ProviderPerformance,
  ProviderSelectionResponse,
  SelectionReason,
  OptimizationStrategy,
  AiProviderConfig
} from '@jewelry-seo/shared/types/aiProvider';
import { aiHealthMonitor } from './aiHealthMonitor';

export class AIProviderEngine {
  private rateLimits: Map<string, RateLimitState> = new Map();
  private performanceMetrics: Map<string, ProviderPerformance> = new Map();
  private optimizationStrategy: OptimizationStrategy = 'balanced';
  private usageHistory: Array<{
    providerId: string;
    contentType: string;
    tokens: number;
    cost: number;
    success: boolean;
    timestamp: Date;
  }> = [];

  constructor() {
    this.initializeRateLimits();
    this.initializePerformanceMetrics();
  }

  private initializeRateLimits() {
    const providers = aiHealthMonitor.getAllProviderConfigs();

    providers.forEach(provider => {
      const rateLimit: RateLimitState = {
        providerId: provider.id,
        currentUsage: 0,
        limit: provider.rateLimit,
        resetTime: new Date(Date.now() + 60000), // 1 minute window
        windowStart: new Date(),
        requestsInWindow: 0,
        burstCapacity: Math.floor(provider.rateLimit * 0.2) // 20% burst capacity
      };
      this.rateLimits.set(provider.id, rateLimit);
    });
  }

  private initializePerformanceMetrics() {
    const providers = aiHealthMonitor.getAllProviderConfigs();

    providers.forEach(provider => {
      const performance: ProviderPerformance = {
        providerId: provider.id,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        averageCost: 0,
        uptime: 100,
        lastUpdated: new Date(),
        performanceScore: 100
      };
      this.performanceMetrics.set(provider.id, performance);
    });
  }

  public async selectProvider(
    contentType: string,
    estimatedTokens: number,
    requirements?: {
      priority?: 'cost' | 'speed' | 'quality';
      maxCost?: number;
      maxResponseTime?: number;
      requiredSpecialties?: string[];
    }
  ): Promise<ProviderSelectionResponse> {
    const requestId = this.generateRequestId();
    const availableProviders = this.getAvailableProviders();

    if (availableProviders.length === 0) {
      throw new Error('No AI providers available');
    }

    // Score each provider based on multiple criteria
    const providerScores = await this.scoreProviders(
      availableProviders,
      contentType,
      estimatedTokens,
      requirements
    );

    // Select the best provider
    const selectedProvider = this.selectBestProvider(providerScores);
    const alternatives = this.getAlternatives(providerScores, selectedProvider.providerId);

    // Update rate limits
    this.updateRateLimit(selectedProvider.providerId);

    const response: ProviderSelectionResponse = {
      requestId,
      selectedProvider: selectedProvider.providerId,
      confidence: selectedProvider.confidence,
      estimatedCost: selectedProvider.estimatedCost,
      estimatedTime: selectedProvider.estimatedTime,
      fallbackProviders: alternatives.map(alt => alt.provider),
      optimizationApplied: this.optimizationStrategy !== 'balanced',
      selectionCriteria: {
        cost: selectedProvider.scores.cost,
        performance: selectedProvider.scores.performance,
        reliability: selectedProvider.scores.reliability,
        specialization: selectedProvider.scores.specialization
      }
    };

    // Record selection for analytics
    this.recordProviderSelection({
      requestId,
      selectedProvider: selectedProvider.providerId,
      selectionReason: selectedProvider.reason,
      estimatedCost: selectedProvider.estimatedCost,
      estimatedTime: selectedProvider.estimatedTime,
      confidence: selectedProvider.confidence,
      alternatives,
      timestamp: new Date()
    });

    return response;
  }

  private async scoreProviders(
    providers: string[],
    contentType: string,
    estimatedTokens: number,
    requirements?: any
  ): Promise<Array<{
    providerId: string;
    scores: {
      cost: number;
      performance: number;
      reliability: number;
      specialization: number;
    };
    estimatedCost: number;
    estimatedTime: number;
    confidence: number;
    reason: SelectionReason;
  }>> {
    const scores = [];

    for (const providerId of providers) {
      const provider = aiHealthMonitor.getProviderConfig(providerId);
      const health = aiHealthMonitor.getProviderHealth(providerId);
      const performance = this.performanceMetrics.get(providerId);
      const rateLimit = this.rateLimits.get(providerId);

      if (!provider || !health || !performance || !rateLimit) continue;

      // Calculate individual scores
      const costScore = this.calculateCostScore(provider, estimatedTokens, requirements);
      const performanceScore = this.calculatePerformanceScore(health, performance);
      const reliabilityScore = this.calculateReliabilityScore(health, performance);
      const specializationScore = this.calculateSpecializationScore(provider, contentType);

      // Calculate overall score based on optimization strategy
      const overallScore = this.calculateOverallScore(
        { cost: costScore, performance: performanceScore, reliability: reliabilityScore, specialization: specializationScore },
        this.optimizationStrategy
      );

      scores.push({
        providerId,
        scores: {
          cost: costScore,
          performance: performanceScore,
          reliability: reliabilityScore,
          specialization: specializationScore
        },
        estimatedCost: this.estimateCost(provider, estimatedTokens),
        estimatedTime: this.estimateResponseTime(health, performance),
        confidence: overallScore,
        reason: this.determineSelectionReason(
          { cost: costScore, performance: performanceScore, reliability: reliabilityScore, specialization: specializationScore },
          this.optimizationStrategy
        )
      });
    }

    return scores.sort((a, b) => b.confidence - a.confidence);
  }

  private calculateCostScore(provider: AiProviderConfig, estimatedTokens: number, requirements?: any): number {
    const estimatedCost = this.estimateCost(provider, estimatedTokens);

    // Normalize cost score (lower cost = higher score)
    const maxCost = 0.01; // Assume $0.01 as reference max cost
    const costScore = Math.max(0, 100 - ((estimatedCost / maxCost) * 100));

    // Apply requirements
    if (requirements?.maxCost && estimatedCost > requirements.maxCost) {
      return 0; // Disqualify if over max cost
    }

    return Math.round(costScore);
  }

  private calculatePerformanceScore(health: any, performance: ProviderPerformance): number {
    const responseTimeScore = Math.max(0, 100 - (health.responseTime / 10)); // Lower response time = higher score
    const successRateScore = health.successRate;
    const uptimeScore = performance.uptime;

    return Math.round((responseTimeScore + successRateScore + uptimeScore) / 3);
  }

  private calculateReliabilityScore(health: any, performance: ProviderPerformance): number {
    const errorRateScore = Math.max(0, 100 - health.errorRate);
    const uptimeScore = performance.uptime;
    const failureScore = Math.max(0, 100 - (health.consecutiveFailures * 10));

    return Math.round((errorRateScore + uptimeScore + failureScore) / 3);
  }

  private calculateSpecializationScore(provider: AiProviderConfig, contentType: string): number {
    const specialtyMap: Record<string, string[]> = {
      'product_description': ['product_descriptions', 'content_generation'],
      'seo_title': ['seo_optimization', 'content_generation'],
      'seo_description': ['seo_optimization', 'content_generation'],
      'blog_post': ['long_form_content', 'creative_content'],
      'brand_content': ['brand_voice', 'creative_content'],
      'technical_content': ['technical_content', 'complex_reasoning'],
      'analysis': ['analysis', 'complex_reasoning']
    };

    const requiredSpecialties = specialtyMap[contentType] || ['content_generation'];
    const matchingSpecialties = provider.specialties.filter(specialty =>
      requiredSpecialties.includes(specialty)
    );

    return (matchingSpecialties.length / requiredSpecialties.length) * 100;
  }

  private calculateOverallScore(
    scores: { cost: number; performance: number; reliability: number; specialization: number },
    strategy: OptimizationStrategy
  ): number {
    const weights = {
      cost_first: { cost: 0.5, performance: 0.2, reliability: 0.2, specialization: 0.1 },
      performance_first: { cost: 0.1, performance: 0.5, reliability: 0.3, specialization: 0.1 },
      balanced: { cost: 0.25, performance: 0.25, reliability: 0.25, specialization: 0.25 },
      specialized: { cost: 0.2, performance: 0.2, reliability: 0.2, specialization: 0.4 }
    };

    const weight = weights[strategy];
    return Math.round(
      (scores.cost * weight.cost) +
      (scores.performance * weight.performance) +
      (scores.reliability * weight.reliability) +
      (scores.specialization * weight.specialization)
    );
  }

  private determineSelectionReason(
    scores: { cost: number; performance: number; reliability: number; specialization: number },
    strategy: OptimizationStrategy
  ): SelectionReason {
    const maxScore = Math.max(scores.cost, scores.performance, scores.reliability, scores.specialization);

    if (maxScore === scores.cost) return 'cost';
    if (maxScore === scores.performance) return 'performance';
    if (maxScore === scores.specialization) return 'specialization';
    if (scores.reliability < 50) return 'availability';
    return 'load_balance';
  }

  private selectBestProvider(providerScores: any[]): any {
    return providerScores[0]; // Already sorted by confidence
  }

  private getAlternatives(providerScores: any[], selectedProviderId: string): ProviderAlternative[] {
    return providerScores
      .filter(score => score.providerId !== selectedProviderId)
      .slice(0, 2) // Top 2 alternatives
      .map(score => ({
        provider: score.providerId,
        cost: score.estimatedCost,
        estimatedTime: score.estimatedTime,
        reliability: score.scores.reliability,
        suitability: score.confidence
      }));
  }

  private estimateCost(provider: AiProviderConfig, estimatedTokens: number): number {
    return provider.costPerToken * estimatedTokens;
  }

  private estimateResponseTime(health: any, performance: ProviderPerformance): number {
    return Math.max(health.responseTime, performance.averageResponseTime);
  }

  private updateRateLimit(providerId: string) {
    const rateLimit = this.rateLimits.get(providerId);
    if (!rateLimit) return;

    const now = new Date();

    // Reset window if expired
    if (now >= rateLimit.resetTime) {
      rateLimit.windowStart = now;
      rateLimit.resetTime = new Date(now.getTime() + 60000);
      rateLimit.requestsInWindow = 0;
      rateLimit.currentUsage = 0;
    }

    // Increment usage
    rateLimit.requestsInWindow++;
    rateLimit.currentUsage++;
  }

  private getAvailableProviders(): string[] {
    return aiHealthMonitor.getAvailableProviders().filter(providerId => {
      const rateLimit = this.rateLimits.get(providerId);
      return rateLimit && rateLimit.currentUsage < rateLimit.limit;
    });
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private recordProviderSelection(selection: ProviderSelection) {
    // Add to usage history
    this.usageHistory.push({
      providerId: selection.selectedProvider,
      contentType: 'unknown', // Would be passed in real implementation
      tokens: 100, // Would be actual token count
      cost: selection.estimatedCost,
      success: true, // Would be determined after actual request
      timestamp: new Date()
    });

    // Keep only last 1000 records
    if (this.usageHistory.length > 1000) {
      this.usageHistory = this.usageHistory.slice(-1000);
    }
  }

  public recordRequestResult(providerId: string, success: boolean, responseTime: number, actualCost: number) {
    // Update health monitor
    aiHealthMonitor.recordRequestResult(providerId, success, responseTime);

    // Update performance metrics
    const performance = this.performanceMetrics.get(providerId);
    if (performance) {
      performance.totalRequests++;
      if (success) {
        performance.successfulRequests++;
      } else {
        performance.failedRequests++;
      }

      // Update moving averages
      const alpha = 0.1; // Smoothing factor
      performance.averageResponseTime =
        (performance.averageResponseTime * (1 - alpha)) + (responseTime * alpha);
      performance.averageCost =
        (performance.averageCost * (1 - alpha)) + (actualCost * alpha);

      // Update uptime
      performance.uptime = (performance.successfulRequests / performance.totalRequests) * 100;
      performance.performanceScore = Math.round(
        (100 - (performance.averageResponseTime / 10)) * // Response time factor
        (performance.uptime / 100) * // Uptime factor
        (success ? 1 : 0.8) // Success factor
      );

      performance.lastUpdated = new Date();
    }

    // Update usage history
    const lastUsage = this.usageHistory[this.usageHistory.length - 1];
    if (lastUsage && lastUsage.providerId === providerId) {
      lastUsage.success = success;
      lastUsage.cost = actualCost;
    }
  }

  public getProviderPerformance(providerId: string): ProviderPerformance | undefined {
    return this.performanceMetrics.get(providerId);
  }

  public getAllProviderPerformance(): ProviderPerformance[] {
    return Array.from(this.performanceMetrics.values());
  }

  public getRateLimitStatus(providerId: string): RateLimitState | undefined {
    return this.rateLimits.get(providerId);
  }

  public getAllRateLimitStatus(): RateLimitState[] {
    return Array.from(this.rateLimits.values());
  }

  public getCostOptimization(): CostOptimization {
    const usageByProvider = new Map<string, { totalCost: number; totalTokens: number; requests: number }>();

    // Aggregate usage data
    this.usageHistory.forEach(usage => {
      const current = usageByProvider.get(usage.providerId) || { totalCost: 0, totalTokens: 0, requests: 0 };
      current.totalCost += usage.cost;
      current.totalTokens += usage.tokens;
      current.requests += 1;
      usageByProvider.set(usage.providerId, current);
    });

    // Calculate optimization opportunities
    const recommendations = [];
    let currentSavings = 0;
    let potentialSavings = 0;

    Array.from(usageByProvider.entries()).forEach(([providerId, usage]) => {
      const provider = aiHealthMonitor.getProviderConfig(providerId);
      if (!provider) return;

      const avgCostPerToken = usage.totalCost / usage.totalTokens;
      const providerEfficiency = 1 - (avgCostPerToken / provider.costPerToken);

      if (providerEfficiency < 0.8) { // Less than 80% efficient
        recommendations.push({
          provider: providerId,
          recommendedFor: ['general_content'],
          expectedSavings: usage.totalCost * 0.2, // 20% potential savings
          confidence: 0.7,
          reasoning: `Current efficiency is ${(providerEfficiency * 100).toFixed(1)}%, optimization could save 20%`
        });
        potentialSavings += usage.totalCost * 0.2;
      }
    });

    return {
      strategy: this.optimizationStrategy,
      currentSavings,
      potentialSavings,
      providerRecommendations: recommendations,
      usagePatterns: this.getUsagePatterns(),
      lastOptimized: new Date()
    };
  }

  private getUsagePatterns() {
    const patterns = new Map<string, {
      totalTokens: number;
      totalCost: number;
      requests: number;
      successes: number;
      providers: Set<string>;
    }>();

    this.usageHistory.forEach(usage => {
      const key = usage.contentType;
      const current = patterns.get(key) || {
        totalTokens: 0,
        totalCost: 0,
        requests: 0,
        successes: 0,
        providers: new Set()
      };

      current.totalTokens += usage.tokens;
      current.totalCost += usage.cost;
      current.requests += 1;
      if (usage.success) current.successes += 1;
      current.providers.add(usage.providerId);

      patterns.set(key, current);
    });

    return Array.from(patterns.entries()).map(([contentType, data]) => ({
      contentType,
      averageTokens: data.totalTokens / data.requests,
      preferredProviders: Array.from(data.providers),
      costEfficiency: 1 - (data.totalCost / (data.totalTokens * 0.00001)), // Compare to baseline
      successRate: (data.successes / data.requests) * 100
    }));
  }

  public setOptimizationStrategy(strategy: OptimizationStrategy) {
    this.optimizationStrategy = strategy;
  }

  public getOptimizationStrategy(): OptimizationStrategy {
    return this.optimizationStrategy;
  }

  public resetRateLimits() {
    this.rateLimits.clear();
    this.initializeRateLimits();
  }

  public getUsageAnalytics() {
    return {
      totalRequests: this.usageHistory.length,
      successfulRequests: this.usageHistory.filter(u => u.success).length,
      totalCost: this.usageHistory.reduce((sum, u) => sum + u.cost, 0),
      totalTokens: this.usageHistory.reduce((sum, u) => sum + u.tokens, 0),
      averageCostPerRequest: this.usageHistory.reduce((sum, u) => sum + u.cost, 0) / this.usageHistory.length,
      providerDistribution: this.getProviderDistribution(),
      dailyUsage: this.getDailyUsage()
    };
  }

  private getProviderDistribution() {
    const distribution = new Map<string, number>();
    this.usageHistory.forEach(usage => {
      distribution.set(usage.providerId, (distribution.get(usage.providerId) || 0) + 1);
    });
    return Object.fromEntries(distribution);
  }

  private getDailyUsage() {
    const dailyUsage = new Map<string, { cost: number; tokens: number; requests: number }>();

    this.usageHistory.forEach(usage => {
      const date = usage.timestamp.toISOString().split('T')[0];
      const current = dailyUsage.get(date) || { cost: 0, tokens: 0, requests: 0 };

      current.cost += usage.cost;
      current.tokens += usage.tokens;
      current.requests += 1;

      dailyUsage.set(date, current);
    });

    return Array.from(dailyUsage.entries()).map(([date, data]) => ({
      date,
      ...data
    }));
  }
}

// Export singleton instance
export const aiProviderEngine = new AIProviderEngine();