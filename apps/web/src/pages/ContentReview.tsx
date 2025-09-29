import React, { useEffect, useState } from 'react'
import { useReviewStore } from '@/stores/reviewStore'
import { ContentComparison } from '@/components/review/ContentComparison'
import { ReviewActions } from '@/components/review/ReviewActions'
import { ContentEditor } from '@/components/review/ContentEditor'
import { QualityScoreComponent } from '@/components/review/QualityScore'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { computeTextDiff } from '@/utils/diff'

interface ContentReviewProps {
  reviewId?: string
}

export const ContentReview: React.FC<ContentReviewProps> = ({ reviewId }) => {
  const {
    currentReview,
    currentVersion,
    contentDiffs,
    qualityScore,
    loading,
    error,
    fetchReview,
    fetchOptimizationVersion,
    getContentDiffs,
    calculateQualityScore,
    submitReview,
    clearError
  } = useReviewStore()

  const [mode, setMode] = useState<'compare' | 'edit'>('compare')
  const [editingContent, setEditingContent] = useState<any>(null)

  useEffect(() => {
    if (reviewId) {
      fetchReview(reviewId)
    }
  }, [reviewId, fetchReview])

  useEffect(() => {
    if (currentReview?.versionId) {
      fetchOptimizationVersion(currentReview.versionId)
    }
  }, [currentReview?.versionId, fetchOptimizationVersion])

  useEffect(() => {
    if (currentVersion) {
      computeTextDiff(
        currentVersion.originalDescription,
        currentVersion.optimizedDescription
      )
      // Update store with computed diffs
      getContentDiffs(currentVersion.originalDescription, currentVersion.optimizedDescription)

      // Calculate quality score
      calculateQualityScore(currentVersion.optimizedDescription)
    }
  }, [currentVersion, getContentDiffs, calculateQualityScore])

  const handleApprove = (feedback?: string) => {
    if (currentReview) {
      submitReview(currentReview.id, {
        status: 'approved',
        feedback,
        editedContent: editingContent
      })
    }
  }

  const handleReject = (feedback: string) => {
    if (currentReview) {
      submitReview(currentReview.id, {
        status: 'rejected',
        feedback,
        editedContent: editingContent
      })
    }
  }

  const handleRequestRevision = (feedback: string) => {
    if (currentReview) {
      submitReview(currentReview.id, {
        status: 'needs_revision',
        feedback,
        editedContent: editingContent
      })
    }
  }

  const handleEdit = (content: any) => {
    setEditingContent(content)
    setMode('edit')
  }

  const handleSaveEdit = (content: any) => {
    setEditingContent(content)
    setMode('compare')
  }

  const handleCancelEdit = () => {
    setEditingContent(null)
    setMode('compare')
  }

  if (loading && !currentReview) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading review...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card title="Error">
          <div className="text-red-600 mb-4">{error}</div>
          <Button onClick={clearError}>Try Again</Button>
        </Card>
      </div>
    )
  }

  if (!currentReview || !currentVersion) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card title="Review Not Found">
          <div className="text-gray-600">The requested review could not be found.</div>
        </Card>
      </div>
    )
  }

  const displayContent = editingContent || {
    title: currentVersion.optimizedTitle,
    description: currentVersion.optimizedDescription,
    seoTitle: currentVersion.optimizedSeoTitle,
    seoDescription: currentVersion.optimizedSeoDescription
  }

  const originalContent = {
    title: currentVersion.originalTitle,
    description: currentVersion.originalDescription,
    seoTitle: currentVersion.originalSeoTitle,
    seoDescription: currentVersion.originalSeoDescription
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Content Review
          </h1>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>Product: {displayContent.title}</span>
            <span>•</span>
            <span>Status: {currentReview.status}</span>
            <span>•</span>
            <span>Reviewer: {currentReview.reviewer}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={mode === 'compare' ? 'default' : 'outline'}
            onClick={() => setMode('compare')}
            size="sm"
          >
            Compare
          </Button>
          <Button
            variant={mode === 'edit' ? 'default' : 'outline'}
            onClick={() => setMode('edit')}
            size="sm"
          >
            Edit
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {mode === 'compare' ? (
            <ContentComparison
              originalContent={originalContent}
              optimizedContent={displayContent}
              diffs={contentDiffs}
              onEdit={handleEdit}
              loading={loading}
            />
          ) : (
            <ContentEditor
              _content={displayContent}
              onSave={handleSaveEdit}
              onCancel={handleCancelEdit}
              loading={loading}
            />
          )}

          {mode === 'compare' && currentReview && (
            <ReviewActions
              onApprove={handleApprove}
              onReject={handleReject}
              onRequestRevision={handleRequestRevision}
              loading={loading}
              showFeedbackInput={true}
            />
          )}
        </div>

        {/* Right Column - Quality Score and Info */}
        <div className="space-y-6">
          {qualityScore && (
            <QualityScoreComponent
              score={qualityScore}
            />
          )}

          <Card title="Review Information">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Review ID
                </label>
                <div className="text-sm text-gray-600">{currentReview.id}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Created
                </label>
                <div className="text-sm text-gray-600">
                  {new Date(currentReview.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  AI Provider
                </label>
                <div className="text-sm text-gray-600">{currentVersion.aiProvider}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Version
                </label>
                <div className="text-sm text-gray-600">#{currentVersion.version}</div>
              </div>
              {currentReview.feedback && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Previous Feedback
                  </label>
                  <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                    {currentReview.feedback}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}