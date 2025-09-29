
import { create } from 'zustand';
import { OptimizationRule, RulePerformance } from 'packages/shared/src/types/automation';
import { getRules, createRule as createRuleApi, executeRule as executeRuleApi, deleteRule as deleteRuleApi } from '../services/automationService';

interface Filters {
  status?: string;
  category?: string;
  search?: string;
}

interface BuilderState {
  name: string;
  description: string;
  category: string;
  conditions: any[];
  actions: any[];
  schedule: string;
}

interface AutomationState {
  rules: OptimizationRule[];
  templates: OptimizationRule[];
  performance: RulePerformance[];
  pendingApprovals: any[];
  workflows: any[];
  loading: boolean;
  error: string | null;
  filters: Filters;
  selectedRule: OptimizationRule | null;
  isBuilderOpen: boolean;
  builderState: BuilderState | null;
  // Actions
  fetchRules: () => Promise<void>;
  createRule: (rule: OptimizationRule) => Promise<void>;
  updateRule: (ruleId: string, rule: OptimizationRule) => Promise<void>;
  deleteRule: (ruleId: string) => Promise<void>;
  executeRule: (ruleId: string) => Promise<void>;
  toggleRule: (ruleId: string) => void;
  setFilters: (filters: Partial<Filters>) => void;
  setSelectedRule: (rule: OptimizationRule | null) => void;
  setIsBuilderOpen: (open: boolean) => void;
  setBuilderState: (state: BuilderState | null) => void;
  addRule: (rule: OptimizationRule) => void;
  refreshData: () => Promise<void>;
  fetchTemplates: () => Promise<void>;
  fetchApprovals: () => Promise<void>;
  fetchWorkflows: () => Promise<void>;
}

const useAutomationStore = create<AutomationState>((set, get) => ({
  rules: [],
  templates: [],
  performance: [],
  pendingApprovals: [],
  workflows: [],
  loading: false,
  error: null,
  filters: {},
  selectedRule: null,
  isBuilderOpen: false,
  builderState: null,
  fetchRules: async () => {
    set({ loading: true, error: null });
    try {
      const rules = await getRules();
      set({ rules, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch rules',
        loading: false
      });
    }
  },
  createRule: async (rule) => {
    try {
      const newRule = await createRuleApi(rule);
      set((state) => ({ rules: [...state.rules, newRule] }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create rule'
      });
      throw error;
    }
  },
  updateRule: async (ruleId, rule) => {
    try {
      const response = await fetch(`/api/v1/automation/rules/${ruleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(rule)
      });

      if (!response.ok) {
        throw new Error('Failed to update rule');
      }

      const result = await response.json();
      set((state) => ({
        rules: state.rules.map(r => r.id === ruleId ? result.data : r)
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update rule'
      });
      throw error;
    }
  },
  deleteRule: async (ruleId) => {
    try {
      await deleteRuleApi(ruleId);
      set((state) => ({
        rules: state.rules.filter(r => r.id !== ruleId)
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete rule'
      });
      throw error;
    }
  },
  executeRule: async (ruleId) => {
    try {
      await executeRuleApi(ruleId);
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to execute rule'
      });
      throw error;
    }
  },
  toggleRule: (ruleId) => {
    set((state) => ({
      rules: state.rules.map(rule =>
        rule.id === ruleId
          ? { ...rule, isActive: !rule.isActive }
          : rule
      )
    }));
  },
  setFilters: (newFilters) => set((state) => ({
    filters: { ...state.filters, ...newFilters }
  })),
  setSelectedRule: (rule) => set({ selectedRule: rule }),
  setIsBuilderOpen: (open) => set({ isBuilderOpen: open }),
  setBuilderState: (state) => set({ builderState: state }),
  addRule: (rule) => set((state) => ({
    rules: [...state.rules, rule]
  })),
  refreshData: async () => {
    const { fetchRules, fetchTemplates, fetchApprovals, fetchWorkflows } = get();
    await Promise.all([
      fetchRules(),
      fetchTemplates(),
      fetchApprovals(),
      fetchWorkflows()
    ]);
  },
  fetchTemplates: async () => {
    try {
      // Sample templates for jewelry SEO automation
      const templates: OptimizationRule[] = [
        {
          id: 'template-seo-titles',
          name: 'SEO Title Optimization Template',
          description: 'Optimize product titles for better search engine rankings',
          category: 'seo',
          conditions: [
            {
              field: 'title',
              operator: 'length',
              value: 60,
              conditionType: 'text'
            }
          ],
          actions: [
            {
              type: 'optimize_seo_title',
              provider: 'openai',
              target: 'title'
            }
          ],
          schedule: { type: 'manual', timezone: 'UTC' },
          isActive: true,
          priority: 8,
          lastRun: null,
          nextRun: null,
          performance: { executions: 0, successes: 0, failures: 0, averageImprovement: 0, roi: 0, lastMeasured: new Date().toISOString() },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'template-content-enhancement',
          name: 'Content Enhancement Template',
          description: 'Enhance product descriptions with compelling jewelry language',
          category: 'content',
          conditions: [
            {
              field: 'description',
              operator: 'length',
              value: 150,
              conditionType: 'text'
            }
          ],
          actions: [
            {
              type: 'enhance_description',
              provider: 'anthropic',
              target: 'description'
            }
          ],
          schedule: { type: 'manual', timezone: 'UTC' },
          isActive: true,
          priority: 7,
          lastRun: null,
          nextRun: null,
          performance: { executions: 0, successes: 0, failures: 0, averageImprovement: 0, roi: 0, lastMeasured: new Date().toISOString() },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'template-pricing-analysis',
          name: 'Pricing Analysis Template',
          description: 'Analyze and suggest optimal pricing strategies',
          category: 'pricing',
          conditions: [
            {
              field: 'price',
              operator: 'greater_than',
              value: 50,
              conditionType: 'numeric'
            }
          ],
          actions: [
            {
              type: 'analyze_pricing',
              provider: 'gemini',
              target: 'price'
            }
          ],
          schedule: { type: 'manual', timezone: 'UTC' },
          isActive: true,
          priority: 6,
          lastRun: null,
          nextRun: null,
          performance: { executions: 0, successes: 0, failures: 0, averageImprovement: 0, roi: 0, lastMeasured: new Date().toISOString() },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      set({ templates });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch templates'
      });
    }
  },
  fetchApprovals: async () => {
    try {
      // Mock approvals for now
      const pendingApprovals = [];
      set({ pendingApprovals });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch approvals'
      });
    }
  },
  fetchWorkflows: async () => {
    try {
      // Sample workflows for jewelry SEO automation
      const workflows = [
        {
          id: 'workflow-complete-seo',
          name: 'Complete SEO Optimization Workflow',
          description: 'Comprehensive SEO optimization for new products',
          rules: ['e240970f-7be2-440b-bd75-a9053037eb87', '8d335124-e9aa-4daa-b49e-0307fa8eef32'],
          dependencies: ['product-data-validation'],
          schedule: { type: 'manual', timezone: 'UTC' },
          status: 'active',
          performance: {
            executions: 0,
            successes: 0,
            failures: 0,
            successRate: 0,
            lastRun: null,
            averageDuration: 0
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'workflow-content-refresh',
          name: 'Content Refresh Workflow',
          description: 'Refresh and enhance product content monthly',
          rules: ['253b1078-c5f7-4954-80cc-409e0e43ad30'],
          dependencies: ['inventory-check'],
          schedule: { type: 'monthly', day: 1, time: '03:00', timezone: 'UTC' },
          status: 'active',
          performance: {
            executions: 0,
            successes: 0,
            failures: 0,
            successRate: 0,
            lastRun: null,
            averageDuration: 0
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'workflow-pricing-review',
          name: 'Pricing Review Workflow',
          description: 'Review and adjust pricing strategies quarterly',
          rules: ['71cbf333-17aa-4e2f-ba11-7ede4f5c0151'],
          dependencies: ['market-analysis'],
          schedule: { type: 'quarterly', month: [0, 3, 6, 9], day: 1, time: '04:00', timezone: 'UTC' },
          status: 'inactive',
          performance: {
            executions: 0,
            successes: 0,
            failures: 0,
            successRate: 0,
            lastRun: null,
            averageDuration: 0
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      set({ workflows });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch workflows'
      });
    }
  },
  setWorkflows: (workflows) => set({ workflows }),
  }));

export { useAutomationStore };
export default useAutomationStore;
