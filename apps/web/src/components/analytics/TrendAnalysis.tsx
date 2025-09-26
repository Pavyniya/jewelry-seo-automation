import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Target,
  Zap,
  Smartphone,
  Activity,
  RefreshCw,
  Download
} from 'lucide-react'
import { useAnalyticsStore } from '@/stores/analyticsStore'
import { SEOTrendData } from '@/types/analytics'

interface TrendAnalysisProps {
  className?: string
}

const TrendAnalysis: React.FC<TrendAnalysisProps> = ({ className }) => {
  const {
    trends,
    loading,
    error,
    filters,
    setFilters,
    refreshData
  } = useAnalyticsStore()

  const [selectedMetric, setSelectedMetric] = useState<'organicTraffic' | 'keywordPositions' | 'backlinks' | 'pageSpeed' | 'mobileUsability' | 'overallScore'>('overallScore')

  useEffect(() => {
    refreshData()
  }, [filters.dateRange])

  const getTrendIcon = (direction: 'up' | 'down' | 'stable') => {
    switch (direction) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-600" />
      default:
        return <Activity className="w-4 h-4 text-gray-400" />
    }
  }

  const getTrendData = (metric: keyof SEOTrendData) => {
    const data = trends.map(trend => ({
      date: trend.date,
      value: trend[metric] as number
    }))

    if (data.length < 2) return { direction: 'stable', change: 0 }

    const current = data[data.length - 1].value
    const previous = data[data.length - 2].value
    const change = ((current - previous) / previous) * 100

    let direction: 'up' | 'down' | 'stable' = 'stable'
    if (Math.abs(change) > 1) {
      direction = change > 0 ? 'up' : 'down'
    }

    return { direction, change }
  }

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'organicTraffic':
        return <Target className="w-5 h-5" />
      case 'keywordPositions':
        return <TrendingUp className="w-5 h-5" />
      case 'backlinks':
        return <Activity className="w-5 h-5" />
      case 'pageSpeed':
        return <Zap className="w-5 h-5" />
      case 'mobileUsability':
        return <Smartphone className="w-5 h-5" />
      default:
        return <Calendar className="w-5 h-5" />
    }
  }

  const getMetricLabel = (metric: string) => {
    switch (metric) {
      case 'organicTraffic':
        return 'Organic Traffic'
      case 'keywordPositions':
        return 'Keyword Positions'
      case 'backlinks':
        return 'Backlinks'
      case 'pageSpeed':
        return 'Page Speed'
      case 'mobileUsability':
        return 'Mobile Usability'
      case 'overallScore':
        return 'Overall SEO Score'
      default:
        return metric
    }
  }

  const getMetricColor = (metric: string) => {
    switch (metric) {
      case 'organicTraffic':
        return 'bg-blue-100 text-blue-800'
      case 'keywordPositions':
        return 'bg-green-100 text-green-800'
      case 'backlinks':
        return 'bg-purple-100 text-purple-800'
      case 'pageSpeed':
        return 'bg-yellow-100 text-yellow-800'
      case 'mobileUsability':
        return 'bg-indigo-100 text-indigo-800'
      case 'overallScore':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const selectedTrendData = getTrendData(selectedMetric)

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>SEO Trend Analysis</CardTitle>
            <div className="flex items-center gap-4">
              <select
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                value={filters.dateRange}
                onChange={(e) => setFilters({ dateRange: e.target.value as any })}
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
              <Button
                onClick={refreshData}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Loading...' : 'Refresh'}
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-red-800">{error}</div>
            </div>
          )}

          {/* Metric Selection */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            {[
              'organicTraffic',
              'keywordPositions',
              'backlinks',
              'pageSpeed',
              'mobileUsability',
              'overallScore'
            ].map((metric) => (
              <Button
                key={metric}
                variant={selectedMetric === metric ? 'default' : 'outline'}
                onClick={() => setSelectedMetric(metric as any)}
                className="flex flex-col items-center gap-2 h-auto p-3"
              >
                {getMetricIcon(metric)}
                <span className="text-xs text-center">{getMetricLabel(metric)}</span>
              </Button>
            ))}
          </div>

          {/* Trend Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {getMetricLabel(selectedMetric)}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {filters.dateRange === '7d' ? 'Last 7 days' :
                       filters.dateRange === '30d' ? 'Last 30 days' :
                       filters.dateRange === '90d' ? 'Last 90 days' : 'Last year'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getTrendIcon(selectedTrendData.direction as 'up' | 'down' | 'stable')}
                    <Badge className={
                      selectedTrendData.direction === 'up' ? 'bg-green-100 text-green-800' :
                      selectedTrendData.direction === 'down' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }>
                      {selectedTrendData.change > 0 ? '+' : ''}{selectedTrendData.change.toFixed(1)}%
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  {trends.slice(-5).map((trend, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {new Date(trend.date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${getMetricColor(selectedMetric).split(' ')[0]}`}
                            style={{ width: `${Math.min((trend[selectedMetric] as number) / 100 * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {typeof trend[selectedMetric] === 'number' ? trend[selectedMetric].toLocaleString() : trend[selectedMetric]}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Summary</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { metric: 'organicTraffic', label: 'Traffic Growth', icon: Target },
                    { metric: 'keywordPositions', label: 'Position Gain', icon: TrendingUp },
                    { metric: 'pageSpeed', label: 'Speed Score', icon: Zap },
                    { metric: 'mobileUsability', label: 'Mobile Score', icon: Smartphone }
                  ].map(({ metric, label, icon: Icon }) => {
                    const trend = getTrendData(metric as keyof SEOTrendData)
                    const currentValue = trends.length > 0 ? trends[trends.length - 1][metric as keyof SEOTrendData] : 0
                    return (
                      <div key={metric} className="flex items-center gap-3">
                        <Icon className="w-5 h-5 text-gray-400" />
                        <div className="flex-1">
                          <div className="text-sm text-gray-600">{label}</div>
                          <div className="text-sm font-medium text-gray-900">
                            {typeof currentValue === 'number' ? currentValue.toLocaleString() : currentValue}
                          </div>
                        </div>
                        {getTrendIcon(trend.direction as 'up' | 'down' | 'stable')}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Trend Data */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Historical Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Organic Traffic
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Keyword Positions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Backlinks
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Page Speed
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mobile Usability
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Overall Score
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {trends.map((trend, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(trend.date).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {trend.organicTraffic.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {trend.keywordPositions.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {trend.backlinks.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {trend.pageSpeed}%
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {trend.mobileUsability}%
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {trend.overallScore}%
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {trends.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-500">
                  No trend data available for the selected period.
                </div>
              )}
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}

export default TrendAnalysis