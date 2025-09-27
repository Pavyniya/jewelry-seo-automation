import React, { useState, useMemo } from 'react'
import { useAutomationStore } from '@/stores/automationStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import type {
  OptimizationRule,
  RulePerformance
} from '@jewelry-seo/shared/types/automation'
import {
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  Target,
  AlertCircle,
  CheckCircle,
  BarChart3,
  Activity
} from 'lucide-react'

interface RulePerformanceProps {
  rules?: OptimizationRule[]
  timeframe?: '7d' | '30d' | '90d' | '1y'
}

interface PerformanceMetric {
  label: string
  value: number
  change: number
  icon: React.ReactNode
  color: string
}

const RulePerformanceComponent: React.FC<RulePerformanceProps> = ({
  rules: propRules,
  timeframe = '30d'
}) => {
  const { rules: storeRules } = useAutomationStore()
  const rules = propRules || storeRules
  const [selectedRule, setSelectedRule] = useState<OptimizationRule | null>(null)

  // Calculate aggregate performance metrics
  const aggregateMetrics = useMemo(() => {
    if (rules.length === 0) return null

    const totalExecutions = rules.reduce((sum, rule) => sum + rule.performance.executions, 0)
    const totalSuccesses = rules.reduce((sum, rule) => sum + rule.performance.successes, 0)
    const totalFailures = rules.reduce((sum, rule) => sum + rule.performance.failures, 0)
    const avgImprovement = rules.reduce((sum, rule) => sum + rule.performance.averageImprovement, 0) / rules.length
    const avgROI = rules.reduce((sum, rule) => sum + rule.performance.roi, 0) / rules.length

    const successRate = totalExecutions > 0 ? (totalSuccesses / totalExecutions) * 100 : 0

    // Calculate change based on timeframe (mock data for demo)
    const changeRate = timeframe === '7d' ? 0.12 : timeframe === '30d' ? 0.08 : 0.05

    return {
      totalExecutions,
      totalSuccesses,
      totalFailures,
      successRate,
      avgImprovement,
      avgROI,
      changeRate
    }
  }, [rules, timeframe])

  const getPerformanceColor = (value: number, type: 'improvement' | 'roi' | 'success') => {
    switch (type) {
      case 'improvement':
        return value >= 0.15 ? 'text-green-600' : value >= 0.08 ? 'text-yellow-600' : 'text-red-600'
      case 'roi':
        return value >= 2.0 ? 'text-green-600' : value >= 1.0 ? 'text-yellow-600' : 'text-red-600'
      case 'success':
        return value >= 90 ? 'text-green-600' : value >= 70 ? 'text-yellow-600' : 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getTrendIcon = (change: number) => {
    return change >= 0 ? (
      <TrendingUp className="w-4 h-4 text-green-600" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-600" />
    )
  }

  const metrics: PerformanceMetric[] = aggregateMetrics ? [
    {
      label: 'Total Executions',
      value: aggregateMetrics.totalExecutions,
      change: aggregateMetrics.changeRate * 100,
      icon: <Activity className="w-5 h-5" />,
      color: 'text-blue-600'
    },
    {
      label: 'Success Rate',
      value: aggregateMetrics.successRate,
      change: aggregateMetrics.changeRate * 50,
      icon: <CheckCircle className="w-5 h-5" />,
      color: 'text-green-600'
    },
    {
      label: 'Avg Improvement',
      value: aggregateMetrics.avgImprovement * 100,
      change: aggregateMetrics.changeRate * 80,
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'text-purple-600'
    },
    {
      label: 'Avg ROI',
      value: aggregateMetrics.avgROI,
      change: aggregateMetrics.changeRate * 120,
      icon: <DollarSign className="w-5 h-5" />,
      color: 'text-yellow-600'
    }
  ] : []

  const topPerformingRules = useMemo(() => {
    return [...rules]
      .sort((a, b) => b.performance.averageImprovement - a.performance.averageImprovement)
      .slice(0, 5)
  }, [rules])

  const recentFailures = useMemo(() => {
    return rules
      .filter(rule => rule.performance.failures > 0)
      .sort((a, b) => b.performance.failures - a.performance.failures)
      .slice(0, 3)
  }, [rules])

  if (!aggregateMetrics) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Performance Data
            </h3>
            <p className="text-gray-600">
              Create and execute rules to see performance metrics
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Rule Performance</h2>
        <div className="flex gap-2">
          {['7d', '30d', '90d', '1y'].map((period) => (
            <Button
              key={period}
              className={timeframe === period ? 'bg-blue-100 text-blue-800 border-blue-200' : 'border border-gray-300 text-gray-700'}
              size="sm"
              onClick={() => {} /* Handle timeframe change */}
            >
              {period}
            </Button>
          ))}
        </div>
      </div>

      {/* Aggregate Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {metric.label}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className={`text-2xl font-bold ${metric.color}`}>
                      {metric.label === 'Avg Improvement' || metric.label === 'Success Rate'
                        ? `${metric.value.toFixed(1)}%`
                        : metric.label === 'Avg ROI'
                        ? `${metric.value.toFixed(1)}x`
                        : metric.value}
                    </span>
                    <div className="flex items-center gap-1">
                      {getTrendIcon(metric.change)}
                      <span className={`text-sm ${metric.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {metric.change >= 0 ? '+' : ''}{metric.change.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className={`p-2 rounded-lg ${metric.color.replace('text-', 'bg-')} bg-opacity-10`}>
                  {metric.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Rules */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Top Performing Rules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPerformingRules.map((rule, index) => (
                <div
                  key={rule.id}
                  className={`p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedRule?.id === rule.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => setSelectedRule(rule)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-sm">{rule.name}</h4>
                      <Badge className="border border-gray-300 text-gray-700 text-xs mt-1">
                        {rule.category}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-semibold ${getPerformanceColor(rule.performance.averageImprovement, 'improvement')}`}>
                        {(rule.performance.averageImprovement * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500">
                        ROI: {rule.performance.roi.toFixed(1)}x
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>{rule.performance.executions} executions</span>
                    <span>{((rule.performance.successes / rule.performance.executions) * 100).toFixed(0)}% success</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Failures */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Recent Failures
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentFailures.length > 0 ? (
              <div className="space-y-3">
                {recentFailures.map((rule) => (
                  <div key={rule.id} className="p-3 rounded-lg border border-red-200 bg-red-50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium text-sm text-red-900">{rule.name}</h4>
                        <Badge className="border border-red-300 text-red-700 text-xs mt-1">
                          {rule.category}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-red-600">
                          {rule.performance.failures} failures
                        </div>
                        <div className="text-xs text-red-500">
                          {((rule.performance.failures / rule.performance.executions) * 100).toFixed(0)}% failure rate
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-red-700">
                      <span>{rule.performance.executions} total executions</span>
                      <span>Last run: {new Date(rule.lastRun || '').toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">No recent failures</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Selected Rule Details */}
      {selectedRule && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              {selectedRule.name} - Detailed Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {selectedRule.performance.executions}
                </div>
                <div className="text-sm text-gray-600">Total Executions</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {selectedRule.performance.successes}
                </div>
                <div className="text-sm text-gray-600">Successful</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {selectedRule.performance.failures}
                </div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className={`text-2xl font-bold ${getPerformanceColor(selectedRule.performance.averageImprovement, 'improvement')}`}>
                  {(selectedRule.performance.averageImprovement * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Avg Improvement</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Rule Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category:</span>
                    <Badge className="border border-gray-300 text-gray-700">{selectedRule.category}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Priority:</span>
                    <span>{selectedRule.priority}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <Badge className={selectedRule.isActive ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-gray-100 text-gray-800 border-gray-200'}>
                      {selectedRule.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Schedule:</span>
                    <span className="capitalize">{selectedRule.schedule.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Run:</span>
                    <span>{selectedRule.lastRun ? new Date(selectedRule.lastRun).toLocaleDateString() : 'Never'}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Performance Breakdown</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Success Rate:</span>
                    <span className={`font-medium ${getPerformanceColor(
                      (selectedRule.performance.successes / selectedRule.performance.executions) * 100,
                      'success'
                    )}`}>
                      {((selectedRule.performance.successes / selectedRule.performance.executions) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">ROI:</span>
                    <span className={`font-medium ${getPerformanceColor(selectedRule.performance.roi, 'roi')}`}>
                      {selectedRule.performance.roi.toFixed(1)}x
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Conditions:</span>
                    <span>{selectedRule.conditions.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Actions:</span>
                    <span>{selectedRule.actions.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Requires Approval:</span>
                    <span>
                      {selectedRule.actions.some(action => action.approvalRequired) ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600">{selectedRule.description}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export { RulePerformanceComponent as RulePerformance }