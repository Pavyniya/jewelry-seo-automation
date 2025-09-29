export interface ContentInteraction {
  id: string;
  type: 'view' | 'click' | 'purchase' | 'wishlist' | 'compare' | 'search';
  productId?: string;
  contentId?: string;
  timestamp: Date;
  duration?: number;
  sessionId: string;
  customerId?: string;
  metadata?: Record<string, any>;
}

export interface ContentPreference {
  id: string;
  category: string;
  subcategory?: string;
  weight: number;
  confidence: number;
  lastUpdated: Date;
  source: 'explicit' | 'inferred' | 'behavioral';
}

export interface CustomerBehavior {
  id: string;
  customerId?: string;
  sessionId: string;
  interactions: ContentInteraction[];
  preferences: ContentPreference[];
  journeyStage: JourneyStage;
  segmentation: CustomerSegment[];
  behaviorScore: number;
  lastUpdated: Date;
  demographics?: CustomerDemographics;
  purchaseHistory?: PurchaseHistory;
}

export interface CustomerDemographics {
  age?: number;
  gender?: string;
  location?: string;
  income?: string;
  education?: string;
  interests?: string[];
}

export interface PurchaseHistory {
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastPurchaseDate?: Date;
  favoriteCategories: string[];
  preferredPriceRange: { min: number; max: number };
}

export interface PersonalizedContentVariant {
  id: string;
  title: string;
  description: string;
  callToAction: string;
  imagery: string[];
  personalizationScore: number;
  confidence: number;
  appliedStrategies: PersonalizationStrategy[];
  targetAudience: CustomerSegment[];
  contentType: 'product' | 'category' | 'landing' | 'email' | 'ad';
}

export interface PersonalizationRule {
  id: string;
  name: string;
  condition: PersonalizationCondition;
  action: PersonalizationAction;
  priority: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PersonalizationCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface PersonalizationAction {
  type: 'modify_content' | 'select_variant' | 'adjust_messaging' | 'change_imagery';
  parameters: Record<string, any>;
}

export interface PersonalizationPerformance {
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  conversionRate: number;
  revenue: number;
  engagementScore: number;
  lastUpdated: Date;
}

export interface ContentPersonalization {
  id: string;
  productId: string;
  customerId?: string;
  segmentId: string;
  personalizedContent: PersonalizedContentVariant;
  personalizationRules: PersonalizationRule[];
  performance: PersonalizationPerformance;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrendAnalysis {
  id: string;
  trendType: 'seasonal' | 'market' | 'competitive' | 'emerging';
  keywords: string[];
  sentiment: number;
  urgency: number;
  relevanceScore: number;
  recommendedActions: TrendAction[];
  detectedAt: Date;
  expiresAt: Date;
  confidence: number;
  source: 'social_media' | 'search_trends' | 'competitor_analysis' | 'sales_data';
}

export interface TrendAction {
  type: 'create_content' | 'update_pricing' | 'adjust_inventory' | 'launch_campaign';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  expectedImpact: string;
  timeframe: string;
  resources: string[];
}

export interface TestVariant {
  id: string;
  name: string;
  content: PersonalizedContentVariant;
  trafficAllocation: number;
  isActive: boolean;
}

export interface TestAudience {
  segments: CustomerSegment[];
  criteria: PersonalizationCondition[];
  sampleSize: number;
  duration: number;
}

export interface TestMetric {
  name: string;
  type: 'primary' | 'secondary';
  calculation: string;
  target: number;
  actual?: number;
  improvement?: number;
}

export interface TestResult {
  variantId: string;
  metricName: string;
  value: number;
  confidence: number;
  isSignificant: boolean;
  pValue: number;
  sampleSize: number;
}

export interface ABTest {
  id: string;
  name: string;
  description: string;
  variants: TestVariant[];
  targetAudience: TestAudience;
  metrics: TestMetric[];
  status: 'draft' | 'running' | 'completed' | 'paused';
  winner?: string;
  significance: number;
  startDate?: Date;
  endDate?: Date;
  results: TestResult[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface StageStrategy {
  contentFocus: string[];
  messagingTone: 'informational' | 'persuasive' | 'emotional' | 'urgent';
  callToActionType: 'learn_more' | 'buy_now' | 'compare' | 'wishlist';
  personalizationLevel: 'low' | 'medium' | 'high';
  optimizationGoals: OptimizationGoal[];
}

export interface MessagingGuideline {
  element: 'headline' | 'description' | 'cta' | 'imagery';
  requirements: string[];
  restrictions: string[];
  examples: string[];
}

export interface OptimizationGoal {
  metric: string;
  target: number;
  weight: number;
  current?: number;
}

export interface PerformanceTarget {
  conversionRate: number;
  engagementRate: number;
  averageSessionDuration: number;
  bounceRate: number;
  revenuePerVisitor: number;
}

export interface JourneyStageContent {
  stage: JourneyStage;
  contentStrategy: StageStrategy;
  messagingGuidelines: MessagingGuideline[];
  optimizationGoals: OptimizationGoal[];
  performanceTarget: PerformanceTarget;
}

export interface PerformancePrediction {
  expectedCTR: number;
  expectedConversionRate: number;
  expectedRevenue: number;
  confidence: number;
  factors: PredictionFactor[];
  risks: RiskFactor[];
}

export interface PredictionFactor {
  name: string;
  value: number;
  impact: 'positive' | 'negative';
  weight: number;
}

export interface RiskFactor {
  type: string;
  severity: 'low' | 'medium' | 'high';
  likelihood: number;
  mitigation: string;
}

export interface PersonalizationStrategy {
  id: string;
  name: string;
  type: 'demographic' | 'behavioral' | 'contextual' | 'psychographic';
  description: string;
  effectiveness: number;
  confidence: number;
  applicableSegments: CustomerSegment[];
}

export interface ContentStrategyResponse {
  productId: string;
  customerId?: string;
  segmentId: string;
  personalizedContent: {
    title: string;
    description: string;
    callToAction: string;
    imagery: string[];
    personalizationScore: number;
    confidence: number;
  };
  appliedStrategies: PersonalizationStrategy[];
  expectedPerformance: PerformancePrediction;
  recommendations: string[];
  alternatives: PersonalizedContentVariant[];
}

export interface BehaviorAnalysisRequest {
  customerId?: string;
  sessionId: string;
  timeRange: { start: Date; end: Date };
  includePurchaseHistory: boolean;
  includeDemographics: boolean;
}

export interface BehaviorAnalysisResponse {
  behaviorProfile: CustomerBehavior;
  insights: BehaviorInsight[];
  recommendations: string[];
  predictedActions: PredictedAction[];
  confidence: number;
}

export interface BehaviorInsight {
  type: 'preference' | 'pattern' | 'trend' | 'anomaly';
  title: string;
  description: string;
  significance: number;
  confidence: number;
  actionItems: string[];
}

export interface PredictedAction {
  action: string;
  probability: number;
  timeframe: string;
  triggers: string[];
}

export type JourneyStage = 'awareness' | 'consideration' | 'decision' | 'purchase' | 'loyalty';
export type CustomerSegment = 'new_visitor' | 'returning_customer' | 'vip' | 'price_sensitive' | 'quality_focused' | 'trend_conscious' | 'brand_loyal';