import React, { useState, useEffect } from 'react'
import { useAutomationStore } from '@/stores/automationStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import {
  Workflow,
  OptimizationRule,
  RuleSchedule
} from '@jewelry-seo/shared/types/automation'
import { Plus, Trash2, Play, Pause, Settings, Save } from 'lucide-react'

interface WorkflowDesignerProps {
  onSave: (workflow: Partial<Workflow>) => void
  onCancel: () => void
  initialWorkflow?: Partial<Workflow>
}

interface WorkflowNode {
  id: string
  type: 'rule' | 'condition' | 'action' | 'start' | 'end'
  title: string
  description?: string
  x: number
  y: number
  data?: Record<string, unknown>
}

export const WorkflowDesigner: React.FC<WorkflowDesignerProps> = ({
  onSave,
  onCancel,
  initialWorkflow
}) => {
  const { rules, workflows, addWorkflow, fetchRules, loading } = useAutomationStore()

  useEffect(() => {
    // Load rules when component mounts
    if (rules.length === 0) {
      fetchRules()
    }
  }, [fetchRules, rules.length])
  const [workflow, setWorkflow] = useState<Partial<Workflow>>({
    name: initialWorkflow?.name || '',
    description: initialWorkflow?.description || '',
    rules: initialWorkflow?.rules || [],
    dependencies: initialWorkflow?.dependencies || [],
    schedule: initialWorkflow?.schedule || {
      type: 'manual',
      timezone: 'UTC'
    },
    status: initialWorkflow?.status || 'draft'
  })

  const [nodes, setNodes] = useState<WorkflowNode[]>([
    {
      id: 'start',
      type: 'start',
      title: 'Start',
      x: 50,
      y: 100
    },
    {
      id: 'end',
      type: 'end',
      title: 'End',
      x: 750,
      y: 100
    }
  ])

  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  const addRuleToWorkflow = (ruleId: string) => {
    const rule = rules.find(r => r.id === ruleId)
    if (!rule) return

    const newNode: WorkflowNode = {
      id: `rule_${Date.now()}`,
      type: 'rule',
      title: rule.name,
      description: rule.description,
      x: 400,
      y: 100 + (nodes.length * 80),
      data: { ruleId: rule.id }
    }

    setNodes(prev => [...prev, newNode])
    setWorkflow(prev => ({
      ...prev,
      rules: [...(prev.rules || []), ruleId]
    }))
  }

  const removeNode = (nodeId: string) => {
    setNodes(prev => prev.filter(node => node.id !== nodeId))
    if (nodeId.startsWith('rule_')) {
      const ruleId = nodes.find(n => n.id === nodeId)?.data?.ruleId
      if (ruleId) {
        setWorkflow(prev => ({
          ...prev,
          rules: prev.rules?.filter(id => id !== ruleId) || []
        }))
      }
    }
  }

  const handleNodeMouseDown = (e: React.MouseEvent, node: WorkflowNode) => {
    setSelectedNode(node)
    setIsDragging(true)
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
    e.stopPropagation()
  }

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedNode) return

    const canvas = e.currentTarget as HTMLElement
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left - dragOffset.x
    const y = e.clientY - rect.top - dragOffset.y

    setNodes(prev => prev.map(node =>
      node.id === selectedNode.id ? { ...node, x, y } : node
    ))
  }

  const handleCanvasMouseUp = () => {
    setIsDragging(false)
    setSelectedNode(null)
  }

  const handleSave = () => {
    if (!workflow.name?.trim()) {
      alert('Workflow name is required')
      return
    }

    if (!workflow.rules || workflow.rules.length === 0) {
      alert('At least one rule is required')
      return
    }

    onSave(workflow)
  }

  const executeWorkflow = async () => {
    if (!workflow.id) return

    try {
      alert(`Workflow "${workflow.name}" execution started!`)
      // In a real implementation, this would call the workflow execution API
    } catch (error) {
      console.error('Error executing workflow:', error)
    }
  }

  const getNodeColor = (type: WorkflowNode['type']) => {
    switch (type) {
      case 'start':
        return 'bg-green-500 text-white'
      case 'end':
        return 'bg-red-500 text-white'
      case 'rule':
        return 'bg-blue-500 text-white'
      case 'condition':
        return 'bg-yellow-500 text-white'
      case 'action':
        return 'bg-purple-500 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Workflow Designer</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          {workflow.id && (
            <Button variant="outline" onClick={executeWorkflow}>
              <Play className="w-4 h-4 mr-2" />
              Execute
            </Button>
          )}
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save Workflow
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Canvas Area */}
        <div className="xl:col-span-2 border-r border-gray-200 pr-6">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Canvas</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="relative w-full h-96 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden"
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
              >
                {/* Workflow Nodes */}
                {nodes.map((node) => (
                  <div
                    key={node.id}
                    className={`absolute w-32 h-16 rounded-lg shadow-md cursor-move flex items-center justify-center text-sm font-medium text-center px-2 ${getNodeColor(node.type)} ${selectedNode?.id === node.id ? 'ring-2 ring-blue-400 ring-offset-2' : ''}`}
                    style={{ left: `${node.x}px`, top: `${node.y}px` }}
                    onMouseDown={(e) => handleNodeMouseDown(e, node)}
                  >
                    <div className="truncate">
                      <div className="font-semibold">{node.title}</div>
                      {node.description && (
                        <div className="text-xs opacity-90 truncate">{node.description}</div>
                      )}
                    </div>
                    {node.type !== 'start' && node.type !== 'end' && (
                      <button
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                        onClick={() => removeNode(node.id)}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}

                {/* Connections (simplified visual representation) */}
                {nodes.length > 2 && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    {nodes.slice(0, -1).map((node, index) => {
                      const nextNode = nodes[index + 1]
                      return (
                        <line
                          key={`${node.id}-${nextNode.id}`}
                          x1={node.x + 64}
                          y1={node.y + 32}
                          x2={nextNode.x}
                          y2={nextNode.y + 32}
                          stroke="#6B7280"
                          strokeWidth="2"
                          markerEnd="url(#arrowhead)"
                        />
                      )
                    })}
                    <defs>
                      <marker
                        id="arrowhead"
                        markerWidth="10"
                        markerHeight="7"
                        refX="9"
                        refY="3.5"
                        orient="auto"
                      >
                        <polygon
                          points="0 0, 10 3.5, 0 7"
                          fill="#6B7280"
                        />
                      </marker>
                    </defs>
                  </svg>
                )}

                {nodes.length === 2 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-5">
                    <div className="text-center">
                      <p className="text-gray-600 text-lg font-medium mb-2">
                        Drag rules from the panel to build your workflow
                      </p>
                      <p className="text-gray-500 text-sm">
                        Click on any rule in the "Available Rules" panel to add it to your workflow
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rules Panel */}
        <div className="space-y-4 pl-6 bg-blue-50 -ml-6 -mr-6 -mb-6 p-6 rounded-lg border-2 border-blue-200">
          <Card className="border-blue-300">
            <CardHeader className="bg-blue-100">
              <div className="flex justify-between items-center">
                <CardTitle className="text-blue-900">Available Rules</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchRules}
                  disabled={loading}
                  className="border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  {loading ? 'Loading...' : 'Refresh'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Loading rules...</p>
                </div>
              ) : rules.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-600">No rules available</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchRules}
                    className="mt-2"
                  >
                    Refresh Rules
                  </Button>
                </div>
              ) : (
                <>
                  {rules
                    .filter(rule => !workflow.rules?.includes(rule.id))
                    .map((rule) => (
                      <div
                        key={rule.id}
                        className="p-3 border rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-colors"
                        onClick={() => addRuleToWorkflow(rule.id)}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-medium text-sm text-gray-900">{rule.name}</h4>
                          <Badge className={`text-xs ${
                            rule.category === 'seo' ? 'bg-blue-100 text-blue-800' :
                            rule.category === 'pricing' ? 'bg-green-100 text-green-800' :
                            rule.category === 'inventory' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {rule.category}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {rule.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-xs ${rule.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                            {rule.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <span className="text-xs text-gray-400">
                            Priority: {rule.priority}
                          </span>
                        </div>
                      </div>
                    ))}

                  {rules.filter(rule => !workflow.rules?.includes(rule.id)).length === 0 && (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-600 mb-2">
                        All rules are already in the workflow
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setWorkflow(prev => ({ ...prev, rules: [] }))
                          setNodes(prev => prev.filter(node => node.type === 'start' || node.type === 'end'))
                        }}
                      >
                        Clear All Rules
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Workflow Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Workflow Name *</label>
                <Input
                  value={workflow.name || ''}
                  onChange={(e) => setWorkflow(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter workflow name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Input
                  value={workflow.description || ''}
                  onChange={(e) => setWorkflow(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe this workflow"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Schedule Type</label>
                <select
                  value={workflow.schedule?.type || 'manual'}
                  onChange={(e) => setWorkflow(prev => ({
                    ...prev,
                    schedule: { ...prev.schedule!, type: e.target.value as 'manual' | 'recurring' | 'triggered' }
                  }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="manual">Manual</option>
                  <option value="recurring">Recurring</option>
                  <option value="triggered">Triggered</option>
                </select>
              </div>
              {workflow.schedule?.type === 'recurring' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Frequency</label>
                  <select
                    value={workflow.schedule.frequency || 'daily'}
                    onChange={(e) => setWorkflow(prev => ({
                      ...prev,
                      schedule: { ...prev.schedule!, frequency: e.target.value as 'hourly' | 'daily' | 'weekly' | 'monthly' }
                    }))}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={workflow.status || 'draft'}
                  onChange={(e) => setWorkflow(prev => ({ ...prev, status: e.target.value as 'draft' | 'active' | 'inactive' }))}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Workflow Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Rules:</span>
                <span className="font-medium">{workflow.rules?.length || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Dependencies:</span>
                <span className="font-medium">{workflow.dependencies?.length || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Schedule:</span>
                <span className="font-medium capitalize">{workflow.schedule?.type}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Status:</span>
                <Badge className={`border border-gray-300 text-xs ${
                  workflow.status === 'active' ? 'text-green-600' :
                  workflow.status === 'inactive' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {workflow.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}