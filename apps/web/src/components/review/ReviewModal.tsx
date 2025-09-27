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
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(false)

  const {
    currentReview,
    contentDiffs,
    qualityScore,
    submitReview,
    calculateQualityScore,
    getContentDiffs,
    clearError
  } = useReviewStore()

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
      clearError()
    }
  }, [isOpen, clearError])

  const generateOptimizedContent = async () => {
    if (!product) return

    setLoading(true)
    try {
      // Simulate API call to generate optimized content
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Mock optimized content based on product
      const optimizedContent = {
        title: `${product.title} | Fine Jewelry Collection`,
        description: `${product.description}\n\n✨ **Premium Quality Features:**\n• Expertly crafted with attention to detail\n• Perfect for special occasions and everyday elegance\n• Timeless design that complements any style\n• Backed by our quality guarantee\n\n🎁 **Perfect Gift Choice:**\n• Ideal for anniversaries, birthdays, and celebrations\n• Comes in elegant gift packaging\n• Includes certificate of authenticity\n• 30-day return policy for your peace of mind`,
        seoTitle: `${product.title} - Luxury Jewelry | Ohh Glam`,
        seoDescription: `Discover our exquisite ${product.title.toLowerCase()}. Handcrafted with premium materials, perfect for making every moment special. Shop now with free shipping.`
      }

      // Calculate quality score
      await calculateQualityScore(optimizedContent.description)

      // Generate content diffs
      await getContentDiffs(product.description || '', optimizedContent.description)

      setLoading(false)
    } catch (error) {
      console.error('Failed to generate optimized content:', error)
      setLoading(false)
    }
  }

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
    description: product.body_html || '',
    seoTitle: product.seoTitle,
    seoDescription: product.seoDescription
  }

  const optimizedContent = {
    title: `${product.title} | Fine Jewelry Collection`,
    description: `${product.body_html || ''}\n\n✨ **Premium Quality Features:**\n• Expertly crafted with attention to detail\n• Perfect for special occasions and everyday elegance\n• Timeless design that complements any style\n• Backed by our quality guarantee\n\n🎁 **Perfect Gift Choice:**\n• Ideal for anniversaries, birthdays, and celebrations\n• Comes in elegant gift packaging\n• Includes certificate of authenticity\n• 30-day return policy for your peace of mind`,
    seoTitle: `${product.title} - Luxury Jewelry | Ohh Glam`,
    seoDescription: `Discover our exquisite ${product.title.toLowerCase()}. Handcrafted with premium materials, perfect for making every moment special. Shop now with free shipping.`
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Review SEO Optimization
            </h2>
            <Badge className="bg-blue-100 text-blue-800">
              {product.status}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-2"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Product Info */}
        <div className="p-6 border-b bg-gray-50">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {product.title}
              </h3>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {product.updatedAt ? new Date(product.updatedAt).toLocaleDateString() : 'Recently updated'}
                </span>
                {product.variants && product.variants.length > 0 && (
                  <span>
                    {product.variants.length} variant{product.variants.length > 1 ? 's' : ''}
                  </span>
                )}
                {product.variants && product.variants.length > 0 && product.variants[0].price && (
                  <span className="font-medium">
                    ${parseFloat(product.variants[0].price)}
                  </span>
                )}
              </div>
            </div>

            {qualityScore && (
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">
                  {qualityScore.overall}%
                </div>
                <div className="text-sm text-gray-600">
                  Quality Score
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto max-h-[calc(90vh-300px)]">
          <div className="p-6">
            {/* View Toggle */}
            <div className="flex gap-2 mb-6">
              <Button
                variant={currentView === 'overview' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentView('overview')}
              >
                Overview
              </Button>
              <Button
                variant={currentView === 'comparison' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentView('comparison')}
              >
                <Eye className="h-4 w-4 mr-2" />
                Side-by-Side Comparison
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Generating optimized content...</p>
              </div>
            ) : currentView === 'overview' ? (
              <div className="space-y-6">
                {/* Content Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Optimization Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Original Content</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Title Length:</span>
                          <span>{originalContent.title.length} chars</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Description:</span>
                          <span>{originalContent.description.split(' ').length} words</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">SEO Score:</span>
                          <span className="text-yellow-600">65/100</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Optimized Content</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Title Length:</span>
                          <span className="text-green-600">{optimizedContent.title.length} chars</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Description:</span>
                          <span className="text-green-600">{optimizedContent.description.split(' ').length} words</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">SEO Score:</span>
                          <span className="text-green-600">{qualityScore?.overall || 94}/100</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  </CardContent>
                </Card>

                {/* Key Improvements */}
                <Card>
                  <CardHeader>
                    <CardTitle>Key Improvements</CardTitle>
                  </CardHeader>
                  <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <h5 className="font-medium text-gray-900">Enhanced Title Structure</h5>
                        <p className="text-sm text-gray-600">Added brand positioning and category context for better SEO</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <h5 className="font-medium text-gray-900">Rich Product Description</h5>
                        <p className="text-sm text-gray-600">Added detailed features, benefits, and gift-giving information</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <h5 className="font-medium text-gray-900">Improved SEO Meta Data</h5>
                        <p className="text-sm text-gray-600">Optimized title and description with target keywords</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <h5 className="font-medium text-gray-900">Trust Signals Added</h5>
                        <p className="text-sm text-gray-600">Included guarantee, return policy, and authenticity information</p>
                      </div>
                    </div>
                  </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <ContentComparison
                originalContent={originalContent}
                optimizedContent={optimizedContent}
                diffs={contentDiffs}
                loading={loading}
              />
            )}
          </div>
        </div>

        {/* Review Actions */}
        <div className="border-t p-6 bg-gray-50">
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