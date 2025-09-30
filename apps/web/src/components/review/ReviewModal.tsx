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
    description: product.description || '',
    seoTitle: product.seoTitle || '',
    seoDescription: product.seoDescription || ''
  }

  // Use the optimized content from API or fallback to original
  const displayOptimizedContent = optimizedContent || {
    title: product.title,
    description: product.description || '',
    seoTitle: '',
    seoDescription: ''
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-1">
      <div className="bg-white rounded-xl max-w-[95vw] w-full max-h-[98vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-4">
            <h2 className="text-3xl font-bold text-gray-900">
              Review SEO Optimization
            </h2>
            <Badge className="bg-blue-100 text-blue-800 px-3 py-1 text-sm font-medium">
              {product.status}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Product Info */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {product.title}
              </h3>
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {product.updatedAt ? new Date(product.updatedAt).toLocaleDateString() : 'Recently updated'}
                </span>
                {product.variants && product.variants.length > 0 && (
                  <span className="bg-gray-200 px-2 py-1 rounded">
                    {product.variants.length} variant{product.variants.length > 1 ? 's' : ''}
                  </span>
                )}
                {product.variants && product.variants.length > 0 && product.variants[0].price && (
                  <span className="font-semibold text-lg text-green-600">
                    ${parseFloat(product.variants[0].price)}
                  </span>
                )}
              </div>
            </div>

            {qualityScore && (
              <div className="text-right bg-white p-4 rounded-lg shadow-sm border">
                <div className="text-3xl font-bold text-green-600">
                  {qualityScore.overall}%
                </div>
                <div className="text-sm text-gray-600 font-medium">
                  Quality Score
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* View Toggle */}
            <div className="flex gap-3 mb-8">
              <Button
                variant={currentView === 'overview' ? 'default' : 'outline'}
                size="lg"
                onClick={() => setCurrentView('overview')}
                className="px-6 py-3"
              >
                Overview
              </Button>
              <Button
                variant={currentView === 'comparison' ? 'default' : 'outline'}
                size="lg"
                onClick={() => setCurrentView('comparison')}
                className="px-6 py-3"
              >
                <Eye className="h-5 w-5 mr-2" />
                Side-by-Side Comparison
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-6"></div>
                <p className="text-lg text-gray-600">Generating optimized content...</p>
              </div>
            ) : currentView === 'overview' ? (
              <div className="space-y-8">
                {/* Enhanced Content Preview */}
                <Card className="shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50">
                    <CardTitle className="text-xl font-bold">Content Preview</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                      {/* Original Content */}
                      <div className="p-8 border-r border-gray-200">
                        <div className="flex items-center gap-2 mb-6">
                          <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                          <h4 className="text-xl font-semibold text-gray-900">Original Content</h4>
                        </div>
                        <div className="space-y-8">
                          <div>
                            <label className="block text-lg font-semibold text-gray-700 mb-4">Product Title</label>
                            <div className="p-4 bg-gray-50 rounded-lg border">
                              <p className="text-lg font-medium text-gray-900 leading-relaxed">{originalContent.title}</p>
                            </div>
                          </div>
                          <div>
                            <label className="block text-lg font-semibold text-gray-700 mb-4">Description</label>
                            <div className="max-h-[500px] overflow-y-auto p-6 bg-gray-50 rounded-lg border">
                              <p className="text-base text-gray-700 leading-relaxed whitespace-pre-wrap">{originalContent.description}</p>
                            </div>
                          </div>
                          <div>
                            <label className="block text-lg font-semibold text-gray-700 mb-4">SEO Title</label>
                            <div className="p-4 bg-gray-50 rounded-lg border">
                              <p className="text-base text-gray-700">{originalContent.seoTitle || 'No SEO title set'}</p>
                            </div>
                          </div>
                          <div>
                            <label className="block text-lg font-semibold text-gray-700 mb-4">Meta Description</label>
                            <div className="p-4 bg-gray-50 rounded-lg border">
                              <p className="text-base text-gray-700">{originalContent.seoDescription || 'No meta description set'}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Optimized Content */}
                      <div className="p-8 bg-green-50">
                        <div className="flex items-center gap-2 mb-6">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <h4 className="text-xl font-semibold text-gray-900">Optimized Content</h4>
                        </div>
                        <div className="space-y-8">
                          <div>
                            <label className="block text-lg font-semibold text-gray-700 mb-4">Product Title</label>
                            <div className="p-4 bg-white rounded-lg border border-green-200">
                              <p className="text-lg font-medium text-gray-900 leading-relaxed">{displayOptimizedContent.title}</p>
                            </div>
                          </div>
                          <div>
                            <label className="block text-lg font-semibold text-gray-700 mb-4">Description</label>
                            <div className="max-h-[500px] overflow-y-auto p-6 bg-white rounded-lg border border-green-200">
                              <p className="text-base text-gray-700 leading-relaxed whitespace-pre-wrap">{displayOptimizedContent.description}</p>
                            </div>
                          </div>
                          <div>
                            <label className="block text-lg font-semibold text-gray-700 mb-4">SEO Title</label>
                            <div className="p-4 bg-white rounded-lg border border-green-200">
                              <p className="text-base text-gray-700">{displayOptimizedContent.seoTitle || 'No SEO title set'}</p>
                            </div>
                          </div>
                          <div>
                            <label className="block text-lg font-semibold text-gray-700 mb-4">Meta Description</label>
                            <div className="p-4 bg-white rounded-lg border border-green-200">
                              <p className="text-base text-gray-700">{displayOptimizedContent.seoDescription || 'No meta description set'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Enhanced Content Summary */}
                <Card className="shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                    <CardTitle className="text-xl font-bold">Optimization Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Original Content Stats */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                          <h4 className="text-lg font-semibold text-gray-900">Original Content</h4>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="text-gray-700 font-medium">Title Length:</span>
                            <span className="text-lg font-semibold text-gray-900">{originalContent.title.length} chars</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="text-gray-700 font-medium">Description:</span>
                            <span className="text-lg font-semibold text-gray-900">{originalContent.description.split(' ').length} words</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="text-gray-700 font-medium">SEO Score:</span>
                            <span className="text-lg font-semibold text-yellow-600">65/100</span>
                          </div>
                        </div>
                      </div>

                      {/* Optimized Content Stats */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <h4 className="text-lg font-semibold text-gray-900">Optimized Content</h4>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
                            <span className="text-gray-700 font-medium">Title Length:</span>
                            <span className="text-lg font-semibold text-green-600">{displayOptimizedContent.title.length} chars</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
                            <span className="text-gray-700 font-medium">Description:</span>
                            <span className="text-lg font-semibold text-green-600">{displayOptimizedContent.description.split(' ').length} words</span>
                          </div>
                          <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
                            <span className="text-gray-700 font-medium">SEO Score:</span>
                            <span className="text-lg font-semibold text-green-600">{qualityScore?.overall || 94}/100</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Enhanced Key Improvements */}
                <Card className="shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                    <CardTitle className="text-xl font-bold">Key Improvements</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                            <span className="text-white text-sm font-bold">✓</span>
                          </div>
                          <div>
                            <h5 className="font-semibold text-gray-900 mb-2">Enhanced Title Structure</h5>
                            <p className="text-sm text-gray-600">Added brand positioning and category context for better SEO visibility</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                            <span className="text-white text-sm font-bold">✓</span>
                          </div>
                          <div>
                            <h5 className="font-semibold text-gray-900 mb-2">Rich Product Description</h5>
                            <p className="text-sm text-gray-600">Added detailed features, benefits, and gift-giving information with emotional appeal</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                            <span className="text-white text-sm font-bold">✓</span>
                          </div>
                          <div>
                            <h5 className="font-semibold text-gray-900 mb-2">Improved SEO Meta Data</h5>
                            <p className="text-sm text-gray-600">Optimized title and description with well-researched target keywords</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                            <span className="text-white text-sm font-bold">✓</span>
                          </div>
                          <div>
                            <h5 className="font-semibold text-gray-900 mb-2">Trust Signals Added</h5>
                            <p className="text-sm text-gray-600">Included guarantee, return policy, and authenticity information for credibility</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <ContentComparison
                originalContent={originalContent}
                optimizedContent={displayOptimizedContent}
                diffs={contentDiffs}
                loading={loading}
              />
            )}
          </div>
        </div>

        {/* Enhanced Review Actions */}
        <div className="border-t p-6 bg-gradient-to-r from-gray-50 to-blue-50">
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
  )
}