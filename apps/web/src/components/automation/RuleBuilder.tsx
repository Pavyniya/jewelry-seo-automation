import React, { useState } from 'react'
import { useAutomationStore } from '@/stores/automationStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import {
  RuleBuilderState,
  RuleCondition,
  RuleAction,
  RuleCategory,
  ConditionType,
  ActionType,
  ConditionOperator,
  OptimizationTemplate
} from '@jewelry-seo/shared/types/automation'
import { Plus, Trash2, Settings, Play, Save } from 'lucide-react'

interface RuleBuilderProps {
  onSave: (rule: RuleBuilderState) => void
  onCancel: () => void
  initialRule?: RuleBuilderState
  templates?: OptimizationTemplate[]
}

const conditionFields = {
  product: ['title', 'description', 'tags', 'category', 'price', 'inventory'],
  performance: ['organicTraffic', 'conversionRate', 'bounceRate', 'averagePosition'],
  competitive: ['competitorPriceDifference', 'marketShare', 'rankingDifference'],
  temporal: ['season', 'month', 'dayOfWeek', 'hour'],
  custom: ['customField']
}

const actionTypes = [
  { value: 'optimize_content', label: 'Optimize Content' },
  { value: 'update_pricing', label: 'Update Pricing' },
  { value: 'adjust_tags', label: 'Adjust Tags' },
  { value: 'send_alert', label: 'Send Alert' },
  { value: 'update_meta', label: 'Update Meta Tags' },
  { value: 'optimize_images', label: 'Optimize Images' }
]

const conditionOperators: ConditionOperator[] = [
  'equals', 'not_equals', 'contains', 'not_contains',
  'greater_than', 'less_than', 'starts_with', 'ends_with', 'matches_regex'
]

export const RuleBuilder: React.FC<RuleBuilderProps> = ({
  onSave,
  onCancel,
  initialRule,
  templates = []
}) => {
  const [localState, setLocalState] = useState<RuleBuilderState>(() => {
    try {
      console.log('RuleBuilder initialRule received:', JSON.stringify(initialRule, null, 2))
      return initialRule || {
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
    } catch (error) {
      console.error('Error initializing RuleBuilder state:', error)
      return {
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
    }
  })

  console.log('RuleBuilder mounted with:', {
    initialRule: initialRule ? 'present' : 'null',
    localState: {
      name: localState.name,
      category: localState.category,
      conditions: localState.conditions.length,
      actions: localState.actions.length
    }
  })

  const [showTemplates, setShowTemplates] = useState(false)

  const addCondition = () => {
    const newCondition: RuleCondition = {
      id: `condition_${Date.now()}`,
      type: 'product',
      field: 'title',
      operator: 'contains',
      value: ''
    }

    setLocalState(prev => ({
      ...prev,
      conditions: [...prev.conditions, newCondition]
    }))
  }

  const updateCondition = (id: string, updates: Partial<RuleCondition>) => {
    setLocalState(prev => ({
      ...prev,
      conditions: prev.conditions.map(cond =>
        cond.id === id ? { ...cond, ...updates } : cond
      )
    }))
  }

  const removeCondition = (id: string) => {
    setLocalState(prev => ({
      ...prev,
      conditions: prev.conditions.filter(cond => cond.id !== id)
    }))
  }

  const addAction = () => {
    const newAction: RuleAction = {
      id: `action_${Date.now()}`,
      type: 'optimize_content',
      parameters: {},
      approvalRequired: false
    }

    setLocalState(prev => ({
      ...prev,
      actions: [...prev.actions, newAction]
    }))
  }

  const updateAction = (id: string, updates: Partial<RuleAction>) => {
    setLocalState(prev => ({
      ...prev,
      actions: prev.actions.map(action =>
        action.id === id ? { ...action, ...updates } : action
      )
    }))
  }

  const removeAction = (id: string) => {
    setLocalState(prev => ({
      ...prev,
      actions: prev.actions.filter(action => action.id !== id)
    }))
  }

  const handleSave = () => {
    if (!localState.name.trim()) {
      alert('Rule name is required')
      return
    }

    if (localState.conditions.length === 0) {
      alert('At least one condition is required')
      return
    }

    if (localState.actions.length === 0) {
      alert('At least one action is required')
      return
    }

    onSave(localState)
  }

  const applyTemplate = (template: OptimizationTemplate) => {
    setLocalState(prev => ({
      ...prev,
      name: template.name,
      description: template.description,
      category: template.category as RuleCategory,
      conditions: [...template.conditions],
      actions: [...template.actions],
      schedule: { ...template.schedule }
    }))
    setShowTemplates(false)
  }

  if (!localState) {
    console.error('RuleBuilder: localState is null/undefined')
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-red-800 font-semibold">Error Loading Rule Builder</h3>
        <p className="text-red-600">The rule builder failed to initialize properly. Please try again.</p>
        <button
          onClick={onCancel}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Back to Rules
        </button>
      </div>
    )
  }

  console.log('RuleBuilder rendering...')
  try {
    return (
      <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Rule Builder</h2>
        <div className="flex gap-2">
          {templates.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setShowTemplates(!showTemplates)}
            >
              Use Template
            </Button>
          )}
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save Rule
          </Button>
        </div>
      </div>

      {/* Template Selection */}
      {showTemplates && (
        <Card>
          <CardHeader>
            <CardTitle>Choose a Template</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                  onClick={() => applyTemplate(template)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{template.name}</h4>
                      <p className="text-sm text-gray-600">{template.description}</p>
                      <Badge className="bg-gray-100 text-gray-800 border-gray-200 mt-1">
                        {template.category}
                      </Badge>
                    </div>
                    <Badge className="border border-gray-300 text-gray-700">
                      {Math.round(template.effectiveness * 100)}% effective
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Rule Name *</label>
            <Input
              value={localState.name}
              onChange={(e) => setLocalState(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter rule name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Input
              value={localState.description}
              onChange={(e) => setLocalState(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what this rule does"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                value={localState.category}
                onChange={(e) => setLocalState(prev => ({ ...prev, category: e.target.value as RuleCategory }))}
                className="w-full p-2 border rounded-md"
              >
                <option value="seo">SEO</option>
                <option value="content">Content</option>
                <option value="pricing">Pricing</option>
                <option value="inventory">Inventory</option>
                <option value="branding">Branding</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Priority</label>
              <input
                type="number"
                min="1"
                max="10"
                value={localState.priority}
                onChange={(e) => setLocalState(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                className="w-full p-2 border rounded-md"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conditions */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Conditions</CardTitle>
            <Button variant="outline" size="sm" onClick={addCondition}>
              <Plus className="w-4 h-4 mr-2" />
              Add Condition
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {localState.conditions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No conditions added yet</p>
          ) : (
            localState.conditions.map((condition) => (
              <div key={condition.id} className="p-4 border rounded-lg bg-gray-50">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex gap-2 items-center">
                    <Badge className="border border-gray-300 text-gray-700">{condition.type}</Badge>
                    <span className="text-sm text-gray-600">
                      IF {condition.field} {condition.operator} "{condition.value}"
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCondition(condition.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <select
                    value={condition.type}
                    onChange={(e) => updateCondition(condition.id, { type: e.target.value as ConditionType })}
                    className="p-2 border rounded-md text-sm"
                  >
                    <option value="product">Product</option>
                    <option value="performance">Performance</option>
                    <option value="competitive">Competitive</option>
                    <option value="temporal">Temporal</option>
                    <option value="custom">Custom</option>
                  </select>
                  <select
                    value={condition.field}
                    onChange={(e) => updateCondition(condition.id, { field: e.target.value })}
                    className="p-2 border rounded-md text-sm"
                  >
                    {conditionFields[condition.type].map((field) => (
                      <option key={field} value={field}>
                        {field.charAt(0).toUpperCase() + field.slice(1)}
                      </option>
                    ))}
                  </select>
                  <select
                    value={condition.operator}
                    onChange={(e) => updateCondition(condition.id, { operator: e.target.value as ConditionOperator })}
                    className="p-2 border rounded-md text-sm"
                  >
                    {conditionOperators.map((op) => (
                      <option key={op} value={op}>
                        {op.replace('_', ' ').toUpperCase()}
                      </option>
                    ))}
                  </select>
                  <Input
                    value={condition.value}
                    onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                    placeholder="Value"
                    className="text-sm"
                  />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Actions</CardTitle>
            <Button variant="outline" size="sm" onClick={addAction}>
              <Plus className="w-4 h-4 mr-2" />
              Add Action
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {localState.actions.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No actions added yet</p>
          ) : (
            localState.actions.map((action) => (
              <div key={action.id} className="p-4 border rounded-lg bg-gray-50">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex gap-2 items-center">
                    <Badge className="border border-gray-300 text-gray-700">{action.type}</Badge>
                    {action.approvalRequired && (
                      <Badge className="bg-red-500 text-white">Requires Approval</Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAction(action.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={action.type}
                    onChange={(e) => updateAction(action.id, { type: e.target.value as ActionType })}
                    className="p-2 border rounded-md text-sm"
                  >
                    {actionTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={action.approvalRequired}
                      onChange={(e) => updateAction(action.id, { approvalRequired: e.target.checked })}
                    />
                    Requires Approval
                  </label>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Schedule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Schedule Type</label>
            <select
              value={localState.schedule.type}
              onChange={(e) => setLocalState(prev => ({
                ...prev,
                schedule: { ...prev.schedule, type: e.target.value as 'manual' | 'recurring' | 'triggered' }
              }))}
              className="w-full p-2 border rounded-md"
            >
              <option value="manual">Manual</option>
              <option value="recurring">Recurring</option>
              <option value="triggered">Triggered</option>
            </select>
          </div>
          {localState.schedule.type === 'recurring' && (
            <div>
              <label className="block text-sm font-medium mb-1">Frequency</label>
              <select
                value={localState.schedule.frequency || 'daily'}
                onChange={(e) => setLocalState(prev => ({
                  ...prev,
                  schedule: { ...prev.schedule, frequency: e.target.value as 'hourly' | 'daily' | 'weekly' | 'monthly' | 'quarterly' }
                }))}
                className="w-full p-2 border rounded-md"
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
  } catch (error) {
    console.error('RuleBuilder render error:', error)
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-red-800 font-semibold">RuleBuilder Render Error</h3>
        <p className="text-red-600">Error: {error instanceof Error ? error.message : 'Unknown error'}</p>
        <pre className="text-xs text-red-500 mt-2 overflow-auto">
          {error instanceof Error ? error.stack : 'No stack trace'}
        </pre>
      </div>
    )
  }
}