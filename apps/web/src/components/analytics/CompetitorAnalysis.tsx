import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import {
  Users,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Plus,
  Search,
  Globe,
  Target,
  Award
} from 'lucide-react'
import { useAnalyticsStore } from '@/stores/analyticsStore'
import { CompetitorData } from '@/types/analytics'

interface CompetitorAnalysisProps {
  className?: string
}

const CompetitorAnalysis: React.FC<CompetitorAnalysisProps> = ({ className }) => {
  const {
    competitors,
    loading,
    error,
    filters,
    setFilters,
    refreshData
  } = useAnalyticsStore()

  const [searchTerm, setSearchTerm] = useState('')
  const [showAddCompetitor, setShowAddCompetitor] = useState(false)
  const [newCompetitorDomain, setNewCompetitorDomain] = useState('')
  const [selectedCompetitor, setSelectedCompetitor] = useState<CompetitorData | null>(null)

  useEffect(() => {
    refreshData()
  }, [filters.dateRange])

  const filteredCompetitors = competitors.filter(competitor =>
    competitor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    competitor.domain.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getAuthorityColor = (authority: number) => {
    if (authority >= 80) return 'text-green-600 bg-green-50'
    if (authority >= 60) return 'text-blue-600 bg-blue-50'
    if (authority >= 40) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const getOverlapColor = (overlap: number) => {
    if (overlap >= 70) return 'text-red-600 bg-red-50'
    if (overlap >= 40) return 'text-yellow-600 bg-yellow-50'
    return 'text-green-600 bg-green-50'
  }

  const handleAddCompetitor = async () => {
    if (!newCompetitorDomain.trim()) return

    try {
      const response = await fetch('/api/v1/analytics/competitors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ domain: newCompetitorDomain })
      })

      if (response.ok) {
        setNewCompetitorDomain('')
        setShowAddCompetitor(false)
        refreshData()
      }
    } catch (error) {
      console.error('Failed to add competitor:', error)
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Competitor Analysis</CardTitle>
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
                onClick={() => setShowAddCompetitor(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Competitor
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
          {showAddCompetitor && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter competitor domain (e.g., competitor.com)"
                  value={newCompetitorDomain}
                  onChange={(e) => setNewCompetitorDomain(e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleAddCompetitor()}
                />
                <Button onClick={handleAddCompetitor}>Add</Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAddCompetitor(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Search competitors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-red-800">{error}</div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Competitors List */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Competitors</h3>
              {filteredCompetitors.map((competitor) => (
                <Card key={competitor.domain} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">{competitor.name}</h4>
                        <p className="text-sm text-gray-600">{competitor.domain}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedCompetitor(competitor)}
                        className="flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Details
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-xs text-gray-600">Authority</div>
                          <div className={`text-sm font-medium ${getAuthorityColor(competitor.authority).split(' ')[0]}`}>
                            {competitor.authority}/100
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-xs text-gray-600">Traffic</div>
                          <div className="text-sm font-medium text-gray-900">
                            {competitor.traffic.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-xs text-gray-600">Keywords</div>
                          <div className="text-sm font-medium text-gray-900">
                            {competitor.keywords.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-xs text-gray-600">Overlap</div>
                          <div className={`text-sm font-medium ${getOverlapColor(competitor.overlap).split(' ')[0]}`}>
                            {competitor.overlap}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Competitor Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Competitor Details</h3>
              {selectedCompetitor ? (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-semibold text-gray-900">{selectedCompetitor.name}</h4>
                        <p className="text-sm text-gray-600">{selectedCompetitor.domain}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Visit
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Top Keywords</h5>
                        <div className="space-y-2">
                          {selectedCompetitor.topKeywords.slice(0, 5).map((keyword, index) => (
                            <div key={index} className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">{keyword.keyword}</span>
                              <div className="flex items-center gap-2">
                                <Badge>#{keyword.position}</Badge>
                                <span className="text-sm text-gray-600">{keyword.traffic.toLocaleString()}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Shared Keywords</h5>
                        <div className="flex flex-wrap gap-2">
                          {selectedCompetitor.sharedKeywords.slice(0, 8).map((keyword, index) => (
                            <Badge key={index} className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No Competitor Selected</h4>
                    <p className="text-gray-600">Select a competitor to view detailed analysis</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {filteredCompetitors.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              No competitors found. Add competitors to start analysis.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default CompetitorAnalysis