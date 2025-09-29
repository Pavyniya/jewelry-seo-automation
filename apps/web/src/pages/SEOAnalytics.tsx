import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  BarChart3,
  Search,
  Users,
  TrendingUp,
  Target,
  Download,
  RefreshCw,
  Settings
} from 'lucide-react'
import KeywordTracking from '@/components/analytics/KeywordTracking'
import CompetitorAnalysis from '@/components/analytics/CompetitorAnalysis'
import TrendAnalysis from '@/components/analytics/TrendAnalysis'
import { useAnalyticsStore } from '@/stores/analyticsStore'

const SEOAnalytics: React.FC = () => {
  const {
    performance,
    loading,
    error,
    filters,
    setFilters,
    refreshData,
    lastUpdated
  } = useAnalyticsStore()

  const [activeTab, setActiveTab] = useState('overview')

  const isRefreshing = loading && !!lastUpdated

  const overviewStats = [
    {
      name: 'Total Keywords',
      value: performance ? performance.impressions.toLocaleString() : '0',
      change: '+12.5%',
      changeType: 'positive' as const,
      icon: Search,
    },
    {
      name: 'Organic Traffic',
      value: performance ? `${performance.ctr.toFixed(1)}%` : '0%',
      change: '+2.1%',
      changeType: 'positive' as const,
      icon: Target,
    },
    {
      name: 'Avg. Position',
      value: '#18.5',
      change: '-3.2',
      changeType: 'positive' as const,
      icon: TrendingUp,
    },
    {
      name: 'Competitors',
      value: '24',
      change: '+4',
      changeType: 'positive' as const,
      icon: Users,
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">SEO Analytics & Insights</h1>
            <p className="text-gray-600 mt-1">
              Track keyword performance, analyze competitors, and monitor SEO trends
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-gray-600">Last Updated</div>
              <div className="text-sm font-medium">
                {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : 'Never'}
              </div>
            </div>

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
              disabled={isRefreshing}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </Button>

            <Button variant="outline" className="flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </Button>

            <Button variant="outline" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="text-red-800 font-medium">Error:</div>
              <div className="text-red-700">{error}</div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1 mb-6">
          <div className="grid grid-cols-4 gap-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('keywords')}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'keywords'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Search className="w-4 h-4" />
              Keywords
            </button>
            <button
              onClick={() => setActiveTab('competitors')}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'competitors'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Users className="w-4 h-4" />
              Competitors
            </button>
            <button
              onClick={() => setActiveTab('trends')}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'trends'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Trends
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {overviewStats.map((stat) => (
                <Card key={stat.name}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      {stat.name}
                    </CardTitle>
                    <stat.icon className="h-4 w-4 text-gray-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                    <p className={`text-xs flex items-center gap-1 ${
                      stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.changeType === 'positive' ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingUp className="h-3 w-3 rotate-180" />
                      )}
                      {stat.change} from previous period
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Performance Overview */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {performance && (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Total Impressions</span>
                          <span className="text-sm font-medium text-gray-900">
                            {performance.impressions.toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: '75%' }} />
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Click-Through Rate</span>
                          <span className="text-sm font-medium text-gray-900">
                            {performance.ctr.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: '65%' }} />
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Average Position</span>
                          <span className="text-sm font-medium text-gray-900">
                            #{performance.position.toFixed(1)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '45%' }} />
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Total Clicks</span>
                          <span className="text-sm font-medium text-gray-900">
                            {performance.clicks.toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-purple-500 h-2 rounded-full" style={{ width: '85%' }} />
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button className="w-full justify-start" variant="outline">
                      <Search className="w-4 h-4 mr-2" />
                      Track New Keywords
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Users className="w-4 h-4 mr-2" />
                      Add Competitor
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Generate Report
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Export Data
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent SEO Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <div className="text-sm font-medium">Keyword "diamond engagement rings" moved to position 3</div>
                        <div className="text-xs text-gray-600">2 hours ago</div>
                      </div>
                    </div>
                    <Badge>+2 positions</Badge>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div>
                        <div className="text-sm font-medium">New competitor added: jewelry-store.com</div>
                        <div className="text-xs text-gray-600">5 hours ago</div>
                      </div>
                    </div>
                    <Badge>Competitor</Badge>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <div>
                        <div className="text-sm font-medium">Organic traffic increased by 15%</div>
                        <div className="text-xs text-gray-600">1 day ago</div>
                      </div>
                    </div>
                    <Badge>+15%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'keywords' && (
          <KeywordTracking />
        )}

        {activeTab === 'competitors' && (
          <CompetitorAnalysis />
        )}

        {activeTab === 'trends' && (
          <TrendAnalysis />
        )}
      </div>
    </div>
  )
}

export default SEOAnalytics