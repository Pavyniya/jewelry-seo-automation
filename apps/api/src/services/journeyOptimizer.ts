import {
  JourneyStage,
  JourneyStageContent,
  CustomerBehavior,
  ContentPersonalization,
  PerformancePrediction,
  CustomerSegment,
  StageStrategy,
  OptimizationGoal,
  PerformanceTarget,
  MessagingGuideline
} from '@jewelry-seo/shared/types/contentStrategy';
import { database } from '../utils/database';
import { personalizationEngine } from './personalizationEngine';
import { behaviorAnalytics } from './behaviorAnalytics';

export interface JourneyTransition {
  fromStage: JourneyStage;
  toStage: JourneyStage;
  probability: number;
  averageTime: number; // in hours
  triggers: string[];
  barriers: string[];
}

export interface JourneyPath {
  id: string;
  customerId?: string;
  sessionId: string;
  currentStage: JourneyStage;
  pathHistory: JourneyStage[];
  transitions: JourneyTransition[];
  score: number;
  progress: number;
  predictedNextStage: JourneyStage;
  estimatedTimeToNext: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface JourneyRecommendation {
  type: 'content' | 'messaging' | 'timing' | 'channel';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  expectedImpact: string;
  implementation: string;
  targetStage: JourneyStage;
  confidence: number;
}

export interface JourneyFunnel {
  stage: JourneyStage;
  customers: number;
  conversionRate: number;
  averageTime: number;
  dropoffRate: number;
  commonDropoffReasons: string[];
  recommendations: JourneyRecommendation[];
}

export class JourneyOptimizer {
  private journeyPaths: Map<string, JourneyPath> = new Map();
  private stageStrategies: Map<JourneyStage, JourneyStageContent> = new Map();
  private transitionProbabilities: Map<string, number> = new Map();
  private journeyFunnel: Map<string, JourneyFunnel> = new Map();
  private customerJourneys: Map<string, JourneyPath[]> = new Map();

  constructor() {
    this.initializeStageStrategies();
    this.loadTransitionData();
    this.startJourneyMonitoring();
  }

  private initializeStageStrategies(): void {
    const strategies: Record<JourneyStage, JourneyStageContent> = {
      awareness: {
        stage: 'awareness',
        contentStrategy: {
          contentFocus: ['brand_introduction', 'educational_content', 'inspiration'],
          messagingTone: 'informational',
          callToActionType: 'learn_more',
          personalizationLevel: 'low',
          optimizationGoals: [
            { metric: 'engagement_rate', target: 0.15, weight: 0.4 },
            { metric: 'time_on_page', target: 120, weight: 0.3 },
            { metric: 'social_shares', target: 0.05, weight: 0.3 }
          ]
        },
        messagingGuidelines: [
          {
            element: 'headline',
            requirements: ['Clear value proposition', 'Brand identity', 'Intriguing'],
            restrictions: ['No technical jargon', 'No pressure tactics'],
            examples: ['Discover Your Perfect Style', 'Journey into Elegance']
          },
          {
            element: 'description',
            requirements: ['Educational', 'Inspirational', 'Brand-focused'],
            restrictions: ['No product details', 'No pricing'],
            examples: ['Explore our curated collection of fine jewelry designed for the modern woman.']
          },
          {
            element: 'cta',
            requirements: ['Low commitment', 'Exploratory'],
            restrictions: ['No urgency', 'No pricing'],
            examples: ['Discover Collection', 'Explore Styles']
          }
        ],
        optimizationGoals: [
          { metric: 'engagement_rate', target: 0.15, weight: 0.4 },
          { metric: 'time_on_page', target: 120, weight: 0.3 },
          { metric: 'social_shares', target: 0.05, weight: 0.3 }
        ],
        performanceTarget: {
          conversionRate: 0.05,
          engagementRate: 0.15,
          averageSessionDuration: 120,
          bounceRate: 0.60,
          revenuePerVisitor: 0
        }
      },
      consideration: {
        stage: 'consideration',
        contentStrategy: {
          contentFocus: ['product_features', 'benefits', 'social_proof', 'comparisons'],
          messagingTone: 'persuasive',
          callToActionType: 'compare',
          personalizationLevel: 'medium',
          optimizationGoals: [
            { metric: 'product_views', target: 5, weight: 0.3 },
            { metric: 'comparison_clicks', target: 0.2, weight: 0.4 },
            { metric: 'detail_page_time', target: 180, weight: 0.3 }
          ]
        },
        messagingGuidelines: [
          {
            element: 'headline',
            requirements: ['Benefit-focused', 'Feature-highlight', 'Comparative'],
            restrictions: ['No brand focus only', 'No emotional manipulation'],
            examples: ['Compare Our Bestsellers', 'Find Your Perfect Match']
          },
          {
            element: 'description',
            requirements: ['Feature details', 'Benefit explanation', 'Social proof'],
            restrictions: ['No technical specifications', 'No pricing pressure'],
            examples: ['Compare our most popular pieces to find the perfect match for your style.']
          },
          {
            element: 'cta',
            requirements: ['Informational', 'Comparative'],
            restrictions: ['No commitment', 'No urgency'],
            examples: ['Compare Options', 'View Details']
          }
        ],
        optimizationGoals: [
          { metric: 'product_views', target: 5, weight: 0.3 },
          { metric: 'comparison_clicks', target: 0.2, weight: 0.4 },
          { metric: 'detail_page_time', target: 180, weight: 0.3 }
        ],
        performanceTarget: {
          conversionRate: 0.10,
          engagementRate: 0.25,
          averageSessionDuration: 180,
          bounceRate: 0.40,
          revenuePerVisitor: 2
        }
      },
      decision: {
        stage: 'decision',
        contentStrategy: {
          contentFocus: ['urgency', 'social_proof', 'scarcity', 'guarantees'],
          messagingTone: 'emotional',
          callToActionType: 'wishlist',
          personalizationLevel: 'high',
          optimizationGoals: [
            { metric: 'wishlist_adds', target: 0.15, weight: 0.4 },
            { metric: 'cart_adds', target: 0.08, weight: 0.4 },
            { metric: 'checkout_starts', target: 0.05, weight: 0.2 }
          ]
        },
        messagingGuidelines: [
          {
            element: 'headline',
            requirements: ['Urgency', 'Exclusivity', 'Emotional appeal'],
            restrictions: ['No false scarcity', 'No overpromising'],
            examples: ['Limited Time Offer', 'Exclusive Collection']
          },
          {
            element: 'description',
            requirements: ['Scarcity indicators', 'Social proof', 'Guarantees'],
            restrictions: ['No pressure tactics', 'No false claims'],
            examples: ['Join our VIP list for exclusive access to limited edition pieces.']
          },
          {
            element: 'cta',
            requirements: ['Action-oriented', 'Exclusive'],
            restrictions: ['No hidden commitments', 'No false urgency'],
            examples: ['Add to Wishlist', 'VIP Access']
          }
        ],
        optimizationGoals: [
          { metric: 'wishlist_adds', target: 0.15, weight: 0.4 },
          { metric: 'cart_adds', target: 0.08, weight: 0.4 },
          { metric: 'checkout_starts', target: 0.05, weight: 0.2 }
        ],
        performanceTarget: {
          conversionRate: 0.15,
          engagementRate: 0.35,
          averageSessionDuration: 240,
          bounceRate: 0.25,
          revenuePerVisitor: 8
        }
      },
      purchase: {
        stage: 'purchase',
        contentStrategy: {
          contentFocus: ['trust_signals', 'security', 'convenience', 'support'],
          messagingTone: 'persuasive',
          callToActionType: 'buy_now',
          personalizationLevel: 'high',
          optimizationGoals: [
            { metric: 'checkout_completion', target: 0.95, weight: 0.5 },
            { metric: 'average_order_value', target: 150, weight: 0.3 },
            { metric: 'payment_success', target: 0.98, weight: 0.2 }
          ]
        },
        messagingGuidelines: [
          {
            element: 'headline',
            requirements: ['Trust-building', 'Security-focused', 'Clear value'],
            restrictions: ['No distractions', 'No new information'],
            examples: ['Secure Checkout', 'Complete Your Purchase']
          },
          {
            element: 'description',
            requirements: ['Security assurances', 'Support information', 'Policies'],
            restrictions: ['No marketing messages', 'No upselling'],
            examples: ['Your purchase is protected by our 30-day return policy and secure checkout.']
          },
          {
            element: 'cta',
            requirements: ['Clear', 'Secure', 'Final'],
            restrictions: ['No alternatives', 'No distractions'],
            examples: ['Complete Purchase', 'Pay Securely']
          }
        ],
        optimizationGoals: [
          { metric: 'checkout_completion', target: 0.95, weight: 0.5 },
          { metric: 'average_order_value', target: 150, weight: 0.3 },
          { metric: 'payment_success', target: 0.98, weight: 0.2 }
        ],
        performanceTarget: {
          conversionRate: 0.95,
          engagementRate: 0.50,
          averageSessionDuration: 300,
          bounceRate: 0.05,
          revenuePerVisitor: 150
        }
      },
      loyalty: {
        stage: 'loyalty',
        contentStrategy: {
          contentFocus: ['exclusivity', 'rewards', 'community', 'personalized_offers'],
          messagingTone: 'personal',
          callToActionType: 'learn_more',
          personalizationLevel: 'high',
          optimizationGoals: [
            { metric: 'repeat_purchase_rate', target: 0.40, weight: 0.4 },
            { metric: 'referral_rate', target: 0.15, weight: 0.3 },
            { metric: 'customer_lifetime_value', target: 500, weight: 0.3 }
          ]
        },
        messagingGuidelines: [
          {
            element: 'headline',
            requirements: ['Exclusive', 'Personalized', 'Rewarding'],
            restrictions: ['No generic messages', 'No hard selling'],
            examples: ['Exclusive VIP Access', 'Your Personal Rewards']
          },
          {
            element: 'description',
            requirements: ['Personalized', 'Exclusive', 'Value-focused'],
            restrictions: ['No public offers', 'No generic content'],
            examples: ['As a valued customer, enjoy exclusive access to our new collection before anyone else.']
          },
          {
            element: 'cta',
            requirements: ['Exclusive', 'Personalized'],
            restrictions: ['No public offers', 'No urgency'],
            examples: ['Access VIP Collection', 'View Personal Offers']
          }
        ],
        optimizationGoals: [
          { metric: 'repeat_purchase_rate', target: 0.40, weight: 0.4 },
          { metric: 'referral_rate', target: 0.15, weight: 0.3 },
          { metric: 'customer_lifetime_value', target: 500, weight: 0.3 }
        ],
        performanceTarget: {
          conversionRate: 0.25,
          engagementRate: 0.60,
          averageSessionDuration: 200,
          bounceRate: 0.20,
          revenuePerVisitor: 50
        }
      }
    };

    Object.entries(strategies).forEach(([stage, strategy]) => {
      this.stageStrategies.set(stage as JourneyStage, strategy);
    });
  }

  async trackCustomerJourney(
    customerId?: string,
    sessionId: string,
    interaction: any
  ): Promise<JourneyPath> {
    try {
      // Get or create journey path
      let journeyPath = await this.getJourneyPath(customerId, sessionId);

      // Analyze current stage
      const currentStage = await this.analyzeCurrentStage(interaction, journeyPath);

      // Update journey if stage has changed
      if (currentStage !== journeyPath.currentStage) {
        journeyPath = await this.updateJourneyStage(journeyPath, currentStage, interaction);
      }

      // Update journey score and progress
      journeyPath.score = this.calculateJourneyScore(journeyPath);
      journeyPath.progress = this.calculateJourneyProgress(journeyPath);

      // Predict next stage
      journeyPath.predictedNextStage = this.predictNextStage(journeyPath);
      journeyPath.estimatedTimeToNext = this.estimateTimeToNextStage(journeyPath);

      // Save journey
      await this.saveJourneyPath(journeyPath);

      return journeyPath;
    } catch (error) {
      console.error('Error tracking customer journey:', error);
      throw new Error('Failed to track customer journey');
    }
  }

  private async getJourneyPath(customerId?: string, sessionId?: string): Promise<JourneyPath> {
    const key = customerId || sessionId;
    if (!key) {
      throw new Error('Either customerId or sessionId must be provided');
    }

    if (this.journeyPaths.has(key)) {
      return this.journeyPaths.get(key)!;
    }

    // Try to load from database
    const existingJourney = await this.loadJourneyPath(customerId, sessionId);
    if (existingJourney) {
      this.journeyPaths.set(key, existingJourney);
      return existingJourney;
    }

    // Create new journey path
    const newJourney: JourneyPath = {
      id: `journey_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      customerId,
      sessionId: sessionId!,
      currentStage: 'awareness',
      pathHistory: ['awareness'],
      transitions: [],
      score: 0,
      progress: 0,
      predictedNextStage: 'consideration',
      estimatedTimeToNext: 24, // 24 hours
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.journeyPaths.set(key, newJourney);
    return newJourney;
  }

  private async loadJourneyPath(customerId?: string, sessionId?: string): Promise<JourneyPath | null> {
    try {
      let journeyData;
      if (customerId) {
        journeyData = await database.all(
          'SELECT * FROM customer_journeys WHERE customer_id = ? ORDER BY created_at DESC LIMIT 1',
          [customerId]
        );
      } else if (sessionId) {
        journeyData = await database.all(
          'SELECT * FROM customer_journeys WHERE session_id = ? ORDER BY created_at DESC LIMIT 1',
          [sessionId]
        );
      }

      if (journeyData && journeyData.length > 0) {
        const data = journeyData[0];
        return {
          id: data.id,
          customerId: data.customer_id,
          sessionId: data.session_id,
          currentStage: data.current_stage,
          pathHistory: JSON.parse(data.path_history || '[]'),
          transitions: JSON.parse(data.transitions || '[]'),
          score: data.score,
          progress: data.progress,
          predictedNextStage: data.predicted_next_stage,
          estimatedTimeToNext: data.estimated_time_to_next,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at)
        };
      }

      return null;
    } catch (error) {
      console.error('Error loading journey path:', error);
      return null;
    }
  }

  private async analyzeCurrentStage(interaction: any, journeyPath: JourneyPath): Promise<JourneyStage> {
    // Analyze interaction to determine current stage
    const { type, metadata } = interaction;

    // Stage determination logic
    switch (type) {
      case 'view':
        if (metadata?.category === 'brand' || metadata?.category === 'landing') {
          return 'awareness';
        } else if (metadata?.productDetails || metadata?.comparison) {
          return 'consideration';
        } else if (metadata?.reviews || metadata?.socialProof) {
          return 'decision';
        }
        break;

      case 'click':
        if (metadata?.action === 'add_to_cart') {
          return 'decision';
        } else if (metadata?.action === 'checkout') {
          return 'purchase';
        } else if (metadata?.action === 'wishlist') {
          return 'decision';
        }
        break;

      case 'purchase':
        return 'purchase';

      case 'search':
        return 'awareness';

      case 'compare':
        return 'consideration';

      default:
        // If no clear indicators, use current stage with some progression logic
        return this.determineStageProgression(journeyPath);
    }

    return journeyPath.currentStage;
  }

  private determineStageProgression(journeyPath: JourneyPath): JourneyStage {
    const stages: JourneyStage[] = ['awareness', 'consideration', 'decision', 'purchase', 'loyalty'];
    const currentIndex = stages.indexOf(journeyPath.currentStage);

    // Progress to next stage based on journey progress
    if (journeyPath.progress > 0.8 && currentIndex < stages.length - 1) {
      return stages[currentIndex + 1];
    }

    return journeyPath.currentStage;
  }

  private async updateJourneyStage(
    journeyPath: JourneyPath,
    newStage: JourneyStage,
    interaction: any
  ): Promise<JourneyPath> {
    const oldStage = journeyPath.currentStage;
    const transitionTime = Date.now() - journeyPath.updatedAt.getTime();

    // Create transition record
    const transition: JourneyTransition = {
      fromStage: oldStage,
      toStage: newStage,
      probability: this.calculateTransitionProbability(oldStage, newStage),
      averageTime: transitionTime / (1000 * 60 * 60), // Convert to hours
      triggers: this.identifyTransitionTriggers(interaction),
      barriers: this.identifyTransitionBarriers(oldStage, newStage)
    };

    // Update journey path
    journeyPath.currentStage = newStage;
    journeyPath.pathHistory.push(newStage);
    journeyPath.transitions.push(transition);
    journeyPath.updatedAt = new Date();

    // Update transition probabilities
    this.updateTransitionProbabilities(oldStage, newStage, transition.probability);

    return journeyPath;
  }

  private calculateTransitionProbability(from: JourneyStage, to: JourneyStage): number {
    const transitionKey = `${from}_${to}`;
    const baseProbability = this.transitionProbabilities.get(transitionKey) || 0.5;

    // Adjust probability based on typical journey patterns
    const stages: JourneyStage[] = ['awareness', 'consideration', 'decision', 'purchase', 'loyalty'];
    const fromIndex = stages.indexOf(from);
    const toIndex = stages.indexOf(to);

    // Forward transitions are more likely
    if (toIndex > fromIndex && toIndex - fromIndex === 1) {
      return Math.min(baseProbability * 1.2, 0.9);
    }

    // Backward transitions are less likely
    if (toIndex < fromIndex) {
      return Math.max(baseProbability * 0.3, 0.1);
    }

    return baseProbability;
  }

  private identifyTransitionTriggers(interaction: any): string[] {
    const triggers: string[] = [];

    if (interaction.type === 'click') {
      triggers.push('user_action');
    }

    if (interaction.metadata?.highIntent) {
      triggers.push('high_intent_signal');
    }

    if (interaction.metadata?.timeOnPage > 180) {
      triggers.push('engagement');
    }

    if (interaction.metadata?.socialProof) {
      triggers.push('social_influence');
    }

    return triggers;
  }

  private identifyTransitionBarriers(from: JourneyStage, to: JourneyStage): string[] {
    const barriers: string[] = [];

    // Common barriers between stages
    if (from === 'consideration' && to === 'decision') {
      barriers.push('price_sensitivity', 'trust_issues', 'comparison_paralysis');
    }

    if (from === 'decision' && to === 'purchase') {
      barriers.push('checkout_friction', 'payment_concerns', 'shipping_costs');
    }

    if (to === 'loyalty') {
      barriers.push('satisfaction_issues', 'competitive_offers', 'engagement_drop');
    }

    return barriers;
  }

  private updateTransitionProbabilities(from: JourneyStage, to: JourneyStage, probability: number): void {
    const transitionKey = `${from}_${to}`;
    const currentProb = this.transitionProbabilities.get(transitionKey) || 0.5;

    // Update with exponential moving average
    const alpha = 0.1; // Learning rate
    const newProb = alpha * probability + (1 - alpha) * currentProb;

    this.transitionProbabilities.set(transitionKey, newProb);
  }

  private calculateJourneyScore(journeyPath: JourneyPath): number {
    let score = 0;

    // Base score from current stage
    const stageWeights: Record<JourneyStage, number> = {
      awareness: 0.2,
      consideration: 0.4,
      decision: 0.6,
      purchase: 0.8,
      loyalty: 1.0
    };

    score += stageWeights[journeyPath.currentStage];

    // Bonus for progress
    score += journeyPath.progress * 0.2;

    // Bonus for successful transitions
    const successfulTransitions = journeyPath.transitions.filter(t => t.probability > 0.7);
    score += successfulTransitions.length * 0.1;

    // Penalty for backward transitions
    const backwardTransitions = journeyPath.transitions.filter(t => {
      const stages: JourneyStage[] = ['awareness', 'consideration', 'decision', 'purchase', 'loyalty'];
      return stages.indexOf(t.toStage) < stages.indexOf(t.fromStage);
    });
    score -= backwardTransitions.length * 0.1;

    return Math.max(0, Math.min(score, 1));
  }

  private calculateJourneyProgress(journeyPath: JourneyPath): number {
    const stages: JourneyStage[] = ['awareness', 'consideration', 'decision', 'purchase', 'loyalty'];
    const currentStageIndex = stages.indexOf(journeyPath.currentStage);

    // Base progress from current stage
    let progress = currentStageIndex / (stages.length - 1);

    // Adjust for journey maturity
    if (journeyPath.pathHistory.length > 1) {
      const maturityBonus = Math.min(journeyPath.pathHistory.length * 0.05, 0.2);
      progress += maturityBonus;
    }

    // Consider transitions efficiency
    const avgTransitionProb = journeyPath.transitions.reduce((sum, t) => sum + t.probability, 0) / Math.max(journeyPath.transitions.length, 1);
    progress += (avgTransitionProb - 0.5) * 0.2;

    return Math.max(0, Math.min(progress, 1));
  }

  private predictNextStage(journeyPath: JourneyPath): JourneyStage {
    const stages: JourneyStage[] = ['awareness', 'consideration', 'decision', 'purchase', 'loyalty'];
    const currentIndex = stages.indexOf(journeyPath.currentStage);

    // If at the end, stay at current stage
    if (currentIndex >= stages.length - 1) {
      return journeyPath.currentStage;
    }

    // Calculate probabilities for next stages
    const nextStageProbabilities = stages.map((stage, index) => {
      if (index <= currentIndex) return { stage, probability: 0 };

      const transitionKey = `${journeyPath.currentStage}_${stage}`;
      const baseProbability = this.transitionProbabilities.get(transitionKey) || 0;

      // Adjust based on journey characteristics
      let adjustedProbability = baseProbability;

      // Boost progression for high-scoring journeys
      if (journeyPath.score > 0.7) {
        adjustedProbability *= 1.2;
      }

      // Boost direct progression
      if (index === currentIndex + 1) {
        adjustedProbability *= 1.5;
      }

      return { stage, probability: Math.min(adjustedProbability, 1) };
    });

    // Select stage with highest probability
    const bestNext = nextStageProbabilities.reduce((best, current) =>
      current.probability > best.probability ? current : best
    );

    return bestNext.stage;
  }

  private estimateTimeToNextStage(journeyPath: JourneyPath): number {
    // Use historical transition times
    const transitionKey = `${journeyPath.currentStage}_${journeyPath.predictedNextStage}`;
    const historicalTransitions = journeyPath.transitions.filter(t =>
      t.fromStage === journeyPath.currentStage && t.toStage === journeyPath.predictedNextStage
    );

    if (historicalTransitions.length > 0) {
      const avgTime = historicalTransitions.reduce((sum, t) => sum + t.averageTime, 0) / historicalTransitions.length;
      return avgTime;
    }

    // Fallback to default estimates
    const defaultTimes: Record<string, number> = {
      'awareness_consideration': 24,
      'consideration_decision': 48,
      'decision_purchase': 12,
      'purchase_loyalty': 168
    };

    return defaultTimes[transitionKey] || 24;
  }

  private async saveJourneyPath(journeyPath: JourneyPath): Promise<void> {
    try {
      await database.all(
        `INSERT OR REPLACE INTO customer_journeys
         (id, customer_id, session_id, current_stage, path_history, transitions,
          score, progress, predicted_next_stage, estimated_time_to_next,
          created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          journeyPath.id,
          journeyPath.customerId,
          journeyPath.sessionId,
          journeyPath.currentStage,
          JSON.stringify(journeyPath.pathHistory),
          JSON.stringify(journeyPath.transitions),
          journeyPath.score,
          journeyPath.progress,
          journeyPath.predictedNextStage,
          journeyPath.estimatedTimeToNext,
          journeyPath.createdAt.toISOString(),
          journeyPath.updatedAt.toISOString()
        ]
      );
    } catch (error) {
      console.error('Error saving journey path:', error);
    }
  }

  async getJourneyOptimization(customerId?: string, sessionId?: string): Promise<any> {
    try {
      const journeyPath = await this.getJourneyPath(customerId, sessionId);
      const stageStrategy = this.stageStrategies.get(journeyPath.currentStage);

      if (!stageStrategy) {
        throw new Error('No strategy found for current stage');
      }

      // Generate personalized recommendations
      const recommendations = await this.generateJourneyRecommendations(journeyPath, stageStrategy);

      // Get stage-specific content optimization
      const contentOptimization = await this.getStageContentOptimization(journeyPath, stageStrategy);

      // Calculate journey health metrics
      const healthMetrics = this.calculateJourneyHealth(journeyPath);

      return {
        journeyPath,
        stageStrategy,
        recommendations,
        contentOptimization,
        healthMetrics,
        nextSteps: this.generateNextSteps(journeyPath, recommendations)
      };
    } catch (error) {
      console.error('Error getting journey optimization:', error);
      throw new Error('Failed to get journey optimization');
    }
  }

  private async generateJourneyRecommendations(
    journeyPath: JourneyPath,
    stageStrategy: JourneyStageContent
  ): Promise<JourneyRecommendation[]> {
    const recommendations: JourneyRecommendation[] = [];

    // Analyze current performance against targets
    const currentPerformance = await this.getCurrentStagePerformance(journeyPath);
    const gaps = this.identifyPerformanceGaps(currentPerformance, stageStrategy.optimizationGoals);

    // Generate recommendations based on gaps
    gaps.forEach(gap => {
      recommendations.push({
        type: 'content',
        priority: this.calculatePriority(gap.severity),
        description: `Improve ${gap.metric} from ${gap.current} to ${gap.target}`,
        expectedImpact: gap.impact,
        implementation: gap.recommendation,
        targetStage: journeyPath.currentStage,
        confidence: gap.confidence
      });
    });

    // Add stage-specific recommendations
    const stageRecommendations = this.getStageSpecificRecommendations(journeyPath);
    recommendations.push(...stageRecommendations);

    // Add transition recommendations
    const transitionRecommendations = await this.getTransitionRecommendations(journeyPath);
    recommendations.push(...transitionRecommendations);

    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  private async getCurrentStagePerformance(journeyPath: JourneyPath): Promise<Record<string, number>> {
    try {
      // Get performance metrics for current stage
      const performanceData = await database.all(
        `SELECT metric_name, AVG(metric_value) as avg_value
         FROM journey_performance
         WHERE customer_id = ? OR session_id = ?
         AND journey_stage = ?
         AND timestamp > ?
         GROUP BY metric_name`,
        [
          journeyPath.customerId,
          journeyPath.sessionId,
          journeyPath.currentStage,
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // Last 7 days
        ]
      );

      return performanceData.reduce((acc, row) => {
        acc[row.metric_name] = row.avg_value;
        return acc;
      }, {} as Record<string, number>);
    } catch (error) {
      console.error('Error getting current stage performance:', error);
      return {};
    }
  }

  private identifyPerformanceGaps(
    currentPerformance: Record<string, number>,
    targets: OptimizationGoal[]
  ): Array<{
    metric: string;
    current: number;
    target: number;
    severity: number;
    impact: string;
    recommendation: string;
    confidence: number;
  }> {
    const gaps: any[] = [];

    targets.forEach(target => {
      const current = currentPerformance[target.metric] || 0;
      const gap = target.target - current;
      const severity = Math.abs(gap) / target.target;

      if (severity > 0.1) { // Only significant gaps
        gaps.push({
          metric: target.metric,
          current,
          target: target.target,
          severity,
          impact: `Expected ${target.weight * 100}% improvement in overall conversion`,
          recommendation: this.generateGapRecommendation(target.metric, gap),
          confidence: 0.7 + (1 - severity) * 0.3
        });
      }
    });

    return gaps;
  }

  private generateGapRecommendation(metric: string, gap: number): string {
    const recommendations: Record<string, string> = {
      'engagement_rate': 'Increase interactive elements and improve content relevance',
      'time_on_page': 'Add compelling visuals and engaging content sections',
      'conversion_rate': 'Optimize call-to-action placement and messaging',
      'click_through_rate': 'Improve thumbnail quality and description clarity',
      'checkout_completion': 'Streamline checkout process and reduce friction',
      'average_order_value': 'Implement strategic upselling and bundling'
    };

    return recommendations[metric] || 'Optimize content and user experience';
  }

  private calculatePriority(severity: number): 'low' | 'medium' | 'high' | 'critical' {
    if (severity > 0.5) return 'critical';
    if (severity > 0.3) return 'high';
    if (severity > 0.1) return 'medium';
    return 'low';
  }

  private getStageSpecificRecommendations(journeyPath: JourneyPath): JourneyRecommendation[] {
    const recommendations: JourneyRecommendation[] = [];

    switch (journeyPath.currentStage) {
      case 'awareness':
        recommendations.push({
          type: 'content',
          priority: 'medium',
          description: 'Increase educational content to build brand awareness',
          expectedImpact: 'Higher engagement and brand recognition',
          implementation: 'Create blog posts, videos, and social media content',
          targetStage: 'awareness',
          confidence: 0.8
        });
        break;

      case 'consideration':
        recommendations.push({
          type: 'content',
          priority: 'high',
          description: 'Add detailed product comparisons and customer reviews',
          expectedImpact: 'Increased trust and higher conversion to decision stage',
          implementation: 'Implement comparison tools and review system',
          targetStage: 'consideration',
          confidence: 0.9
        });
        break;

      case 'decision':
        recommendations.push({
          type: 'messaging',
          priority: 'high',
          description: 'Add scarcity indicators and social proof',
          expectedImpact: 'Higher conversion to purchase stage',
          implementation: 'Show stock levels and customer testimonials',
          targetStage: 'decision',
          confidence: 0.85
        });
        break;

      case 'purchase':
        recommendations.push({
          type: 'timing',
          priority: 'critical',
          description: 'Optimize checkout flow to reduce abandonment',
          expectedImpact: 'Higher completion rate and revenue',
          implementation: 'Simplify form fields and add progress indicators',
          targetStage: 'purchase',
          confidence: 0.95
        });
        break;

      case 'loyalty':
        recommendations.push({
          type: 'content',
          priority: 'medium',
          description: 'Implement personalized loyalty rewards and exclusive offers',
          expectedImpact: 'Higher repeat purchase rate and customer lifetime value',
          implementation: 'Create VIP program and personalized promotions',
          targetStage: 'loyalty',
          confidence: 0.8
        });
        break;
    }

    return recommendations;
  }

  private async getTransitionRecommendations(journeyPath: JourneyPath): Promise<JourneyRecommendation[]> {
    const recommendations: JourneyRecommendation[] = [];

    // Analyze transition barriers
    const recentBarriers = journeyPath.transitions
      .slice(-3)
      .flatMap(t => t.barriers);

    // Generate recommendations to address common barriers
    const barrierRecommendations: Record<string, JourneyRecommendation> = {
      'price_sensitivity': {
        type: 'messaging',
        priority: 'high',
        description: 'Address price sensitivity with value messaging',
        expectedImpact: 'Higher conversion to next stage',
        implementation: 'Emphasize quality, durability, and lifetime value',
        targetStage: journeyPath.currentStage,
        confidence: 0.8
      },
      'trust_issues': {
        type: 'content',
        priority: 'high',
        description: 'Build trust with social proof and guarantees',
        expectedImpact: 'Reduced hesitation and higher conversion',
        implementation: 'Add customer reviews, trust badges, and return policy',
        targetStage: journeyPath.currentStage,
        confidence: 0.9
      },
      'checkout_friction': {
        type: 'timing',
        priority: 'critical',
        description: 'Reduce checkout friction and improve user experience',
        expectedImpact: 'Higher purchase completion rate',
        implementation: 'Simplify forms, add guest checkout, multiple payment options',
        targetStage: journeyPath.currentStage,
        confidence: 0.95
      }
    };

    recentBarriers.forEach(barrier => {
      if (barrierRecommendations[barrier]) {
        recommendations.push(barrierRecommendations[barrier]);
      }
    });

    return recommendations;
  }

  private async getStageContentOptimization(
    journeyPath: JourneyPath,
    stageStrategy: JourneyStageContent
  ): Promise<any> {
    try {
      // Get customer behavior data
      const behaviorData = await behaviorAnalytics.getCustomerProfile(journeyPath.customerId || '');

      // Generate personalized content optimization
      const optimization = {
        messagingTone: stageStrategy.contentStrategy.messagingTone,
        callToAction: stageStrategy.contentStrategy.callToActionType,
        personalizationLevel: stageStrategy.contentStrategy.personalizationLevel,
        contentFocus: stageStrategy.contentStrategy.contentFocus,
        optimizationGoals: stageStrategy.optimizationGoals,
        recommendedContent: await this.generateRecommendedContent(journeyPath, stageStrategy),
        timingOptimization: await this.getTimingOptimization(journeyPath),
        channelOptimization: await this.getChannelOptimization(journeyPath, behaviorData)
      };

      return optimization;
    } catch (error) {
      console.error('Error getting stage content optimization:', error);
      return {};
    }
  }

  private async generateRecommendedContent(
    journeyPath: JourneyPath,
    stageStrategy: JourneyStageContent
  ): Promise<Array<{ type: string; title: string; description: string; priority: string }>> {
    const content: Array<{ type: string; title: string; description: string; priority: string }> = [];

    switch (journeyPath.currentStage) {
      case 'awareness':
        content.push(
          {
            type: 'blog',
            title: 'Jewelry Care Guide',
            description: 'Essential tips for maintaining your jewelry collection',
            priority: 'high'
          },
          {
            type: 'video',
            title: 'Behind the Scenes',
            description: 'See how our jewelry is crafted with precision',
            priority: 'medium'
          }
        );
        break;

      case 'consideration':
        content.push(
          {
            type: 'comparison',
            title: 'Metal Types Guide',
            description: 'Compare different metals and their properties',
            priority: 'high'
          },
          {
            type: 'review',
            title: 'Customer Stories',
            description: 'Real experiences from our valued customers',
            priority: 'medium'
          }
        );
        break;

      case 'decision':
        content.push(
          {
            type: 'testimonial',
            title: 'Why Customers Love Us',
            description: 'Authentic reviews and testimonials',
            priority: 'high'
          },
          {
            type: 'guarantee',
            title: 'Quality Promise',
            description: 'Our commitment to excellence and satisfaction',
            priority: 'medium'
          }
        );
        break;

      case 'purchase':
        content.push(
          {
            type: 'security',
            title: 'Secure Shopping',
            description: 'Learn about our secure checkout process',
            priority: 'high'
          },
          {
            type: 'shipping',
            title: 'Free Shipping Details',
            description: 'Fast and reliable shipping information',
            priority: 'medium'
          }
        );
        break;

      case 'loyalty':
        content.push(
          {
            type: 'exclusive',
            title: 'VIP Collection',
            description: 'Exclusive access to new collections',
            priority: 'high'
          },
          {
            type: 'reward',
            title: 'Loyalty Rewards',
            description: 'Earn points and exclusive benefits',
            priority: 'medium'
          }
        );
        break;
    }

    return content;
  }

  private async getTimingOptimization(journeyPath: JourneyPath): Promise<any> {
    // Analyze customer engagement patterns
    const engagementPatterns = await this.analyzeEngagementPatterns(journeyPath);

    return {
      bestTimeToSend: engagementPatterns.peakHours || [9, 10, 14, 15, 20, 21],
      bestDaysToSend: engagementPatterns.peakDays || ['Monday', 'Tuesday', 'Thursday'],
      frequency: this.getOptimalFrequency(journeyPath.currentStage),
      urgencyLevel: this.getUrgencyLevel(journeyPath.currentStage)
    };
  }

  private async analyzeEngagementPatterns(journeyPath: JourneyPath): Promise<any> {
    try {
      const patternsData = await database.all(
        `SELECT HOUR(timestamp) as hour, DAYOFWEEK(timestamp) as day,
                COUNT(*) as engagement_count
         FROM content_interactions
         WHERE (customer_id = ? OR session_id = ?)
         AND timestamp > ?
         GROUP BY HOUR(timestamp), DAYOFWEEK(timestamp)
         ORDER BY engagement_count DESC
         LIMIT 10`,
        [
          journeyPath.customerId,
          journeyPath.sessionId,
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // Last 30 days
        ]
      );

      const peakHours = [...new Set(patternsData.map(p => p.hour))];
      const peakDays = patternsData.map(p => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[p.day - 1];
      });

      return { peakHours, peakDays };
    } catch (error) {
      console.error('Error analyzing engagement patterns:', error);
      return { peakHours: [9, 14, 20], peakDays: ['Monday', 'Thursday'] };
    }
  }

  private getOptimalFrequency(stage: JourneyStage): string {
    const frequencyMap: Record<JourneyStage, string> = {
      awareness: '2-3 times per week',
      consideration: '3-4 times per week',
      decision: 'Daily',
      purchase: 'As needed',
      loyalty: 'Weekly'
    };

    return frequencyMap[stage] || 'Weekly';
  }

  private getUrgencyLevel(stage: JourneyStage): 'low' | 'medium' | 'high' {
    const urgencyMap: Record<JourneyStage, 'low' | 'medium' | 'high'> = {
      awareness: 'low',
      consideration: 'medium',
      decision: 'high',
      purchase: 'high',
      loyalty: 'low'
    };

    return urgencyMap[stage] || 'medium';
  }

  private async getChannelOptimization(
    journeyPath: JourneyPath,
    behaviorData: any
  ): Promise<any> {
    // Analyze customer channel preferences
    const channelPreferences = await this.analyzeChannelPreferences(journeyPath);

    return {
      preferredChannels: channelPreferences,
      channelMix: this.getChannelMix(journeyPath.currentStage),
      budgetAllocation: this.getBudgetAllocation(journeyPath.currentStage)
    };
  }

  private async analyzeChannelPreferences(journeyPath: JourneyPath): Promise<string[]> {
    try {
      const channelData = await database.all(
        `SELECT channel, COUNT(*) as interactions
         FROM channel_interactions
         WHERE (customer_id = ? OR session_id = ?)
         AND timestamp > ?
         GROUP BY channel
         ORDER BY interactions DESC`,
        [
          journeyPath.customerId,
          journeyPath.sessionId,
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        ]
      );

      return channelData.map(row => row.channel);
    } catch (error) {
      console.error('Error analyzing channel preferences:', error);
      return ['email', 'web', 'mobile'];
    }
  }

  private getChannelMix(stage: JourneyStage): Record<string, number> {
    const mixMap: Record<JourneyStage, Record<string, number>> = {
      awareness: { social: 40, email: 20, web: 30, mobile: 10 },
      consideration: { email: 30, web: 40, mobile: 20, social: 10 },
      decision: { email: 20, web: 50, mobile: 25, social: 5 },
      purchase: { web: 60, mobile: 30, email: 10 },
      loyalty: { email: 50, web: 20, mobile: 20, social: 10 }
    };

    return mixMap[stage] || { web: 50, email: 30, mobile: 20 };
  }

  private getBudgetAllocation(stage: JourneyStage): Record<string, number> {
    const budgetMap: Record<JourneyStage, Record<string, number>> = {
      awareness: { acquisition: 60, engagement: 30, retention: 10 },
      consideration: { acquisition: 40, engagement: 40, retention: 20 },
      decision: { acquisition: 30, engagement: 50, retention: 20 },
      purchase: { acquisition: 20, engagement: 30, retention: 50 },
      loyalty: { acquisition: 10, engagement: 30, retention: 60 }
    };

    return budgetMap[stage] || { acquisition: 33, engagement: 33, retention: 34 };
  }

  private calculateJourneyHealth(journeyPath: JourneyPath): any {
    return {
      overallScore: journeyPath.score,
      progressScore: journeyPath.progress,
      stageAlignment: this.calculateStageAlignment(journeyPath),
      momentum: this.calculateJourneyMomentum(journeyPath),
      riskFactors: this.identifyRiskFactors(journeyPath),
      opportunities: this.identifyOpportunities(journeyPath)
    };
  }

  private calculateStageAlignment(journeyPath: JourneyPath): number {
    // Calculate how well the customer is progressing through intended stages
    const stages: JourneyStage[] = ['awareness', 'consideration', 'decision', 'purchase', 'loyalty'];
    const currentStageIndex = stages.indexOf(journeyPath.currentStage);
    const expectedStageIndex = this.calculateExpectedStage(journeyPath);

    const alignment = 1 - Math.abs(currentStageIndex - expectedStageIndex) / stages.length;
    return Math.max(0, alignment);
  }

  private calculateExpectedStage(journeyPath: JourneyPath): number {
    const ageInDays = (Date.now() - journeyPath.createdAt.getTime()) / (1000 * 60 * 60 * 24);

    // Expected progression based on journey age
    if (ageInDays < 1) return 0; // awareness
    if (ageInDays < 7) return 1; // consideration
    if (ageInDays < 14) return 2; // decision
    if (ageInDays < 30) return 3; // purchase
    return 4; // loyalty
  }

  private calculateJourneyMomentum(journeyPath: JourneyPath): number {
    if (journeyPath.transitions.length < 2) return 0.5;

    const recentTransitions = journeyPath.transitions.slice(-3);
    const avgProbability = recentTransitions.reduce((sum, t) => sum + t.probability, 0) / recentTransitions.length;
    const avgTime = recentTransitions.reduce((sum, t) => sum + t.averageTime, 0) / recentTransitions.length;

    // Higher probability and shorter time = higher momentum
    return Math.min((avgProbability * 0.7 + (1 / Math.max(avgTime / 24, 1)) * 0.3), 1);
  }

  private identifyRiskFactors(journeyPath: JourneyPath): string[] {
    const risks: string[] = [];

    // Check for stagnation
    if (journeyPath.transitions.length === 0 && (Date.now() - journeyPath.createdAt.getTime()) > 7 * 24 * 60 * 60 * 1000) {
      risks.push('journey_stagnation');
    }

    // Check for backward movement
    const backwardTransitions = journeyPath.transitions.filter(t => {
      const stages: JourneyStage[] = ['awareness', 'consideration', 'decision', 'purchase', 'loyalty'];
      return stages.indexOf(t.toStage) < stages.indexOf(t.fromStage);
    });
    if (backwardTransitions.length > 1) {
      risks.push('regressive_movement');
    }

    // Check for low transition probabilities
    const lowProbTransitions = journeyPath.transitions.filter(t => t.probability < 0.3);
    if (lowProbTransitions.length > journeyPath.transitions.length * 0.5) {
      risks.push('low_transition_probability');
    }

    return risks;
  }

  private identifyOpportunities(journeyPath: JourneyPath): string[] {
    const opportunities: string[] = [];

    // Check for high engagement but low conversion
    if (journeyPath.score > 0.7 && journeyPath.currentStage === 'consideration') {
      opportunities.push('consideration_to_decision_boost');
    }

    // Check for purchase potential
    if (journeyPath.currentStage === 'decision' && journeyPath.score > 0.8) {
      opportunities.push('purchase_conversion_optimization');
    }

    // Check for loyalty potential
    if (journeyPath.currentStage === 'purchase' && journeyPath.score > 0.9) {
      opportunities.push('loyalty_program_enrollment');
    }

    return opportunities;
  }

  private generateNextSteps(journeyPath: JourneyPath, recommendations: JourneyRecommendation[]): string[] {
    const nextSteps: string[] = [];

    // Prioritize critical and high priority recommendations
    const priorityRecs = recommendations.filter(r => ['critical', 'high'].includes(r.priority));

    priorityRecs.forEach(rec => {
      nextSteps.push(rec.implementation);
    });

    // Add journey progression steps
    nextSteps.push(`Continue guiding customer to ${journeyPath.predictedNextStage} stage`);
    nextSteps.push(`Monitor journey health and adjust strategies as needed`);

    return nextSteps;
  }

  private async loadTransitionData(): Promise<void> {
    try {
      // Load historical transition probabilities
      const transitionData = await database.all(
        `SELECT from_stage, to_stage, AVG(probability) as avg_probability
         FROM journey_transitions
         GROUP BY from_stage, to_stage`
      );

      transitionData.forEach(row => {
        this.transitionProbabilities.set(`${row.from_stage}_${row.to_stage}`, row.avg_probability);
      });
    } catch (error) {
      console.error('Error loading transition data:', error);
    }
  }

  private startJourneyMonitoring(): void {
    // Clean up old journey paths periodically
    setInterval(() => {
      this.cleanupJourneyPaths();
    }, 24 * 60 * 60 * 1000); // Daily cleanup
  }

  private async cleanupJourneyPaths(): Promise<void> {
    try {
      const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 days

      // Remove old paths from memory
      for (const [key, journey] of this.journeyPaths.entries()) {
        if (journey.updatedAt < cutoffDate) {
          this.journeyPaths.delete(key);
        }
      }

      // Clean up database
      await database.all(
        'DELETE FROM customer_journeys WHERE updated_at < ?',
        [cutoffDate.toISOString()]
      );
    } catch (error) {
      console.error('Error cleaning up journey paths:', error);
    }
  }

  // Public API methods
  async getJourneyFunnel(timeRange: { start: Date; end: Date } = { start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), end: new Date() }): Promise<JourneyFunnel[]> {
    try {
      const funnelData = await database.all(
        `SELECT journey_stage, COUNT(*) as customers,
                AVG(score) as avg_score, AVG(progress) as avg_progress
         FROM customer_journeys
         WHERE created_at BETWEEN ? AND ?
         GROUP BY journey_stage
         ORDER BY journey_stage`,
        [timeRange.start.toISOString(), timeRange.end.toISOString()]
      );

      return Promise.all(funnelData.map(async data => ({
        stage: data.journey_stage,
        customers: data.customers,
        conversionRate: await this.calculateStageConversionRate(data.journey_stage, timeRange),
        averageTime: this.calculateAverageStageTime(data.journey_stage, timeRange),
        dropoffRate: this.calculateDropoffRate(data.journey_stage, timeRange),
        commonDropoffReasons: this.getCommonDropoffReasons(data.journey_stage),
        recommendations: this.getFunnelRecommendations(data.journey_stage)
      })));
    } catch (error) {
      console.error('Error getting journey funnel:', error);
      return [];
    }
  }

  private async calculateStageConversionRate(stage: JourneyStage, timeRange: { start: Date; end: Date }): Promise<number> {
    // Calculate conversion rate for this stage
    try {
      const conversionData = await database.all(
        `SELECT COUNT(*) as total,
                COUNT(CASE WHEN current_stage != ? THEN 1 END) as converted
         FROM customer_journeys
         WHERE created_at BETWEEN ? AND ?
         AND journey_stage = ?`,
        [stage, timeRange.start.toISOString(), timeRange.end.toISOString(), stage]
      );

      if (conversionData.length > 0 && conversionData[0].total > 0) {
        return conversionData[0].converted / conversionData[0].total;
      }
    } catch (error) {
      console.error('Error calculating conversion rate:', error);
    }

    return 0;
  }

  private async calculateAverageStageTime(stage: JourneyStage, timeRange: { start: Date; end: Date }): Promise<number> {
    // Calculate average time spent in this stage
    try {
      const timeData = await database.all(
        `SELECT AVG(julianday(updated_at) - julianday(created_at)) * 24 as avg_hours
         FROM customer_journeys
         WHERE created_at BETWEEN ? AND ?
         AND journey_stage = ?`,
        [timeRange.start.toISOString(), timeRange.end.toISOString(), stage]
      );

      return timeData[0]?.avg_hours || 24;
    } catch (error) {
      console.error('Error calculating average stage time:', error);
      return 24;
    }
  }

  private async calculateDropoffRate(stage: JourneyStage, timeRange: { start: Date; end: Date }): Promise<number> {
    // Calculate dropoff rate for this stage
    try {
      const dropoffData = await database.all(
        `SELECT COUNT(*) as total,
                COUNT(CASE WHEN updated_at < ? THEN 1 END) as dropped
         FROM customer_journeys
         WHERE created_at BETWEEN ? AND ?
         AND journey_stage = ?`,
        [new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), timeRange.start.toISOString(), timeRange.end.toISOString(), stage]
      );

      if (dropoffData.length > 0 && dropoffData[0].total > 0) {
        return dropoffData[0].dropped / dropoffData[0].total;
      }
    } catch (error) {
      console.error('Error calculating dropoff rate:', error);
    }

    return 0;
  }

  private getCommonDropoffReasons(stage: JourneyStage): string[] {
    // Get common dropoff reasons for this stage
    const reasons: Record<JourneyStage, string[]> = {
      awareness: ['insufficient_engagement', 'irrelevant_content', 'poor_user_experience'],
      consideration: ['information_overload', 'comparison_difficulties', 'trust_issues'],
      decision: ['price_concerns', 'checkout_friction', 'decision_paralysis'],
      purchase: ['payment_issues', 'shipping_concerns', 'technical_problems'],
      loyalty: ['satisfaction_issues', 'competitive_offers', 'engagement_drop']
    };

    return reasons[stage] || [];
  }

  private getFunnelRecommendations(stage: JourneyStage): JourneyRecommendation[] {
    // Get recommendations for improving this stage in the funnel
    const recommendations: Record<JourneyStage, JourneyRecommendation[]> = {
      awareness: [
        {
          type: 'content',
          priority: 'high',
          description: 'Improve brand awareness content',
          expectedImpact: 'Higher engagement and brand recognition',
          implementation: 'Create more engaging educational content',
          targetStage: 'awareness',
          confidence: 0.8
        }
      ],
      consideration: [
        {
          type: 'content',
          priority: 'high',
          description: 'Enhance product comparison tools',
          expectedImpact: 'Better decision making and higher conversion',
          implementation: 'Implement detailed comparison features',
          targetStage: 'consideration',
          confidence: 0.9
        }
      ],
      decision: [
        {
          type: 'messaging',
          priority: 'critical',
          description: 'Reduce decision friction',
          expectedImpact: 'Higher purchase conversion',
          implementation: 'Add social proof and simplify choices',
          targetStage: 'decision',
          confidence: 0.95
        }
      ],
      purchase: [
        {
          type: 'timing',
          priority: 'critical',
          description: 'Streamline checkout process',
          expectedImpact: 'Higher completion rate',
          implementation: 'Reduce form fields and improve UX',
          targetStage: 'purchase',
          confidence: 0.9
        }
      ],
      loyalty: [
        {
          type: 'content',
          priority: 'medium',
          description: 'Enhance loyalty program engagement',
          expectedImpact: 'Higher repeat purchase rate',
          implementation: 'Personalize rewards and communications',
          targetStage: 'loyalty',
          confidence: 0.8
        }
      ]
    };

    return recommendations[stage] || [];
  }

  async getJourneyInsights(customerId?: string): Promise<any> {
    try {
      if (!customerId) {
        throw new Error('Customer ID is required for journey insights');
      }

      // Get customer's journey history
      const journeyHistory = await this.getCustomerJourneyHistory(customerId);

      // Analyze patterns and generate insights
      const insights = {
        journeyPatterns: this.analyzeJourneyPatterns(journeyHistory),
        preferredStages: this.identifyPreferredStages(journeyHistory),
        commonBarriers: this.identifyCommonBarriers(journeyHistory),
        optimalTiming: this.analyzeOptimalTiming(journeyHistory),
        contentPreferences: this.analyzeContentPreferences(journeyHistory),
        predictedBehavior: this.predictFutureBehavior(journeyHistory)
      };

      return insights;
    } catch (error) {
      console.error('Error getting journey insights:', error);
      throw new Error('Failed to get journey insights');
    }
  }

  private async getCustomerJourneyHistory(customerId: string): Promise<JourneyPath[]> {
    try {
      const journeyData = await database.all(
        'SELECT * FROM customer_journeys WHERE customer_id = ? ORDER BY created_at DESC LIMIT 50',
        [customerId]
      );

      return journeyData.map(data => ({
        id: data.id,
        customerId: data.customer_id,
        sessionId: data.session_id,
        currentStage: data.current_stage,
        pathHistory: JSON.parse(data.path_history || '[]'),
        transitions: JSON.parse(data.transitions || '[]'),
        score: data.score,
        progress: data.progress,
        predictedNextStage: data.predicted_next_stage,
        estimatedTimeToNext: data.estimated_time_to_next,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      }));
    } catch (error) {
      console.error('Error getting customer journey history:', error);
      return [];
    }
  }

  private analyzeJourneyPatterns(journeyHistory: JourneyPath[]): any {
    // Analyze patterns in customer's journey history
    const stageTransitions = new Map<string, number>();
    const commonPaths = new Map<string, number>();

    journeyHistory.forEach(journey => {
      // Count stage transitions
      for (let i = 0; i < journey.pathHistory.length - 1; i++) {
        const transition = `${journey.pathHistory[i]}_${journey.pathHistory[i + 1]}`;
        stageTransitions.set(transition, (stageTransitions.get(transition) || 0) + 1);
      }

      // Count common paths
      const path = journey.pathHistory.join('->');
      commonPaths.set(path, (commonPaths.get(path) || 0) + 1);
    });

    return {
      mostCommonTransitions: Array.from(stageTransitions.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([transition, count]) => ({ transition, count })),
      mostCommonPaths: Array.from(commonPaths.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([path, count]) => ({ path, count }))
    };
  }

  private identifyPreferredStages(journeyHistory: JourneyPath[]): JourneyStage[] {
    const stageCounts = new Map<JourneyStage, number>();

    journeyHistory.forEach(journey => {
      journey.pathHistory.forEach(stage => {
        stageCounts.set(stage, (stageCounts.get(stage) || 0) + 1);
      });
    });

    return Array.from(stageCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([stage]) => stage);
  }

  private identifyCommonBarriers(journeyHistory: JourneyPath[]): string[] {
    const barrierCounts = new Map<string, number>();

    journeyHistory.forEach(journey => {
      journey.transitions.forEach(transition => {
        transition.barriers.forEach(barrier => {
          barrierCounts.set(barrier, (barrierCounts.get(barrier) || 0) + 1);
        });
      });
    });

    return Array.from(barrierCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([barrier]) => barrier);
  }

  private analyzeOptimalTiming(journeyHistory: JourneyPath[]): any {
    // Analyze when customer is most responsive
    const hourActivity = new Array(24).fill(0);
    const dayActivity = new Array(7).fill(0);

    journeyHistory.forEach(journey => {
      journey.transitions.forEach(transition => {
        const hour = new Date(transition.averageTime * 60 * 60 * 1000).getHours();
        const day = new Date().getDay(); // This would need actual date data

        hourActivity[hour]++;
        dayActivity[day]++;
      });
    });

    return {
      peakHours: this.findPeakHours(hourActivity),
      peakDays: this.findPeakDays(dayActivity),
      optimalContactTimes: this.generateOptimalContactTimes(hourActivity, dayActivity)
    };
  }

  private findPeakHours(hourActivity: number[]): number[] {
    const avg = hourActivity.reduce((sum, count) => sum + count, 0) / hourActivity.length;
    return hourActivity
      .map((count, hour) => ({ hour, count }))
      .filter(item => item.count > avg * 1.5)
      .map(item => item.hour);
  }

  private findPeakDays(dayActivity: number[]): string[] {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const avg = dayActivity.reduce((sum, count) => sum + count, 0) / dayActivity.length;

    return dayActivity
      .map((count, day) => ({ day: days[day], count }))
      .filter(item => item.count > avg * 1.5)
      .map(item => item.day);
  }

  private generateOptimalContactTimes(hourActivity: number[], dayActivity: number[]): string[] {
    const optimalTimes: string[] = [];

    this.findPeakHours(hourActivity).forEach(hour => {
      this.findPeakDays(dayActivity).forEach(day => {
        optimalTimes.push(`${day} at ${hour}:00`);
      });
    });

    return optimalTimes;
  }

  private analyzeContentPreferences(journeyHistory: JourneyPath[]): any {
    // Analyze content preferences based on journey stages
    const stageContent = new Map<JourneyStage, string[]>();

    journeyHistory.forEach(journey => {
      journey.pathHistory.forEach(stage => {
        if (!stageContent.has(stage)) {
          stageContent.set(stage, []);
        }
        // This would integrate with actual content interaction data
        stageContent.get(stage)!.push('general_content');
      });
    });

    return {
      stagePreferences: Object.fromEntries(stageContent),
      contentEffectiveness: this.calculateContentEffectiveness(journeyHistory)
    };
  }

  private calculateContentEffectiveness(journeyHistory: JourneyPath[]): Record<string, number> {
    // Calculate content effectiveness by stage
    const effectiveness: Record<string, number> = {};

    const stages: JourneyStage[] = ['awareness', 'consideration', 'decision', 'purchase', 'loyalty'];
    stages.forEach(stage => {
      const stageJourneys = journeyHistory.filter(j => j.currentStage === stage);
      if (stageJourneys.length > 0) {
        const avgScore = stageJourneys.reduce((sum, j) => sum + j.score, 0) / stageJourneys.length;
        effectiveness[stage] = avgScore;
      } else {
        effectiveness[stage] = 0;
      }
    });

    return effectiveness;
  }

  private predictFutureBehavior(journeyHistory: JourneyPath[]): any {
    if (journeyHistory.length === 0) {
      return {
        likelyNextStage: 'awareness',
        confidence: 0.5,
        timeframe: '1-2 weeks',
        recommendedActions: ['Start engagement with educational content']
      };
    }

    const recentJourney = journeyHistory[0];
    const historicalPatterns = this.analyzeJourneyPatterns(journeyHistory);

    return {
      likelyNextStage: recentJourney.predictedNextStage,
      confidence: recentJourney.score,
      timeframe: `${Math.round(recentJourney.estimatedTimeToNext)} hours`,
      recommendedActions: [
        `Continue current engagement strategy`,
        `Monitor for transition to ${recentJourney.predictedNextStage}`,
        `Prepare content for next stage`
      ],
      riskFactors: this.identifyRiskFactors(recentJourney),
      opportunities: this.identifyOpportunities(recentJourney)
    };
  }

  async updateJourneyConfiguration(stage: JourneyStage, configuration: Partial<JourneyStageContent>): Promise<void> {
    try {
      const currentStrategy = this.stageStrategies.get(stage);
      if (!currentStrategy) {
        throw new Error(`No strategy found for stage: ${stage}`);
      }

      // Update strategy
      const updatedStrategy = { ...currentStrategy, ...configuration };
      this.stageStrategies.set(stage, updatedStrategy);

      // Save to database
      await this.saveStageConfiguration(stage, updatedStrategy);

      console.log(`Journey configuration updated for stage: ${stage}`);
    } catch (error) {
      console.error('Error updating journey configuration:', error);
      throw new Error('Failed to update journey configuration');
    }
  }

  private async saveStageConfiguration(stage: JourneyStage, configuration: JourneyStageContent): Promise<void> {
    try {
      await database.all(
        `INSERT OR REPLACE INTO journey_configurations
         (stage, configuration, updated_at)
         VALUES (?, ?, ?)`,
        [stage, JSON.stringify(configuration), new Date().toISOString()]
      );
    } catch (error) {
      console.error('Error saving stage configuration:', error);
      throw error;
    }
  }

  async getJourneyStatistics(timeRange: { start: Date; end: Date } = { start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), end: new Date() }): Promise<any> {
    try {
      const stats = await database.all(
        `SELECT
           COUNT(*) as total_journeys,
           COUNT(DISTINCT customer_id) as unique_customers,
           AVG(score) as avg_score,
           AVG(progress) as avg_progress,
           COUNT(CASE WHEN journey_stage = 'loyalty' THEN 1 END) as loyal_customers,
           COUNT(CASE WHEN journey_stage = 'purchase' THEN 1 END) as purchasing_customers
         FROM customer_journeys
         WHERE created_at BETWEEN ? AND ?`,
        [timeRange.start.toISOString(), timeRange.end.toISOString()]
      );

      const stageDistribution = await database.all(
        `SELECT journey_stage, COUNT(*) as count
         FROM customer_journeys
         WHERE created_at BETWEEN ? AND ?
         GROUP BY journey_stage`,
        [timeRange.start.toISOString(), timeRange.end.toISOString()]
      );

      return {
        overview: stats[0],
        stageDistribution: stageDistribution.reduce((acc, row) => {
          acc[row.journey_stage] = row.count;
          return acc;
        }, {} as Record<string, number>),
        conversionFunnel: await this.getJourneyFunnel(timeRange),
        topBarriers: await this.getTopBarriers(timeRange),
        averageJourneyTime: await this.getAverageJourneyTime(timeRange)
      };
    } catch (error) {
      console.error('Error getting journey statistics:', error);
      throw new Error('Failed to get journey statistics');
    }
  }

  private async getTopBarriers(timeRange: { start: Date; end: Date }): Promise<Array<{ barrier: string; count: number }>> {
    try {
      const barrierData = await database.all(
        `SELECT barrier, COUNT(*) as count
         FROM journey_barriers
         WHERE created_at BETWEEN ? AND ?
         GROUP BY barrier
         ORDER BY count DESC
         LIMIT 10`,
        [timeRange.start.toISOString(), timeRange.end.toISOString()]
      );

      return barrierData.map(row => ({ barrier: row.barrier, count: row.count }));
    } catch (error) {
      console.error('Error getting top barriers:', error);
      return [];
    }
  }

  private async getAverageJourneyTime(timeRange: { start: Date; end: Date }): Promise<number> {
    try {
      const timeData = await database.all(
        `SELECT AVG(julianday(updated_at) - julianday(created_at)) * 24 as avg_hours
         FROM customer_journeys
         WHERE created_at BETWEEN ? AND ?
         AND journey_stage = 'loyalty'`,
        [timeRange.start.toISOString(), timeRange.end.toISOString()]
      );

      return timeData[0]?.avg_hours || 0;
    } catch (error) {
      console.error('Error getting average journey time:', error);
      return 0;
    }
  }
}

export const journeyOptimizer = new JourneyOptimizer();