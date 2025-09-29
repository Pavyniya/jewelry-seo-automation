
export type RuleCategory = 'seo' | 'content' | 'pricing' | 'inventory' | 'branding';
export type ConditionType = 'product' | 'performance' | 'competitive' | 'temporal' | 'custom';
export type ActionType = 'optimize_content' | 'update_pricing' | 'adjust_tags' | 'send_alert';
export type ScheduleFrequency = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'quarterly';
export type ConditionOperator = 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'not_contains';

export interface TriggerConfig {
    type: string;
    metadata: Record<string, any>;
}

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
