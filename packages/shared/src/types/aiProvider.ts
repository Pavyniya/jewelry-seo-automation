// AI Provider Management Types for Jewelry SEO Automation System

export interface ProviderHealth {
  id: string;
  provider: string;
  status: 'healthy' | 'degraded' | 'down' | 'maintenance';
  responseTime: number;
  errorRate: number;
  successRate: number;
  lastChecked: Date;
  consecutiveFailures: number;
  circuitState: 'closed' | 'open' | 'half-open';
}

export interface ProviderSelection {
  requestId: string;
  selectedProvider: string;
  selectionReason: SelectionReason;
  estimatedCost: number;
  estimatedTime: number;
  confidence: number;
  alternatives: ProviderAlternative[];
  timestamp: Date;
}

export interface ProviderAlternative {
  provider: string;
  cost: number;
  estimatedTime: number;
  reliability: number;
  suitability: number;
}

export interface RateLimitState {
  providerId: string;
  currentUsage: number;
  limit: number;
  resetTime: Date;
  windowStart: Date;
  requestsInWindow: number;
  burstCapacity: number;
}

export interface CostOptimization {
  strategy: OptimizationStrategy;
  currentSavings: number;
  potentialSavings: number;
  providerRecommendations: ProviderRecommendation[];
  usagePatterns: UsagePattern[];
  lastOptimized: Date;
}

export interface ProviderRecommendation {
  provider: string;
  recommendedFor: string[];
  expectedSavings: number;
  confidence: number;
  reasoning: string;
}

export interface UsagePattern {
  contentType: string;
  averageTokens: number;
  preferredProviders: string[];
  costEfficiency: number;
  successRate: number;
}

export interface ProviderPerformance {
  providerId: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  averageCost: number;
  uptime: number;
  lastUpdated: Date;
  performanceScore: number;
}

export interface AiProviderConfig {
  id: string;
  name: string;
  apiKey: string;
  baseUrl: string;
  model: string;
  maxTokens: number;
  rateLimit: number;
  costPerToken: number;
  priority: number;
  specialties: string[];
  isActive: boolean;
  circuitBreakerThreshold: number;
  retryAttempts: number;
}

export interface FailoverConfig {
  providerId: string;
  fallbackOrder: number;
  conditions: FailoverCondition[];
  retryStrategy: RetryStrategy;
  healthCheckInterval: number;
  timeout: number;
}

export interface FailoverCondition {
  type: 'error_rate' | 'response_time' | 'status_code' | 'quota_exceeded';
  threshold: number;
  operator: 'greater_than' | 'less_than' | 'equals';
  action: 'switch_provider' | 'retry' | 'circuit_break';
}

export interface RetryStrategy {
  maxAttempts: number;
  backoffMultiplier: number;
  initialDelay: number;
  maxDelay: number;
  jitter: boolean;
}

export interface ProviderHealthCheck {
  providerId: string;
  status: 'pass' | 'fail';
  responseTime: number;
  timestamp: Date;
  error?: string;
  metrics: {
    cpu?: number;
    memory?: number;
    requestsPerMinute?: number;
    errorRate?: number;
  };
}

export interface CircuitBreakerState {
  providerId: string;
  state: 'closed' | 'open' | 'half-open';
  failureCount: number;
  lastFailureTime?: Date;
  recoveryTime?: Date;
  threshold: number;
  timeout: number;
}

export interface CostAnalysis {
  providerId: string;
  totalCost: number;
  totalTokens: number;
  averageCostPerRequest: number;
  costByContentType: Record<string, number>;
  dailyUsage: DailyUsage[];
  monthlyTrend: number;
  projectedMonthlyCost: number;
}

export interface DailyUsage {
  date: string;
  tokens: number;
  cost: number;
  requests: number;
}

export type SelectionReason = 'cost' | 'performance' | 'specialization' | 'availability' | 'load_balance';
export type OptimizationStrategy = 'cost_first' | 'performance_first' | 'balanced' | 'specialized';

export interface ProviderSelectionResponse {
  requestId: string;
  selectedProvider: string;
  confidence: number;
  estimatedCost: number;
  estimatedTime: number;
  fallbackProviders: string[];
  optimizationApplied: boolean;
  selectionCriteria: {
    cost: number;
    performance: number;
    reliability: number;
    specialization: number;
  };
}

export interface ProviderTestRequest {
  providerId: string;
  testType: 'connectivity' | 'performance' | 'content_generation';
  payload?: any;
  timeout?: number;
}

export interface ProviderTestResponse {
  providerId: string;
  testType: string;
  status: 'success' | 'failed';
  responseTime: number;
  cost?: number;
  result?: any;
  error?: string;
  timestamp: Date;
}