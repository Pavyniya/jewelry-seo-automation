import React, { useState, useEffect } from 'react'
import { useAutomationStore } from '@/stores/automationStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { RuleBuilder } from '@/components/automation/RuleBuilder'
import { RuleTemplates } from '@/components/automation/RuleTemplates'
import { WorkflowDesigner } from '@/components/automation/WorkflowDesigner'
import { RulePerformance } from '@/components/automation/RulePerformance'
import { ApprovalQueue } from '@/components/automation/ApprovalQueue'
import {
  OptimizationRule,
  RuleBuilderState
} from '@jewelry-seo/shared/types/automation'
import {
  Plus,
  Settings,
  Play,
  Pause,
  Trash2,
  Edit,
  BarChart3,
  Clock,
  CheckSquare,
  Zap,
  Search,
  RefreshCw
} from 'lucide-react'

const AutomationRules: React.FC = () => {
  const {
    rules,
    templates,
    workflows,
    pendingApprovals,
    loading,
    error,
    filters,
    setFilters,
    setBuilderState,
    addRule,
    updateRule,
    deleteRule,
    executeRule,
    refreshData,
    fetchRules,
    fetchWorkflows
  } = useAutomationStore()

  const [activeTab, setActiveTab] = useState<'rules' | 'templates' | 'workflows' | 'performance' | 'approvals'>('rules')
  const [searchTerm, setSearchTerm] = useState('')
  const [showBuilder, setShowBuilder] = useState(false)
  const [showWorkflowDesigner, setShowWorkflowDesigner] = useState(false)
  const [editingRule, setEditingRule] = useState<OptimizationRule | null>(null)

  useEffect(() => {
    refreshData()
  }, [refreshData])

  useEffect(() => {
    // Load rules when switching to workflows tab to ensure they're available for workflow designer
    if (activeTab === 'workflows' && rules.length === 0) {
      fetchRules()
    }
  }, [activeTab, rules.length, fetchRules])

  const handleSaveRule = async (ruleState: RuleBuilderState) => {
    try {
      if (editingRule) {
        // Update existing rule
        await fetch(`/api/v1/automation/rules/${editingRule.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(ruleState)
        })
        updateRule(editingRule.id, ruleState)
      } else {
        // Create new rule
        const response = await fetch('/api/v1/automation/rules', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(ruleState)
        })

        if (!response.ok) {
          throw new Error('Failed to create rule')
        }

        const newRule = await response.json()
        addRule(newRule.data)
      }

      setShowBuilder(false)
      setEditingRule(null)
      setBuilderState(null)
    } catch (error) {
      console.error('Error saving rule:', error)
      alert('Failed to save rule')
    }
  }

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return

    try {
      await fetch(`/api/v1/automation/rules/${ruleId}`, {
        method: 'DELETE'
      })
      deleteRule(ruleId)
    } catch (error) {
      console.error('Error deleting rule:', error)
      alert('Failed to delete rule')
    }
  }

  const handleToggleRule = async (rule: OptimizationRule) => {
    try {
      await fetch(`/api/v1/automation/rules/${rule.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...rule, isActive: !rule.isActive })
      })
      updateRule(rule.id, { isActive: !rule.isActive })
    } catch (error) {
      console.error('Error toggling rule:', error)
      alert('Failed to toggle rule')
    }
  }

  const handleExecuteRule = async (ruleId: string) => {
    try {
      await executeRule(ruleId)
      alert('Rule executed successfully!')
    } catch (error) {
      console.error('Error executing rule:', error)
      alert('Failed to execute rule')
    }
  }

  const handleExecuteWorkflow = async (workflowId: string) => {
    try {
      // Mock workflow execution since we don't have a real API
      alert(`Workflow "${workflows.find(w => w.id === workflowId)?.name}" execution started!`)
      console.log('Executing workflow:', workflowId)

      // Update the workflow performance to show it was executed
      const updatedWorkflows = workflows.map(workflow =>
        workflow.id === workflowId
          ? {
              ...workflow,
              lastRun: new Date(),
              performance: {
                ...workflow.performance,
                executions: workflow.performance.executions + 1,
                successes: workflow.performance.successes + 1
              }
            }
          : workflow
      )

      // Update the store (this is a mock update since we don't have real API)
      useAutomationStore.getState().setWorkflows(updatedWorkflows)

    } catch (error) {
      console.error('Error executing workflow:', error)
      alert('Failed to execute workflow')
    }
  }

  const handleEditWorkflow = (workflow: any) => {
    // Set the workflow designer to edit mode with the selected workflow
    setEditingWorkflow(workflow)
    setShowWorkflowDesigner(true)
  }

  const [editingWorkflow, setEditingWorkflow] = useState<any>(null)

  const handleEditRule = (rule: OptimizationRule) => {
    try {
      console.log('Editing rule:', rule)
      console.log('Rule data:', {
        name: rule.name,
        category: rule.category,
        conditions: rule.conditions,
        actions: rule.actions,
        schedule: rule.schedule
      })

      // Validate rule data
      if (!rule || !rule.id) {
        console.error('Invalid rule data:', rule)
        alert('Invalid rule data. Please try again.')
        return
      }

      setEditingRule(rule)
      setBuilderState({
        name: rule.name || '',
        description: rule.description || '',
        category: rule.category || 'seo',
        conditions: rule.conditions || [],
        actions: rule.actions || [],
        schedule: rule.schedule || { type: 'manual', timezone: 'UTC' },
        isActive: rule.isActive ?? true,
        priority: rule.priority ?? 5
      })
      setShowBuilder(true)
    } catch (error) {
      console.error('Error in handleEditRule:', error)
      alert('Failed to edit rule. Please try again.')
    }
  }

  const filteredRules = rules.filter(rule => {
    const matchesSearch = searchTerm === '' ||
      rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rule.description.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = !filters.category || rule.category === filters.category
    const matchesStatus = !filters.status || (filters.status === 'active' && rule.isActive) || (filters.status === 'inactive' && !rule.isActive)

    return matchesSearch && matchesCategory && matchesStatus
  })

  const pendingApprovalsCount = pendingApprovals.filter(a => a.status === 'pending').length

  const tabs = [
    { id: 'rules', label: 'Rules', icon: Settings, count: rules.length },
    { id: 'templates', label: 'Templates', icon: CheckSquare, count: templates.length },
    { id: 'workflows', label: 'Workflows', icon: Zap, count: workflows.length },
    { id: 'performance', label: 'Performance', icon: BarChart3 },
    { id: 'approvals', label: 'Approvals', icon: Clock, count: pendingApprovalsCount }
  ]

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'seo':
        return 'bg-blue-100 text-blue-800'
      case 'content':
        return 'bg-purple-100 text-purple-800'
      case 'pricing':
        return 'bg-yellow-100 text-yellow-800'
      case 'inventory':
        return 'bg-green-100 text-green-800'
      case 'branding':
        return 'bg-pink-100 text-pink-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (showBuilder) {
    try {
      console.log('Rendering RuleBuilder with:', {
        editingRule: !!editingRule,
        templates: templates.length,
        editingRuleData: editingRule
      })

      return (
        <div className="p-6">
          <div className="mb-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowBuilder(false)
                setEditingRule(null)
                setBuilderState(null)
              }}
            >
              ← Back to Rules
            </Button>
          </div>
          <div className="bg-white border rounded-lg">
            {console.log('About to render RuleBuilder with:', {
              editingRule: editingRule ? 'present' : 'null',
              editingRuleData: editingRule ? JSON.stringify(editingRule, null, 2) : 'null',
              templates: templates.length
            })}
            <RuleBuilder
              onSave={handleSaveRule}
              onCancel={() => {
                setShowBuilder(false)
                setEditingRule(null)
                setBuilderState(null)
              }}
              initialRule={editingRule ? {
                name: editingRule.name || '',
                description: editingRule.description || '',
                category: editingRule.category,
                conditions: editingRule.conditions || [],
                actions: editingRule.actions || [],
                schedule: editingRule.schedule || { type: 'manual', timezone: 'UTC' },
                isActive: editingRule.isActive ?? true,
                priority: editingRule.priority ?? 5
              } : undefined}
              templates={templates}
            />
          </div>
        </div>
      )
    } catch (error) {
      console.error('Error rendering RuleBuilder:', error)
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-red-800 font-semibold">Error Loading Rule Builder</h3>
          <p className="text-red-600">There was an error loading the rule builder. Please try again.</p>
          <Button
            variant="outline"
            onClick={() => {
              setShowBuilder(false)
              setEditingRule(null)
              setBuilderState(null)
            }}
            className="mt-4"
          >
            ← Back to Rules
          </Button>
        </div>
      )
    }
  }

  if (showWorkflowDesigner) {
    return (
      <div className="p-6">
        <WorkflowDesigner
          onSave={async (workflow) => {
            try {
              const workflowWithId = editingWorkflow
                ? { ...workflow, id: editingWorkflow.id, updatedAt: new Date() }
                : { ...workflow, id: `workflow_${Date.now()}`, createdAt: new Date() }

              const response = await fetch('/api/v1/automation/workflows', {
                method: editingWorkflow ? 'PUT' : 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(workflowWithId)
              })

              if (!response.ok) {
                throw new Error('Failed to save workflow')
              }

              const result = await response.json()
              setShowWorkflowDesigner(false)
              setActiveTab('workflows')
              setEditingWorkflow(null)
              fetchWorkflows()
            } catch (error) {
              console.error('Error saving workflow:', error)
              // Fallback: update local state
              const updatedWorkflows = editingWorkflow
                ? workflows.map(w => w.id === editingWorkflow.id ? { ...workflow, id: editingWorkflow.id } : w)
                : [...workflows, { ...workflow, id: `workflow_${Date.now()}`, createdAt: new Date() }]

              useAutomationStore.getState().setWorkflows(updatedWorkflows)
              setShowWorkflowDesigner(false)
              setActiveTab('workflows')
              setEditingWorkflow(null)
              alert(editingWorkflow ? 'Workflow updated successfully!' : 'Workflow created successfully!')
            }
          }}
          onCancel={() => {
            setShowWorkflowDesigner(false)
            setEditingWorkflow(null)
          }}
          initialWorkflow={editingWorkflow ? {
            name: editingWorkflow.name,
            description: editingWorkflow.description,
            rules: editingWorkflow.rules,
            dependencies: editingWorkflow.dependencies,
            schedule: editingWorkflow.schedule,
            status: editingWorkflow.status
          } : undefined}
        />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Automation Rules</h1>
          <p className="text-gray-600 mt-1">
            Create and manage automated optimization rules for your jewelry store
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refreshData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {activeTab === 'rules' && (
            <Button onClick={() => setShowBuilder(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Rule
            </Button>
          )}
          {activeTab === 'workflows' && (
            <Button onClick={() => setShowWorkflowDesigner(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Workflow
            </Button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.count !== undefined && (
                  <Badge className="bg-gray-100 text-gray-800 text-xs">
                    {tab.count}
                  </Badge>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'rules' && (
        <div className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search rules..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <select
                  value={filters.category || ''}
                  onChange={(e) => setFilters({ category: e.target.value as any || undefined })}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="">All Categories</option>
                  <option value="seo">SEO</option>
                  <option value="content">Content</option>
                  <option value="pricing">Pricing</option>
                  <option value="inventory">Inventory</option>
                  <option value="branding">Branding</option>
                </select>
                <select
                  value={filters.status || ''}
                  onChange={(e) => setFilters({ status: e.target.value as any || undefined })}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Rules Grid */}
          {loading ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading rules...</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredRules.map((rule) => (
                <Card key={rule.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">{rule.name}</h3>
                          <Badge className={getCategoryColor(rule.category)}>
                            {rule.category}
                          </Badge>
                          <Badge className={rule.isActive ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-gray-100 text-gray-800 border-gray-200'}>
                            {rule.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="text-gray-600 mb-3">{rule.description}</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Priority:</span>
                            <span className="ml-1 font-medium">{rule.priority}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Schedule:</span>
                            <span className="ml-1 font-medium capitalize">{rule.schedule.type}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Conditions:</span>
                            <span className="ml-1 font-medium">{rule.conditions.length}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Actions:</span>
                            <span className="ml-1 font-medium">{rule.actions.length}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                          <div>
                            <span className="text-gray-500">Executions:</span>
                            <span className="ml-1 font-medium">{rule.performance.executions}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Success Rate:</span>
                            <span className="ml-1 font-medium">
                              {rule.performance.executions > 0
                                ? `${((rule.performance.successes / rule.performance.executions) * 100).toFixed(1)}%`
                                : '0%'
                              }
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Avg Improvement:</span>
                            <span className="ml-1 font-medium">
                              {(rule.performance.averageImprovement * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExecuteRule(rule.id)}
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleRule(rule)}
                        >
                          {rule.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditRule(rule)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteRule(rule.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {filteredRules.length === 0 && !loading && (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Rules Found
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm || filters.category || filters.status
                      ? 'Try adjusting your filters'
                      : 'Create your first automation rule to get started'
                    }
                  </p>
                  {!searchTerm && !filters.category && !filters.status && (
                    <Button onClick={() => setShowBuilder(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Rule
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'templates' && (
        <RuleTemplates
          templates={templates}
          onSelect={(template) => {
            // Handle template selection
            console.log('Selected template:', template)
          }}
          onCreateRuleFromTemplate={async (templateId) => {
            // Find the template and create a new rule from it
            const template = templates.find(t => t.id === templateId)
            if (template) {
              const newRule = {
                name: template.name,
                description: template.description,
                category: template.category,
                conditions: [...template.conditions],
                actions: [...template.actions],
                schedule: { ...template.schedule },
                isActive: true,
                priority: 5
              }
              setBuilderState(newRule)
              setShowBuilder(true)
            }
          }}
        />
      )}

      {activeTab === 'workflows' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Workflows</h2>
            <Button onClick={() => setShowWorkflowDesigner(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Workflow
            </Button>
          </div>
          <div className="grid gap-4">
            {workflows.map((workflow) => (
              <Card key={workflow.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">{workflow.name}</h3>
                      <p className="text-gray-600 mb-3">{workflow.description}</p>
                      <div className="flex gap-4 text-sm text-gray-600">
                        <span>Rules: {workflow.rules.length}</span>
                        <span>Status: {workflow.status}</span>
                        <span>Executions: {workflow.performance.executions}</span>
                        <span>Success Rate: {(workflow.performance.successRate * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExecuteWorkflow(workflow.id)}
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Execute
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditWorkflow(workflow)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {workflows.length === 0 && (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Workflows Yet
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Create workflows to combine multiple rules into complex automation sequences
                  </p>
                  <Button onClick={() => setShowWorkflowDesigner(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Workflow
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'performance' && (
        <RulePerformance performance={rules.map(rule => rule.performance)} />
      )}

      {activeTab === 'approvals' && (
        <ApprovalQueue
          approvals={pendingApprovals}
          onApprove={(id) => {
            console.log('Approved:', id)
            // Mock approval - update status to approved
            // This would need a proper store update function
          }}
          onReject={(id, reason) => {
            console.log('Rejected:', id, reason)
            // Mock rejection - update status to rejected
            // This would need a proper store update function
          }}
        />
      )}
    </div>
  )
}

export default AutomationRules