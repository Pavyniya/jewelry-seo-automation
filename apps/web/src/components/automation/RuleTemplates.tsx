import React, { useState } from 'react'
import { useAutomationStore } from '@/stores/automationStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import {
  OptimizationTemplate,
  TemplateCategory,
  TemplateFilters
} from '@jewelry-seo/shared/types/automation'
import { Search, Filter, Star, Copy, Eye, X } from 'lucide-react'

interface RuleTemplatesProps {
  onSelectTemplate: (template: OptimizationTemplate) => void
  onCreateRuleFromTemplate: (templateId: string) => void
}

const templateCategories: TemplateCategory[] = [
  'jewelry', 'seasonal', 'trend', 'brand', 'performance'
]

export const RuleTemplates: React.FC<RuleTemplatesProps> = ({
  onSelectTemplate,
  onCreateRuleFromTemplate
}) => {
  const {
    templates,
    loading,
    templateFilters,
    setTemplateFilters,
    createRuleFromTemplate,
    addRule
  } = useAutomationStore()

  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | undefined>()
  const [sortBy, setSortBy] = useState<'effectiveness' | 'usage' | 'created'>('effectiveness')
  const [previewTemplate, setPreviewTemplate] = useState<OptimizationTemplate | null>(null)

  const handleCreateFromTemplate = async (templateId: string) => {
    try {
      const newRule = createRuleFromTemplate(templateId)

      // Generate a proper ID for the new rule
      const ruleWithId = {
        ...newRule,
        id: `rule_${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // Try to save via API first, fallback to local state
      try {
        const response = await fetch('/api/v1/automation/rules', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(ruleWithId)
        })

        if (!response.ok) {
          throw new Error('API unavailable')
        }

        const result = await response.json()
        addRule(result.data)
      } catch (apiError) {
        // Fallback: add rule directly to local state
        console.warn('API unavailable, adding rule locally:', apiError)
        addRule(ruleWithId)
      }

      // Show success message
      alert('Rule created successfully from template!')
    } catch (error) {
      console.error('Error creating rule from template:', error)
      alert('Failed to create rule from template')
    }
  }

  const filteredTemplates = templates
    .filter(template => {
      if (selectedCategory && template.category !== selectedCategory) return false
      if (templateFilters.search && !template.name.toLowerCase().includes(templateFilters.search.toLowerCase())) return false
      if (templateFilters.effectiveness && template.effectiveness < templateFilters.effectiveness) return false
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'effectiveness':
          return b.effectiveness - a.effectiveness
        case 'usage':
          return b.usageCount - a.usageCount
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        default:
          return 0
      }
    })

  const getCategoryColor = (category: TemplateCategory) => {
    switch (category) {
      case 'jewelry':
        return 'bg-purple-100 text-purple-800'
      case 'seasonal':
        return 'bg-orange-100 text-orange-800'
      case 'trend':
        return 'bg-blue-100 text-blue-800'
      case 'brand':
        return 'bg-pink-100 text-pink-800'
      case 'performance':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getEffectivenessColor = (effectiveness: number) => {
    if (effectiveness >= 0.9) return 'text-green-600'
    if (effectiveness >= 0.7) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Optimization Templates</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            {filteredTemplates.length} templates
          </span>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search templates..."
                  value={templateFilters.search || ''}
                  onChange={(e) => setTemplateFilters({ search: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value as TemplateCategory || undefined)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="">All Categories</option>
              {templateCategories.map((category) => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'effectiveness' | 'usage' | 'created')}
              className="px-3 py-2 border rounded-md"
            >
              <option value="effectiveness">Sort by Effectiveness</option>
              <option value="usage">Sort by Usage</option>
              <option value="created">Sort by Created</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory(undefined)}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            !selectedCategory
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All Templates
        </button>
        {templateCategories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === category
                ? getCategoryColor(category).replace('bg-', 'bg-').replace('text-', 'text-')
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      {loading ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading templates...</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg leading-tight">
                    {template.name}
                  </CardTitle>
                  {template.isPopular && (
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Badge className={`${getCategoryColor(template.category)} border border-gray-300`}>
                    {template.category}
                  </Badge>
                  <Badge className={`border border-gray-300 ${getEffectivenessColor(template.effectiveness)}`}>
                    {Math.round(template.effectiveness * 100)}% effective
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600 text-sm line-clamp-3">
                  {template.description}
                </p>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Target Audience:</span>
                    <span className="font-medium">{template.targetAudience}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Usage Count:</span>
                    <span className="font-medium">{template.usageCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Schedule:</span>
                    <span className="font-medium capitalize">{template.schedule.type}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t">
                  <div className="text-xs text-gray-500">
                    <strong>Conditions:</strong> {template.conditions.length}
                  </div>
                  <div className="text-xs text-gray-500">
                    <strong>Actions:</strong> {template.actions.length}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewTemplate(template)}
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleCreateFromTemplate(template.id)}
                    className="flex-1"
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Use Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredTemplates.length === 0 && !loading && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No templates found
              </h3>
              <p className="text-gray-600">
                Try adjusting your filters or search terms
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Template Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-xl">{previewTemplate.name}</CardTitle>
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Template Info */}
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-gray-600">{previewTemplate.description}</p>
              </div>

              {/* Category and Effectiveness */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Category</h3>
                  <Badge className={getCategoryColor(previewTemplate.category)}>
                    {previewTemplate.category}
                  </Badge>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Effectiveness</h3>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${previewTemplate.effectiveness}%` }}
                      />
                    </div>
                    <span className={`text-sm font-medium ${getEffectivenessColor(previewTemplate.effectiveness)}`}>
                      {previewTemplate.effectiveness}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Usage Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">{previewTemplate.usageCount}</div>
                  <div className="text-sm text-gray-600">Usage Count</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-bold text-green-600">
                    {(previewTemplate.averageImprovement * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Avg Improvement</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-bold text-purple-600">
                    {previewTemplate.isPopular ? 'Yes' : 'No'}
                  </div>
                  <div className="text-sm text-gray-600">Popular</div>
                </div>
              </div>

              {/* Conditions */}
              <div>
                <h3 className="font-semibold mb-3">Conditions ({previewTemplate.conditions.length})</h3>
                <div className="space-y-2">
                  {previewTemplate.conditions.map((condition, index) => (
                    <div key={condition.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm font-medium">Condition {index + 1}</div>
                      <div className="text-sm text-gray-600">
                        If <span className="font-mono">{condition.field}</span> is{' '}
                        <span className="font-mono">{condition.operator}</span> to{' '}
                        <span className="font-mono">{condition.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div>
                <h3 className="font-semibold mb-3">Actions ({previewTemplate.actions.length})</h3>
                <div className="space-y-2">
                  {previewTemplate.actions.map((action, index) => (
                    <div key={action.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm font-medium">
                        Action {index + 1}: {action.type.replace(/_/g, ' ').toUpperCase()}
                      </div>
                      {action.approvalRequired && (
                        <Badge className="bg-yellow-100 text-yellow-800 text-xs mt-1">
                          Requires Approval
                        </Badge>
                      )}
                      {action.params && Object.keys(action.params).length > 0 && (
                        <div className="text-xs text-gray-600 mt-1">
                          Parameters: {JSON.stringify(action.params, null, 2)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Schedule */}
              <div>
                <h3 className="font-semibold mb-2">Schedule</h3>
                <div className="text-sm text-gray-600">
                  Type: <span className="font-medium">{previewTemplate.schedule.type}</span>
                  {previewTemplate.schedule.frequency && (
                    <span>, Frequency: <span className="font-medium">{previewTemplate.schedule.frequency}</span></span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setPreviewTemplate(null)}
                  className="flex-1"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    handleCreateFromTemplate(previewTemplate.id)
                    setPreviewTemplate(null)
                  }}
                  className="flex-1"
                >
                  <Copy className="w-4 h-4 mr-1" />
                  Use This Template
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}