import React, { useState } from 'react'
import { ContentReview, ReviewStatus } from '@jewelry-seo/shared/types/review'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Checkbox } from '@/components/ui/Checkbox'
import { Badge } from '@/components/ui/Badge'

interface BatchReviewProps {
  reviews: ContentReview[]
  // eslint-disable-next-line no-unused-vars
  onBatchAction: (reviewIds: string[], action: 'approve' | 'reject' | 'needs_revision', feedback?: string) => void
  loading?: boolean
  className?: string
}

const getStatusColor = (status: ReviewStatus) => {
  switch (status) {
    case 'pending':
      return 'bg-gray-100 text-gray-800'
    case 'approved':
      return 'bg-green-100 text-green-800'
    case 'rejected':
      return 'bg-red-100 text-red-800'
    case 'needs_revision':
      return 'bg-yellow-100 text-yellow-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export const BatchReview: React.FC<BatchReviewProps> = ({
  reviews,
  onBatchAction,
  loading = false,
  className = ''
}) => {
  const [selectedReviewIds, setSelectedReviewIds] = useState<Set<string>>(new Set())
  const [action, setAction] = useState<'approve' | 'reject' | 'needs_revision' | null>(null)
  const [feedback, setFeedback] = useState('')
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  const allSelected = reviews.length > 0 && selectedReviewIds.size === reviews.length
  const someSelected = selectedReviewIds.size > 0 && !allSelected

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedReviewIds(new Set())
    } else {
      setSelectedReviewIds(new Set(reviews.map(review => review.id)))
    }
  }

  const handleSelectReview = (reviewId: string) => {
    const newSelected = new Set(selectedReviewIds)
    if (newSelected.has(reviewId)) {
      newSelected.delete(reviewId)
    } else {
      newSelected.add(reviewId)
    }
    setSelectedReviewIds(newSelected)
  }

  const handleBatchAction = (batchAction: 'approve' | 'reject' | 'needs_revision') => {
    if (selectedReviewIds.size === 0) {
      alert('Please select at least one review to process')
      return
    }

    setAction(batchAction)
    setShowConfirmDialog(true)
  }

  const confirmBatchAction = () => {
    if (action && selectedReviewIds.size > 0) {
      onBatchAction(
        Array.from(selectedReviewIds),
        action,
        feedback || undefined
      )
      setShowConfirmDialog(false)
      setAction(null)
      setFeedback('')
      setSelectedReviewIds(new Set())
    }
  }

  const cancelBatchAction = () => {
    setShowConfirmDialog(false)
    setAction(null)
    setFeedback('')
  }

  const getActionConfig = (actionType: 'approve' | 'reject' | 'needs_revision') => {
    switch (actionType) {
      case 'approve':
        return {
          title: 'Approve Selected Reviews',
          message: `Are you sure you want to approve ${selectedReviewIds.size} review(s)? This will make the content live on your store.`,
          confirmText: 'Approve',
          confirmVariant: 'default' as const,
          icon: '✓'
        }
      case 'reject':
        return {
          title: 'Reject Selected Reviews',
          message: `Are you sure you want to reject ${selectedReviewIds.size} review(s)? This will discard the AI optimizations.`,
          confirmText: 'Reject',
          confirmVariant: 'destructive' as const,
          icon: '✕'
        }
      case 'needs_revision':
        return {
          title: 'Request Revision for Selected Reviews',
          message: `Are you sure you want to request revision for ${selectedReviewIds.size} review(s)? The AI will regenerate the content based on your feedback.`,
          confirmText: 'Request Revision',
          confirmVariant: 'outline' as const,
          icon: '↻'
        }
    }
  }

  const selectedCount = selectedReviewIds.size
  const statusCounts = reviews.reduce((acc, review) => {
    acc[review.status] = (acc[review.status] || 0) + 1
    return acc
  }, {} as Record<ReviewStatus, number>)

  return (
    <div className={className}>
      <Card title="Batch Review Operations">
        <div className="space-y-6">
          {/* Selection Summary */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">
                  {allSelected ? 'All selected' : someSelected ? 'Some selected' : 'Select all'}
                </span>
                <span className="ml-2 text-sm text-gray-500">
                  ({selectedCount} of {reviews.length})
                </span>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Total: {reviews.length} reviews
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="grid grid-cols-4 gap-4">
            {Object.entries(statusCounts).map(([status, count]) => (
              <div key={status} className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-bold text-gray-900">{count}</div>
                <Badge className={getStatusColor(status as ReviewStatus)}>
                  {status}
                </Badge>
              </div>
            ))}
          </div>

          {/* Batch Actions */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Batch Actions</h3>
            <div className="flex gap-3">
              <Button
                onClick={() => handleBatchAction('approve')}
                disabled={selectedCount === 0 || loading}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <span className="mr-2">✓</span>
                Approve Selected ({selectedCount})
              </Button>
              <Button
                onClick={() => handleBatchAction('needs_revision')}
                disabled={selectedCount === 0 || loading}
                variant="outline"
                className="flex-1"
              >
                <span className="mr-2">↻</span>
                Request Revision ({selectedCount})
              </Button>
              <Button
                onClick={() => handleBatchAction('reject')}
                disabled={selectedCount === 0 || loading}
                variant="destructive"
                className="flex-1"
              >
                <span className="mr-2">✕</span>
                Reject Selected ({selectedCount})
              </Button>
            </div>
          </div>

          {/* Selected Reviews List */}
          {selectedCount > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Selected Reviews</h3>
              <div className="max-h-60 overflow-y-auto space-y-2 border rounded-lg p-3">
                {reviews
                  .filter(review => selectedReviewIds.has(review.id))
                  .map(review => (
                    <div key={review.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedReviewIds.has(review.id)}
                          onCheckedChange={() => handleSelectReview(review.id)}
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            Review #{review.id.slice(-6)}
                          </div>
                          <div className="text-xs text-gray-600">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <Badge className={getStatusColor(review.status)}>
                        {review.status}
                      </Badge>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Guidelines */}
          <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded">
            <h4 className="font-medium mb-2">Batch Processing Guidelines:</h4>
            <ul className="space-y-1">
              <li>• Review content quality before bulk approval</li>
              <li>• Use rejection for content that doesn't meet brand standards</li>
              <li>• Request revision for content with potential but needs improvements</li>
              <li>• Provide specific feedback for better AI-generated content</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Confirmation Dialog */}
      {showConfirmDialog && action && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-3">{getActionConfig(action).icon}</span>
              <h3 className="text-lg font-semibold">{getActionConfig(action).title}</h3>
            </div>
            <p className="text-gray-600 mb-6">{getActionConfig(action).message}</p>

            {action !== 'approve' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Feedback (Optional for approval, required for rejection/revision)
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder={
                    action === 'reject'
                      ? 'Explain why these reviews are being rejected...'
                      : 'Provide feedback for revision...'
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={loading}
                />
                <div className="mt-1 text-xs text-gray-500">
                  {feedback.length}/500 characters
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={confirmBatchAction}
                variant={getActionConfig(action).confirmVariant}
                disabled={loading || (action !== 'approve' && !feedback.trim())}
                className="flex-1"
              >
                {getActionConfig(action).confirmText}
              </Button>
              <Button
                onClick={cancelBatchAction}
                variant="outline"
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}