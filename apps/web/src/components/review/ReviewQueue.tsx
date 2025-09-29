import React, { useEffect, useState } from 'react'
import { ReviewQueueItem } from '@jewelry-seo/shared/types/review'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatDistanceToNow } from 'date-fns'

interface ReviewQueueProps {
  items: ReviewQueueItem[]
  // eslint-disable-next-line no-unused-vars
  onReview: (itemId: string) => void
  loading?: boolean
  className?: string
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-800'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800'
    case 'low':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const formatEstimatedTime = (minutes: number) => {
  if (minutes < 60) {
    return `${minutes}m`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
}

export const ReviewQueue: React.FC<ReviewQueueProps> = ({
  items,
  onReview,
  loading = false,
  className = ''
}) => {
  const [filteredItems, setFilteredItems] = useState<ReviewQueueItem[]>(items)
  const [selectedPriority, setSelectedPriority] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'priority' | 'submittedAt' | 'estimatedTime'>('priority')

  useEffect(() => {
    let filtered = [...items]

    // Filter by priority
    if (selectedPriority !== 'all') {
      filtered = filtered.filter(item => item.priority === selectedPriority)
    }

    // Sort items
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'priority': {
          const priorityOrder = { high: 3, medium: 2, low: 1 }
          return priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder]
        }
        case 'submittedAt':
          return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
        case 'estimatedTime':
          return a.estimatedReviewTime - b.estimatedReviewTime
        default:
          return 0
      }
    })

    setFilteredItems(filtered)
  }, [items, selectedPriority, sortBy])

  const priorityCounts = {
    high: items.filter(item => item.priority === 'high').length,
    medium: items.filter(item => item.priority === 'medium').length,
    low: items.filter(item => item.priority === 'low').length,
    all: items.length
  }

  return (
    <div className={className}>
      <Card title="Review Queue">
        <div className="space-y-6">
          {/* Stats Summary */}
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{priorityCounts.all}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{priorityCounts.high}</div>
              <div className="text-sm text-red-600">High Priority</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{priorityCounts.medium}</div>
              <div className="text-sm text-yellow-600">Medium Priority</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{priorityCounts.low}</div>
              <div className="text-sm text-green-600">Low Priority</div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Priority
              </label>
              <div className="flex gap-2">
                {(['all', 'high', 'medium', 'low'] as const).map(priority => (
                  <Button
                    key={priority}
                    variant={selectedPriority === priority ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedPriority(priority)}
                    className="capitalize"
                  >
                    {priority} ({priorityCounts[priority]})
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              >
                <option value="priority">Priority</option>
                <option value="submittedAt">Submission Time</option>
                <option value="estimatedTime">Estimated Review Time</option>
              </select>
            </div>
          </div>

          {/* Queue Items */}
          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-600">Loading review queue...</div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-600">No reviews in queue</div>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {item.productName}
                        </h3>
                        <Badge className={getPriorityColor(item.priority)}>
                          {item.priority} priority
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>
                          Submitted {formatDistanceToNow(new Date(item.submittedAt), { addSuffix: true })}
                        </span>
                        <span>•</span>
                        <span>~{formatEstimatedTime(item.estimatedReviewTime)} review time</span>
                        {item.assignedTo && (
                          <>
                            <span>•</span>
                            <span>Assigned to {item.assignedTo}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      <Button
                        onClick={() => onReview(item.id)}
                        size="sm"
                      >
                        Start Review
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && items.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg
                  className="mx-auto h-12 w-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No pending reviews
              </h3>
              <p className="text-gray-600">
                All content has been reviewed. Great job!
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}