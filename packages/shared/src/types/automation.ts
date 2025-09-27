// Automation Rule Types
export interface OptimizationRule {
  id: string;
  name: string;
  description: string;
  category: RuleCategory;
  conditions: RuleCondition[];
  actions: RuleAction[];
  schedule: RuleSchedule;
  isActive: boolean;
  priority: number;
  lastRun?: Date;
  nextRun?: Date;
  performance: RulePerformance;
  createdAt: Date;
  updatedAt: Date;
}

export interface RuleCondition {
  id: string;
  type: ConditionType;
  field: string;
  operator: ConditionOperator;
  value: any;
  metadata?: Record<string, any>;
}

export interface RuleAction {
  id: string;
  type: ActionType;
  parameters: Record<string, any>;
  approvalRequired: boolean;
  rollbackAction?: string;
}

export interface RuleSchedule {
  type: 'manual' | 'recurring' | 'triggered';
  frequency?: ScheduleFrequency;
  triggers?: TriggerConfig[];
  timezone: string;
}

export interface RulePerformance {
  executions: number;
  successes: number;
  failures: number;
  averageImprovement: number;
  roi: number;
  lastMeasured: Date;
}

export interface TriggerConfig {
  type: 'time' | 'event' | 'performance' | 'competitive' | 'custom';
  config: Record<string, any>;
}

export interface RuleExecutionResult {
  ruleId: string;
  executionId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  affectedProducts: string[];
  changes: RuleChange[];
  errors?: string[];
  performance: {
    improvements: Record<string, number>;
    roi: number;
  };
}

export interface RuleChange {
  field: string;
  oldValue: any;
  newValue: any;
  productId: string;
  timestamp: Date;
}

export interface ApprovalRequest {
  id: string;
  ruleId: string;
  ruleName: string;
  actionId: string;
  actionType: ActionType;
  description: string;
  riskLevel: 'low' | 'medium' | 'high';
  estimatedImpact: string;
  requestedBy: string;
  requestedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: Date;
  rejectionReason?: string;
}

export interface OptimizationTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  targetAudience: string;
  conditions: RuleCondition[];
  actions: RuleAction[];
  schedule: RuleSchedule;
  effectiveness: number;
  usageCount: number;
  createdAt: Date;
  isPopular: boolean;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  rules: string[];
  dependencies: string[];
  schedule: RuleSchedule;
  status: 'active' | 'inactive' | 'draft';
  performance: WorkflowPerformance;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowPerformance {
  executions: number;
  averageDuration: number;
  successRate: number;
  totalImprovements: number;
  lastExecution?: Date;
}

// Type Definitions
export type RuleCategory = 'seo' | 'content' | 'pricing' | 'inventory' | 'branding';
export type ConditionType = 'product' | 'performance' | 'competitive' | 'temporal' | 'custom';
export type ActionType = 'optimize_content' | 'update_pricing' | 'adjust_tags' | 'send_alert' | 'update_meta' | 'optimize_images';
export type ScheduleFrequency = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'quarterly';
export type TemplateCategory = 'jewelry' | 'seasonal' | 'trend' | 'brand' | 'performance';
export type ConditionOperator = 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'starts_with' | 'ends_with' | 'matches_regex';

// UI Component Types
export interface RuleBuilderState {
  name: string;
  description: string;
  category: RuleCategory;
  conditions: RuleCondition[];
  actions: RuleAction[];
  schedule: RuleSchedule;
  isActive: boolean;
  priority: number;
}

export interface TemplateFilters {
  category?: TemplateCategory;
  search?: string;
  effectiveness?: number;
  sortBy?: 'name' | 'effectiveness' | 'usage' | 'created';
}

export interface AutomationFilters {
  category?: RuleCategory;
  status?: 'active' | 'inactive';
  search?: string;
  sortBy?: 'name' | 'performance' | 'lastRun' | 'priority';
}