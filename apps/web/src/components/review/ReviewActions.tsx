import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Textarea } from '@/components/ui/Textarea'

interface ReviewActionsProps {
  // eslint-disable-next-line no-unused-vars
  onApprove: (_feedback?: string) => void
  // eslint-disable-next-line no-unused-vars
  onReject: (_feedback: string) => void
  // eslint-disable-next-line no-unused-vars
  onRequestRevision: (_feedback: string) => void
  loading?: boolean
  showFeedbackInput?: boolean
  className?: string
}

export const ReviewActions: React.FC<ReviewActionsProps> = ({
  onApprove,
  onReject,
  onRequestRevision,
  loading = false,
  showFeedbackInput = false,
  className = ''
}) => {
  const [feedback, setFeedback] = useState('')
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'revision' | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  const handleApprove = () => {
    if (showFeedbackInput) {
      setActionType('approve')
      setShowConfirmDialog(true)
    } else {
      onApprove()
    }
  }

  const handleReject = () => {
    if (!feedback.trim()) {
      alert('Please provide feedback for rejection')
      return
    }
    setActionType('reject')
    setShowConfirmDialog(true)
  }

  const handleRequestRevision = () => {
    if (!feedback.trim()) {
      alert('Please provide feedback for revision request')
      return
    }
    setActionType('revision')
    setShowConfirmDialog(true)
  }

  const confirmAction = () => {
    switch (actionType) {
      case 'approve':
        onApprove(feedback || undefined)
        break
      case 'reject':
        onReject(feedback)
        break
      case 'revision':
        onRequestRevision(feedback)
        break
    }
    setShowConfirmDialog(false)
    setFeedback('')
    setActionType(null)
  }

  const cancelAction = () => {
    setShowConfirmDialog(false)
    setActionType(null)
  }

  const getActionConfig = (action: 'approve' | 'reject' | 'revision') => {
    switch (action) {
      case 'approve':
        return {
          title: 'Approve Content',
          message: 'Are you sure you want to approve this content? This will make it live on your store.',
          confirmText: 'Approve',
          confirmVariant: 'default' as const,
          icon: '✓'
        }
      case 'reject':
        return {
          title: 'Reject Content',
          message: 'Are you sure you want to reject this content? This will discard the AI optimizations.',
          confirmText: 'Reject',
          confirmVariant: 'destructive' as const,
          icon: '✕'
        }
      case 'revision':
        return {
          title: 'Request Revision',
          message: 'Are you sure you want to request a revision? The AI will regenerate the content based on your feedback.',
          confirmText: 'Request Revision',
          confirmVariant: 'outline' as const,
          icon: '↻'
        }
    }
  }

  return (
    <div className={className}>
      <Card title="Review Actions">
        <div className="space-y-4">
          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleApprove}
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <span className="mr-2">✓</span>
              Approve
            </Button>
            <Button
              onClick={handleRequestRevision}
              disabled={loading}
              variant="outline"
              className="flex-1"
            >
              <span className="mr-2">↻</span>
              Request Revision
            </Button>
            <Button
              onClick={handleReject}
              disabled={loading}
              variant="destructive"
              className="flex-1"
            >
              <span className="mr-2">✕</span>
              Reject
            </Button>
          </div>

          {/* Feedback Input */}
          {(showFeedbackInput || actionType) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Feedback {actionType === 'reject' || actionType === 'revision' ? '(Required)' : '(Optional)'}
              </label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder={
                  actionType === 'reject'
                    ? 'Please explain why you are rejecting this content...'
                    : actionType === 'revision'
                    ? 'Please provide specific feedback for revision...'
                    : 'Add any notes or suggestions (optional)...'
                }
                rows={4}
                className="w-full"
                disabled={loading}
              />
              <div className="mt-1 text-sm text-gray-500">
                {feedback.length}/500 characters
              </div>
            </div>
          )}

          {/* Action Guidelines */}
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>Approve:</strong> Content meets quality standards and brand voice</p>
            <p><strong>Request Revision:</strong> Content needs improvements but has potential</p>
            <p><strong>Reject:</strong> Content is unsuitable and should be discarded</p>
          </div>
        </div>
      </Card>

      {/* Confirmation Dialog */}
      {showConfirmDialog && actionType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-3">{getActionConfig(actionType).icon}</span>
              <h3 className="text-lg font-semibold">{getActionConfig(actionType).title}</h3>
            </div>
            <p className="text-gray-600 mb-6">{getActionConfig(actionType).message}</p>

            {feedback && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Feedback:
                </label>
                <div className="bg-gray-50 p-3 rounded text-sm">
                  {feedback}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={confirmAction}
                variant={getActionConfig(actionType).confirmVariant}
                disabled={loading}
                className="flex-1"
              >
                {getActionConfig(actionType).confirmText}
              </Button>
              <Button
                onClick={cancelAction}
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