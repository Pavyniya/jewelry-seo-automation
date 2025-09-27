import { create } from 'zustand'
import {
  OptimizationRule,
  OptimizationTemplate,
  ApprovalRequest,
  Workflow,
  RuleExecutionResult,
  AutomationFilters,
  TemplateFilters,
  RuleBuilderState
} from '../../../../packages/shared/src/types/automation'

interface AutomationState {
  // Rules
  rules: OptimizationRule[]
  templates: OptimizationTemplate[]
  workflows: Workflow[]
  approvals: ApprovalRequest[]
  executionHistory: RuleExecutionResult[]

  // UI State
  loading: boolean
  error: string | null
  filters: AutomationFilters
  templateFilters: TemplateFilters
  selectedRule: OptimizationRule | null
  builderState: RuleBuilderState | null
  isBuilderOpen: boolean

  // Performance
  lastUpdated: string | null
}

interface AutomationActions {
  // Rules Management
  setRules: (_rules: OptimizationRule[]) => void
  addRule: (_rule: OptimizationRule) => void
  updateRule: (_id: string, _updates: Partial<OptimizationRule>) => void
  deleteRule: (_id: string) => void
  executeRule: (_id: string) => Promise<RuleExecutionResult>

  // Templates Management
  setTemplates: (_templates: OptimizationTemplate[]) => void
  createRuleFromTemplate: (_templateId: string) => OptimizationRule

  // Approvals Management
  setApprovals: (_approvals: ApprovalRequest[]) => void
  approveRequest: (_id: string, _reviewedBy: string) => void
  rejectRequest: (_id: string, _reviewedBy: string, _reason: string) => void

  // Workflows Management
  setWorkflows: (_workflows: Workflow[]) => void
  addWorkflow: (_workflow: Workflow) => void

  // UI Actions
  setLoading: (_loading: boolean) => void
  setError: (_error: string | null) => void
  setFilters: (_filters: Partial<AutomationFilters>) => void
  setTemplateFilters: (_filters: Partial<TemplateFilters>) => void
  setSelectedRule: (_rule: OptimizationRule | null) => void
  setBuilderState: (_state: RuleBuilderState | null) => void
  setIsBuilderOpen: (_open: boolean) => void

  // Data Fetching
  fetchRules: () => Promise<void>
  fetchTemplates: () => Promise<void>
  fetchApprovals: () => Promise<void>
  fetchWorkflows: () => Promise<void>
  refreshData: () => Promise<void>
}

const defaultBuilderState: RuleBuilderState = {
  name: '',
  description: '',
  category: 'seo',
  conditions: [],
  actions: [],
  schedule: {
    type: 'manual',
    timezone: 'UTC'
  },
  isActive: true,
  priority: 5
}

export const useAutomationStore = create<AutomationState & AutomationActions>((set, get) => ({
  // Initial State
  rules: [],
  templates: [],
  workflows: [],
  approvals: [],
  executionHistory: [],
  loading: false,
  error: null,
  filters: {
    category: undefined,
    status: undefined,
    search: '',
    sortBy: 'name'
  },
  templateFilters: {
    category: undefined,
    search: '',
    effectiveness: undefined,
    sortBy: 'effectiveness'
  },
  selectedRule: null,
  builderState: null,
  isBuilderOpen: false,
  lastUpdated: null,

  // Rules Management
  setRules: (_rules) => set({ rules: _rules }),

  addRule: (_rule) => set((state) => ({
    rules: [...state.rules, _rule]
  })),

  updateRule: (_id, _updates) => set((state) => ({
    rules: state.rules.map(rule =>
      rule.id === _id ? { ...rule, ..._updates, updatedAt: new Date() } : rule
    )
  })),

  deleteRule: (_id) => set((state) => ({
    rules: state.rules.filter(rule => rule.id !== _id)
  })),

  executeRule: async (_id) => {
    const { setLoading, setError } = get()

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/v1/automation/rules/${_id}/execute`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to execute rule')
      }

      const result = await response.json()

      // Update rule performance in local state
      set((state) => ({
        rules: state.rules.map(rule =>
          rule.id === _id
            ? {
                ...rule,
                lastRun: new Date(),
                performance: {
                  ...rule.performance,
                  executions: rule.performance.executions + 1,
                  successes: rule.performance.successes + 1,
                  lastMeasured: new Date()
                }
              }
            : rule
        ),
        executionHistory: [result.data, ...state.executionHistory]
      }))

      return result.data
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error')
      throw error
    } finally {
      setLoading(false)
    }
  },

  // Templates Management
  setTemplates: (_templates) => set({ templates: _templates }),

  createRuleFromTemplate: (_templateId) => {
    const { templates } = get()
    const template = templates.find(t => t.id === _templateId)

    if (!template) {
      throw new Error('Template not found')
    }

    return {
      id: '',
      name: template.name,
      description: template.description,
      category: template.category as any,
      conditions: [...template.conditions],
      actions: [...template.actions],
      schedule: { ...template.schedule },
      isActive: true,
      priority: 5,
      performance: {
        executions: 0,
        successes: 0,
        failures: 0,
        averageImprovement: 0,
        roi: 0,
        lastMeasured: new Date()
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }
  },

  // Approvals Management
  setApprovals: (_approvals) => set({ approvals: _approvals }),

  approveRequest: async (_id, _reviewedBy) => {
    const { setLoading, setError } = get()

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/v1/automation/approvals/${_id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reviewedBy: _reviewedBy })
      })

      if (!response.ok) {
        throw new Error('Failed to approve request')
      }

      set((state) => ({
        approvals: state.approvals.map(approval =>
          approval.id === _id
            ? { ...approval, status: 'approved', reviewedBy: _reviewedBy, reviewedAt: new Date() }
            : approval
        )
      }))
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  },

  rejectRequest: async (_id, _reviewedBy, _reason) => {
    const { setLoading, setError } = get()

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/v1/automation/approvals/${_id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reviewedBy: _reviewedBy, rejectionReason: _reason })
      })

      if (!response.ok) {
        throw new Error('Failed to reject request')
      }

      set((state) => ({
        approvals: state.approvals.map(approval =>
          approval.id === _id
            ? { ...approval, status: 'rejected', reviewedBy: _reviewedBy, reviewedAt: new Date(), rejectionReason: _reason }
            : approval
        )
      }))
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  },

  // Workflows Management
  setWorkflows: (_workflows) => set({ workflows: _workflows }),

  addWorkflow: (_workflow) => set((state) => ({
    workflows: [...state.workflows, _workflow]
  })),

  // UI Actions
  setLoading: (_loading) => set({ loading: _loading }),
  setError: (_error) => set({ error: _error }),

  setFilters: (_filters) => set((state) => ({
    filters: { ...state.filters, ..._filters }
  })),

  setTemplateFilters: (_filters) => set((state) => ({
    templateFilters: { ...state.templateFilters, ..._filters }
  })),

  setSelectedRule: (_rule) => set({ selectedRule: _rule }),

  setBuilderState: (_state) => set({ builderState: _state }),

  setIsBuilderOpen: (_open) => set({ isBuilderOpen: _open }),

  // Data Fetching
  fetchRules: async () => {
    const { setLoading, setError, filters } = get()

    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString())
        }
      })

      const response = await fetch(`/api/v1/automation/rules?${params}`)

      if (!response.ok) {
        throw new Error('Failed to fetch rules')
      }

      const result = await response.json()
      set({ rules: result.data || [] })
    } catch (error) {
      console.warn('Failed to fetch rules from API, using mock data:', error);

      // Fallback to mock rules data
      const mockRules: OptimizationRule[] = [
        {
          id: '1',
          name: 'SEO Title Optimization',
          description: 'Automatically optimize product titles for better SEO performance',
          category: 'seo',
          conditions: [
            {
              id: '1',
              type: 'performance',
              field: 'seoScore',
              operator: 'less_than',
              value: 80
            }
          ],
          actions: [
            {
              id: '1',
              type: 'update_title',
              parameters: {
                template: '{title} - {category} - {brand}',
                maxLength: 60
              },
              approvalRequired: false
            }
          ],
          schedule: {
            type: 'manual',
            timezone: 'UTC'
          },
          isActive: true,
          priority: 5,
          lastRun: new Date('2024-01-15T10:00:00Z'),
          nextRun: new Date('2024-01-22T10:00:00Z'),
          performance: {
            executions: 150,
            successes: 142,
            failures: 8,
            averageImprovement: 0.15,
            roi: 2.5,
            lastMeasured: new Date('2024-01-20T10:00:00Z')
          },
          createdAt: new Date('2024-01-01T00:00:00Z'),
          updatedAt: new Date('2024-01-15T10:00:00Z')
        },
        {
          id: '2',
          name: 'Low Stock Alert',
          description: 'Send alerts when jewelry inventory drops below threshold',
          category: 'inventory',
          conditions: [
            {
              id: '1',
              type: 'product',
              field: 'inventoryQuantity',
              operator: 'less_than',
              value: 5
            }
          ],
          actions: [
            {
              id: '1',
              type: 'send_alert',
              parameters: {
                recipients: ['admin@ohhglam.com'],
                message: 'Low stock alert: {productTitle} has only {inventoryQuantity} items left',
                priority: 'high'
              },
              approvalRequired: false
            }
          ],
          schedule: {
            type: 'recurring',
            frequency: 'daily',
            timezone: 'UTC'
          },
          isActive: true,
          priority: 8,
          lastRun: new Date('2024-01-19T09:00:00Z'),
          nextRun: new Date('2024-01-20T09:00:00Z'),
          performance: {
            executions: 89,
            successes: 87,
            failures: 2,
            averageImprovement: 0.25,
            roi: 1.8,
            lastMeasured: new Date('2024-01-19T09:00:00Z')
          },
          createdAt: new Date('2024-01-02T00:00:00Z'),
          updatedAt: new Date('2024-01-10T14:30:00Z')
        },
        {
          id: '3',
          name: 'Pricing Optimization',
          description: 'Adjust prices based on demand and competitor analysis',
          category: 'pricing',
          conditions: [
            {
              id: '1',
              type: 'performance',
              field: 'salesVelocity',
              operator: 'greater_than',
              value: 10
            }
          ],
          actions: [
            {
              id: '1',
              type: 'update_pricing',
              parameters: {
                adjustment: 'increase',
                percentage: 5,
                maxPrice: 1000
              },
              approvalRequired: true
            }
          ],
          schedule: {
            type: 'recurring',
            frequency: 'weekly',
            timezone: 'UTC'
          },
          isActive: true,
          priority: 6,
          lastRun: new Date('2024-01-12T09:15:00Z'),
          nextRun: new Date('2024-01-19T09:15:00Z'),
          performance: {
            executions: 45,
            successes: 41,
            failures: 4,
            averageImprovement: 0.12,
            roi: 3.2,
            lastMeasured: new Date('2024-01-12T09:15:00Z')
          },
          createdAt: new Date('2024-01-03T00:00:00Z'),
          updatedAt: new Date('2024-01-12T09:15:00Z')
        },
        {
          id: '4',
          name: 'Image Optimization',
          description: 'Optimize product images for better performance and SEO',
          category: 'seo',
          conditions: [
            {
              id: '1',
              type: 'performance',
              field: 'imageLoadTime',
              operator: 'greater_than',
              value: 3
            }
          ],
          actions: [
            {
              id: '1',
              type: 'optimize_images',
              parameters: {
                quality: 80,
                maxWidth: 1200,
                format: 'webp'
              },
              approvalRequired: false
            }
          ],
          schedule: {
            type: 'manual',
            timezone: 'UTC'
          },
          isActive: false,
          priority: 4,
          performance: {
            executions: 67,
            successes: 64,
            failures: 3,
            averageImprovement: 0.18,
            roi: 1.5,
            lastMeasured: new Date('2024-01-08T16:45:00Z')
          },
          createdAt: new Date('2024-01-04T00:00:00Z'),
          updatedAt: new Date('2024-01-08T16:45:00Z')
        }
      ];

      set({
        rules: mockRules,
        error: 'Using mock data - API unavailable'
      });
    } finally {
      setLoading(false)
    }
  },

  fetchTemplates: async () => {
    const { setLoading, setError, templateFilters } = get()

    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      Object.entries(templateFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString())
        }
      })

      const response = await fetch(`/api/v1/automation/templates?${params}`)

      if (!response.ok) {
        throw new Error('Failed to fetch templates')
      }

      const result = await response.json()
      set({ templates: result.data || [] })
    } catch (error) {
      console.warn('Failed to fetch templates from API, using mock data:', error);

      // Fallback to mock templates data
      const mockTemplates: OptimizationTemplate[] = [
        {
          id: '1',
          name: 'SEO Title Optimization',
          description: 'Automatically optimize product titles for better SEO performance',
          category: 'seo',
          conditions: [
            {
              id: '1',
              type: 'performance',
              field: 'seoScore',
              operator: 'less_than',
              value: 80
            }
          ],
          actions: [
            {
              id: '1',
              type: 'update_title',
              parameters: {
                template: '{title} - {category} - {brand}',
                maxLength: 60
              },
              approvalRequired: false
            }
          ],
          schedule: {
            type: 'manual',
            timezone: 'UTC'
          },
          effectiveness: 85,
          usageCount: 1250,
          averageImprovement: 0.15,
          isPopular: true,
          isRecommended: true,
          createdAt: new Date('2024-01-01T00:00:00Z'),
          updatedAt: new Date('2024-01-15T10:00:00Z')
        },
        {
          id: '2',
          name: 'Low Stock Alert',
          description: 'Send alerts when jewelry inventory drops below threshold',
          category: 'inventory',
          conditions: [
            {
              id: '1',
              type: 'product',
              field: 'inventoryQuantity',
              operator: 'less_than',
              value: 5
            }
          ],
          actions: [
            {
              id: '1',
              type: 'send_alert',
              parameters: {
                recipients: ['admin@ohhglam.com'],
                message: 'Low stock alert: {productTitle} has only {inventoryQuantity} items left',
                priority: 'high'
              },
              approvalRequired: false
            }
          ],
          schedule: {
            type: 'recurring',
            frequency: 'daily',
            timezone: 'UTC'
          },
          effectiveness: 95,
          usageCount: 890,
          averageImprovement: 0.25,
          isPopular: true,
          isRecommended: false,
          createdAt: new Date('2024-01-02T00:00:00Z'),
          updatedAt: new Date('2024-01-10T14:30:00Z')
        },
        {
          id: '3',
          name: 'Pricing Optimization',
          description: 'Adjust prices based on demand and competitor analysis',
          category: 'pricing',
          conditions: [
            {
              id: '1',
              type: 'performance',
              field: 'salesVelocity',
              operator: 'greater_than',
              value: 10
            }
          ],
          actions: [
            {
              id: '1',
              type: 'update_pricing',
              parameters: {
                adjustment: 'increase',
                percentage: 5,
                maxPrice: 1000
              },
              approvalRequired: true
            }
          ],
          schedule: {
            type: 'recurring',
            frequency: 'weekly',
            timezone: 'UTC'
          },
          effectiveness: 78,
          usageCount: 450,
          averageImprovement: 0.12,
          isPopular: false,
          isRecommended: true,
          createdAt: new Date('2024-01-03T00:00:00Z'),
          updatedAt: new Date('2024-01-12T09:15:00Z')
        },
        {
          id: '4',
          name: 'Image Optimization',
          description: 'Optimize product images for better performance and SEO',
          category: 'seo',
          conditions: [
            {
              id: '1',
              type: 'performance',
              field: 'imageLoadTime',
              operator: 'greater_than',
              value: 3
            }
          ],
          actions: [
            {
              id: '1',
              type: 'optimize_images',
              parameters: {
                quality: 80,
                maxWidth: 1200,
                format: 'webp'
              },
              approvalRequired: false
            }
          ],
          schedule: {
            type: 'manual',
            timezone: 'UTC'
          },
          effectiveness: 82,
          usageCount: 675,
          averageImprovement: 0.18,
          isPopular: true,
          isRecommended: false,
          createdAt: new Date('2024-01-04T00:00:00Z'),
          updatedAt: new Date('2024-01-08T16:45:00Z')
        }
      ];

      set({
        templates: mockTemplates,
        error: 'Using mock data - API unavailable'
      });
    } finally {
      setLoading(false)
    }
  },

  fetchApprovals: async () => {
    const { setLoading, setError } = get()

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/v1/automation/approvals')

      if (!response.ok) {
        throw new Error('Failed to fetch approvals')
      }

      const result = await response.json()
      set({ approvals: result.data || [] })
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  },

  fetchWorkflows: async () => {
    const { setLoading, setError } = get()

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/v1/automation/workflows')

      if (!response.ok) {
        throw new Error('Failed to fetch workflows')
      }

      const result = await response.json()
      set({ workflows: result.data || [] })
    } catch (error) {
      console.warn('Failed to fetch workflows from API, using mock data:', error);

      // Fallback to mock workflows data
      const mockWorkflows: Workflow[] = [
        {
          id: '1',
          name: 'SEO Optimization Pipeline',
          description: 'Complete SEO optimization workflow for jewelry products',
          rules: ['1', '2', '3'],
          dependencies: [],
          schedule: {
            type: 'recurring',
            frequency: 'weekly',
            timezone: 'UTC',
            daysOfWeek: [1, 3, 5]
          },
          status: 'active',
          performance: {
            executions: 25,
            successes: 23,
            failures: 2,
            successRate: 0.92,
            averageRuntime: 45.2
          },
          createdAt: new Date('2024-01-15T10:00:00Z'),
          updatedAt: new Date('2024-01-20T14:30:00Z'),
          lastRun: new Date('2024-01-20T10:00:00Z'),
          nextRun: new Date('2024-01-22T10:00:00Z')
        },
        {
          id: '2',
          name: 'Inventory Management',
          description: 'Automated inventory management for low stock alerts',
          rules: ['4', '5'],
          dependencies: [],
          schedule: {
            type: 'recurring',
            frequency: 'daily',
            timezone: 'UTC'
          },
          status: 'active',
          performance: {
            executions: 150,
            successes: 148,
            failures: 2,
            successRate: 0.987,
            averageRuntime: 12.8
          },
          createdAt: new Date('2024-01-10T09:00:00Z'),
          updatedAt: new Date('2024-01-19T11:00:00Z'),
          lastRun: new Date('2024-01-19T09:00:00Z'),
          nextRun: new Date('2024-01-20T09:00:00Z')
        }
      ];

      set({
        workflows: mockWorkflows,
        error: 'Using mock data - API unavailable'
      });
    } finally {
      setLoading(false)
    }
  },

  refreshData: async () => {
    const { setLoading, setError } = get()

    try {
      setLoading(true)
      setError(null)

      await Promise.all([
        get().fetchRules(),
        get().fetchTemplates(),
        get().fetchApprovals(),
        get().fetchWorkflows()
      ])

      set({ lastUpdated: new Date().toISOString() })
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }
}))