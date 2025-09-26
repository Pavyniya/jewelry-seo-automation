import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Search, TrendingUp, TrendingDown, Minus, Plus, ExternalLink } from 'lucide-react'
import { useAnalyticsStore } from '@/stores/analyticsStore'
import { KeywordData } from '@/types/analytics'

interface KeywordTrackingProps {
  className?: string
}

const KeywordTracking: React.FC<KeywordTrackingProps> = ({ className }) => {
  const {
    keywords,
    loading,
    error,
    filters,
    setFilters,
    refreshData
  } = useAnalyticsStore()

  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'position' | 'traffic' | 'difficulty'>('position')
  const [showAddKeyword, setShowAddKeyword] = useState(false)
  const [newKeyword, setNewKeyword] = useState('')

  useEffect(() => {
    refreshData()
  }, [filters.dateRange])

  const filteredKeywords = keywords.filter(keyword =>
    keyword.keyword.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => {
    switch (sortBy) {
      case 'position':
        return a.position - b.position
      case 'traffic':
        return b.traffic - a.traffic
      case 'difficulty':
        return a.difficulty - b.difficulty
      default:
        return 0
    }
  })

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-600" />
      default:
        return <Minus className="w-4 h-4 text-gray-400" />
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600 bg-green-50'
      case 'down':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getPositionColor = (position: number) => {
    if (position <= 3) return 'text-green-600'
    if (position <= 10) return 'text-blue-600'
    if (position <= 20) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 30) return 'text-green-600'
    if (difficulty <= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const handleAddKeyword = async () => {
    if (!newKeyword.trim()) return

    try {
      const response = await fetch('/api/v1/analytics/keywords', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ keyword: newKeyword })
      })

      if (response.ok) {
        setNewKeyword('')
        setShowAddKeyword(false)
        refreshData()
      }
    } catch (error) {
      console.error('Failed to add keyword:', error)
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Keyword Tracking</CardTitle>
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
                variant="outline"
                onClick={() => setShowAddKeyword(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Keyword
              </Button>
              <Button
                onClick={refreshData}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                {loading ? 'Loading...' : 'Refresh'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {showAddKeyword && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter keyword to track..."
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleAddKeyword()}
                />
                <Button onClick={handleAddKeyword}>Add</Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAddKeyword(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Search keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="position">Sort by Position</option>
              <option value="traffic">Sort by Traffic</option>
              <option value="difficulty">Sort by Difficulty</option>
            </select>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-red-800">{error}</div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Keyword
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Volume
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Difficulty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Traffic
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CTR
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trend
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredKeywords.map((keyword) => (
                  <tr key={keyword.keyword} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {keyword.keyword}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${getPositionColor(keyword.position)}`}>
                        #{keyword.position}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {keyword.searchVolume.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${getDifficultyColor(keyword.difficulty)}`}>
                        {keyword.difficulty}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {keyword.traffic.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {keyword.ctr.toFixed(1)}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getTrendIcon(keyword.trend)}
                        <Badge className={getTrendColor(keyword.trend)}>
                          {keyword.change > 0 ? '+' : ''}{keyword.change}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredKeywords.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              No keywords found. Add keywords to start tracking.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default KeywordTracking