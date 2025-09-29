import React, { useState } from 'react'
import { ReviewStatus } from '@jewelry-seo/shared/types/review'
import { Textarea } from './Textarea'
import { cn } from '@/utils/cn'

interface ReviewActionsProps {
  reviewId: string
  currentStatus: ReviewStatus
  // eslint-disable-next-line no-unused-vars
  onSubmit: (reviewId: string, action: 'approved' | 'rejected' | 'needs_revision', feedback?: string) => Promise<void>
  loading?: boolean
  className?: string
}

export const ReviewActions: React.FC<ReviewActionsProps> = ({
  reviewId,
  currentStatus,
  onSubmit,
  loading = false,
  className = ''
}) => {
  const [selectedAction, setSelectedAction] = useState<'approved' | 'rejected' | 'needs_revision' | null>(null)
  const [feedback, setFeedback] = useState('')
  const [showFeedback, setShowFeedback] = useState(false)

  const actionConfig = {
    approved: {
      label: 'Approve',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
      bgColor: 'bg-green-600 hover:bg-green-700',
      textColor: 'text-green-600',
      borderColor: 'border-green-200',
      description: 'Approve the content optimization'
    },
    rejected: {
      label: 'Reject',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
      bgColor: 'bg-red-600 hover:bg-red-700',
      textColor: 'text-red-600',
      borderColor: 'border-red-200',
      description: 'Reject the content optimization'
    },
    needs_revision: {
      label: 'Request Revision',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bgColor: 'bg-yellow-600 hover:bg-yellow-700',
      textColor: 'text-yellow-600',
      borderColor: 'border-yellow-200',
      description: 'Request changes to the optimization'
    }
  }

  const handleSubmit = async () => {
    if (!selectedAction) return

    try {
      await onSubmit(reviewId, selectedAction, feedback)
      setSelectedAction(null)
      setFeedback('')
      setShowFeedback(false)
    } catch (error) {
      // Error handling is done by the parent component
    }
  }

  const handleActionSelect = (action: 'approved' | 'rejected' | 'needs_revision') => {
    setSelectedAction(action)
    setShowFeedback(action !== 'approved')
  }

  const isDisabled = loading || currentStatus !== 'pending'

  return (
    <div className={cn('space-y-4', className)}>
      {/* Current Status */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <span className="text-sm font-medium text-gray-700">
          Current Status:
        </span>
        <span className={cn(
          'px-2 py-1 text-xs font-medium rounded-full',
          currentStatus === 'approved' && 'bg-green-100 text-green-800',
          currentStatus === 'rejected' && 'bg-red-100 text-red-800',
          currentStatus === 'needs_revision' && 'bg-yellow-100 text-yellow-800',
          currentStatus === 'pending' && 'bg-blue-100 text-blue-800'
        )}>
          {currentStatus.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      {/* Action Selection */}
      {currentStatus === 'pending' && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-900">
            Review Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(['approved', 'rejected', 'needs_revision'] as const).map((action) => {
              const config = actionConfig[action]
              return (
                <button
                  key={action}
                  onClick={() => handleActionSelect(action)}
                  disabled={isDisabled}
                  className={cn(
                    'p-3 border rounded-lg text-left transition-all duration-200',
                    selectedAction === action
                      ? `border-transparent ${config.bgColor} text-white`
                      : `border-gray-200 hover:border-gray-300 ${config.textColor}`,
                    isDisabled && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className={selectedAction === action ? 'text-white' : config.textColor}>
                      {config.icon}
                    </div>
                    <span className="font-medium text-sm">
                      {config.label}
                    </span>
                  </div>
                  <p className={cn(
                    'text-xs mt-1',
                    selectedAction === action ? 'text-gray-100' : 'text-gray-600'
                  )}>
                    {config.description}
                  </p>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Feedback Input */}
      {showFeedback && selectedAction && (
        <div className={cn(
          'p-4 border rounded-lg',
          selectedAction === 'rejected' && 'border-red-200 bg-red-50',
          selectedAction === 'needs_revision' && 'border-yellow-200 bg-yellow-50'
        )}>
          <Textarea
            label={selectedAction === 'rejected' ? 'Rejection Reason' : 'Revision Feedback'}
            placeholder={selectedAction === 'rejected'
              ? 'Please explain why you are rejecting this optimization...'
              : 'Please provide specific feedback for the revision...'
            }
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            required={selectedAction !== 'approved'}
            charCount={{
              current: feedback.length,
              max: 1000
            }}
            rows={4}
            disabled={loading}
          />
        </div>
      )}

      {/* Action Buttons */}
      {selectedAction && (
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <button
            onClick={() => {
              setSelectedAction(null)
              setFeedback('')
              setShowFeedback(false)
            }}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              loading ||
              (selectedAction !== 'approved' && !feedback.trim()) ||
              (selectedAction !== 'approved' && feedback.length > 1000)
            }
            className={cn(
              'px-4 py-2 text-sm font-medium text-white rounded-md disabled:opacity-50',
              actionConfig[selectedAction].bgColor
            )}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {actionConfig[selectedAction].label}ing...
              </div>
            ) : (
              `Confirm ${actionConfig[selectedAction].label}`
            )}
          </button>
        </div>
      )}

      {/* Status Messages */}
      {currentStatus !== 'pending' && (
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <svg className="w-8 h-8 mx-auto text-blue-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-blue-800">
            This review has already been {currentStatus.replace('_', ' ')} and cannot be modified.
          </p>
        </div>
      )}
    </div>
  )
}