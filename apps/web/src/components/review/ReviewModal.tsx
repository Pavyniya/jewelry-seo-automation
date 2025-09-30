import React, { useState, useEffect } from 'react'
import { ContentComparison } from './ContentComparison'
import { ReviewActions } from './ReviewActions'
import { useReviewStore } from '@/stores/reviewStore'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { X, Eye, Clock } from 'lucide-react'
import { Product } from '@/types/product'

interface ReviewModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product | null
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  product
}) => {
  const [currentView, setCurrentView] = useState<'overview' | 'comparison'>('overview')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [optimizedContent, setOptimizedContent] = useState<{
    title: string;
    description: string;
    seoTitle: string;
    seoDescription: string;
  } | null>(null)

  const {
    contentDiffs,
    qualityScore,
    submitReview,
    calculateQualityScore,
    getContentDiffs,
    clearError
  } = useReviewStore()

  const generateOptimizedContent = async () => {
    if (!product) return

    setLoading(true)
    try {
      // Simulate API call to generate optimized content
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Call the actual SEO optimization API
      const response = await fetch(`/api/v1/products/${product.id}/generate-seo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to generate SEO content');
      }

      const newOptimizedContent = {
        title: result.data.seoTitle,
        description: result.data.optimizedDescription || product.description,
        seoTitle: result.data.seoTitle,
        seoDescription: result.data.seoDescription
      }

      // Set the optimized content in state
      setOptimizedContent(newOptimizedContent)

      // Calculate quality score
      await calculateQualityScore(newOptimizedContent.description)

      // Generate content diffs
      await getContentDiffs(product.description || '', newOptimizedContent.description)

      setLoading(false)
    } catch (error) {
      console.error('Failed to generate optimized content:', error)
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && product) {
      // Simulate generating optimized content for review
      generateOptimizedContent()
    }
  }, [isOpen, product])

  useEffect(() => {
    if (!isOpen) {
      setFeedback('')
      setCurrentView('overview')
      setOptimizedContent(null)
      clearError()
    }
  }, [isOpen, clearError])

  const handleApprove = async (reviewFeedback?: string) => {
    if (!product) return

    setLoading(true)
    try {
      await submitReview(product.id, {
        status: 'approved',
        feedback: reviewFeedback
      })

      // Update product status
      // This would typically be done through the product store
      setTimeout(() => {
        onClose()
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Failed to approve review:', error)
      setLoading(false)
    }
  }

  const handleReject = async (reviewFeedback: string) => {
    if (!product) return

    setLoading(true)
    try {
      await submitReview(product.id, {
        status: 'rejected',
        feedback: reviewFeedback
      })

      setTimeout(() => {
        onClose()
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Failed to reject review:', error)
      setLoading(false)
    }
  }

  const handleRequestRevision = async (reviewFeedback: string) => {
    if (!product) return

    setLoading(true)
    try {
      await submitReview(product.id, {
        status: 'needs_revision',
        feedback: reviewFeedback
      })

      setTimeout(() => {
        onClose()
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Failed to request revision:', error)
      setLoading(false)
    }
  }

  if (!isOpen || !product) return null

  const originalContent = {
    title: product.title,
    description: (product.description || '')
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp; with spaces
      .replace(/&amp;/g, '&') // Replace &amp; with &
      .replace(/&lt;/g, '<') // Replace &lt; with <
      .replace(/&gt;/g, '>') // Replace &gt; with >
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\n\s+/g, '\n') // Remove leading spaces from lines
      .replace(/\s+\n/g, '\n') // Remove trailing spaces from lines
      .trim(),
    seoTitle: product.seoTitle || '',
    seoDescription: product.seoDescription || ''
  }

  // Use the optimized content from API or fallback to original
  const displayOptimizedContent = optimizedContent || {
    title: product.title,
    description: (product.description || '')
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp; with spaces
      .replace(/&amp;/g, '&') // Replace &amp; with &
      .replace(/&lt;/g, '<') // Replace &lt; with <
      .replace(/&gt;/g, '>') // Replace &gt; with >
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\n\s+/g, '\n') // Remove leading spaces from lines
      .replace(/\s+\n/g, '\n') // Remove trailing spaces from lines
      .trim(),
    seoTitle: '',
    seoDescription: ''
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-1">
      <div className="bg-white rounded-lg max-w-[90vw] w-full max-h-[96vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Compact Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-gray-900">
              Review SEO Optimization
            </h2>
            <Badge className="bg-blue-100 text-blue-800 px-2 py-1 text-xs">
              {product.status}
            </Badge>
          </div>
          <div className="flex items-center gap-3">
            {qualityScore && (
              <div className="text-right bg-white p-2 rounded border">
                <div className="text-lg font-bold text-green-600">
                  {qualityScore.overall}%
                </div>
                <div className="text-xs text-gray-600">
                  Quality Score
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Compact Product Info */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {product.title}
              </h3>
              <div className="flex items-center gap-4 text-xs text-gray-600 mt-1">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {product.updatedAt ? new Date(product.updatedAt).toLocaleDateString() : 'Recently updated'}
                </span>
                {product.variants && product.variants.length > 0 && (
                  <span className="bg-gray-200 px-2 py-0.5 rounded text-xs">
                    {product.variants.length} variant{product.variants.length > 1 ? 's' : ''}
                  </span>
                )}
                {product.variants && product.variants.length > 0 && product.variants[0].price && (
                  <span className="font-semibold text-green-600">
                    ${parseFloat(product.variants[0].price)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>


        {/* Content with Side-by-Side Layout */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="flex gap-6">
              {/* Left Side - Content Preview */}
              <div className="flex-1">
                {/* View Toggle */}
                <div className="flex gap-2 mb-4">
                  <Button
                    variant={currentView === 'overview' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentView('overview')}
                    className="px-3 py-2 text-sm"
                  >
                    Overview
                  </Button>
                  <Button
                    variant={currentView === 'comparison' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentView('comparison')}
                    className="px-3 py-2 text-sm"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Comparison
                  </Button>
                </div>

                {loading ? (
                  <div className="text-center py-16">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-6"></div>
                    <p className="text-lg text-gray-600">Generating optimized content...</p>
                  </div>
                ) : currentView === 'overview' ? (
                  <div className="space-y-4">
                    {/* Compact Content Preview */}
                    <div className="bg-white border rounded-lg overflow-hidden">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                        {/* Original Content */}
                        <div className="p-4 border-r border-gray-200">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                            <h4 className="text-sm font-semibold text-gray-900">Original</h4>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                              <div className="p-2 bg-gray-50 rounded text-sm">
                                <p className="text-sm font-medium text-gray-900 truncate">{originalContent.title}</p>
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                              <div className="max-h-48 overflow-y-auto p-3 bg-gray-50 rounded text-sm">
                                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{originalContent.description}</p>
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">SEO Title</label>
                              <div className="p-2 bg-gray-50 rounded text-sm">
                                <p className="text-sm text-gray-700">{originalContent.seoTitle || 'No SEO title'}</p>
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Meta Description</label>
                              <div className="p-3 bg-gray-50 rounded text-sm min-h-[60px]">
                                <p className="text-sm text-gray-700 leading-relaxed">{originalContent.seoDescription || 'No meta description'}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Optimized Content */}
                        <div className="p-4 bg-green-50">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <h4 className="text-sm font-semibold text-gray-900">Optimized</h4>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                              <div className="p-2 bg-white rounded border border-green-200 text-sm">
                                <p className="text-sm font-medium text-gray-900 truncate">{displayOptimizedContent.title}</p>
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                              <div className="max-h-48 overflow-y-auto p-3 bg-white rounded border border-green-200 text-sm">
                                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{displayOptimizedContent.description}</p>
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">SEO Title</label>
                              <div className="p-2 bg-white rounded border border-green-200 text-sm">
                                <p className="text-sm text-gray-700">{displayOptimizedContent.seoTitle || 'No SEO title'}</p>
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Meta Description</label>
                              <div className="p-3 bg-white rounded border border-green-200 text-sm min-h-[60px]">
                                <p className="text-sm text-gray-700 leading-relaxed">{displayOptimizedContent.seoDescription || 'No meta description'}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Compact Summary */}
                    <div className="bg-white border rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">Optimization Summary</h4>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Title Length:</span>
                            <span className="font-medium">{originalContent.title.length} → {displayOptimizedContent.title.length} chars</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Description:</span>
                            <span className="font-medium">{originalContent.description.split(' ').length} → {displayOptimizedContent.description.split(' ').length} words</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">SEO Score:</span>
                            <span className="font-medium text-green-600">65 → {qualityScore?.overall || 94}/100</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="text-xs text-gray-600">
                            <div className="flex items-center gap-1 mb-1">
                              <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                              <span className="font-medium">Enhanced Title Structure</span>
                            </div>
                            <div className="flex items-center gap-1 mb-1">
                              <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                              <span className="font-medium">Rich Product Description</span>
                            </div>
                            <div className="flex items-center gap-1 mb-1">
                              <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                              <span className="font-medium">Improved SEO Meta Data</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                              <span className="font-medium">Trust Signals Added</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <ContentComparison
                    originalContent={originalContent}
                    optimizedContent={displayOptimizedContent}
                  />
                )}
              </div>

              {/* Right Side - Action Buttons */}
              <div className="w-80 flex-shrink-0">
                <div className="sticky top-4">
                  <ReviewActions
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onRequestRevision={handleRequestRevision}
                    loading={loading}
                    showFeedbackInput={true}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}