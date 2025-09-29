import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  ArrowLeft,
  Edit,
  ExternalLink,
  TrendingUp,
  Package,
  Clock,
  Copy,
  Share2
} from 'lucide-react'
import { useProductStore } from '@/stores/productStore'
import { ToastProvider, useToast } from '@/components/ui/Toast'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

const ProductDetailContent: React.FC = () => {
  const { productId } = useParams<{ productId: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const {
    products,
    loading,
    error,
    selectedProducts,
    setSelectedProducts,
    fetchProducts,
    optimizeProduct,
  } = useProductStore()

  const [optimizationHistory, setOptimizationHistory] = useState([
    {
      id: '1',
      date: '2025-09-25',
      action: 'SEO Optimization',
      status: 'completed',
      score: 92,
      details: 'Optimized title and meta description for better search visibility'
    },
    {
      id: '2',
      date: '2025-09-20',
      action: 'Content Review',
      status: 'completed',
      score: 85,
      details: 'Reviewed and updated product description for clarity and keywords'
    },
    {
      id: '3',
      date: '2025-09-15',
      action: 'Initial Sync',
      status: 'completed',
      score: 70,
      details: 'Product imported and indexed from Shopify store'
    }
  ])

  const product = products.find(p => p.id === productId)

  useEffect(() => {
    if (!product && products.length === 0) {
      fetchProducts()
    }
  }, [product, products.length, fetchProducts])

  const handleOptimize = async () => {
    if (!product) return

    try {
      await optimizeProduct(product.id)
      showToast({
        type: 'success',
        title: 'SEO Optimization Started',
        description: 'Your product SEO optimization is in progress.'
      })
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Optimization Failed',
        description: 'Unable to start SEO optimization. Please try again.'
      })
    }
  }

  const handleCopyLink = () => {
    if (!product) return

    const url = `${window.location.origin}/products/${product.id}`
    navigator.clipboard.writeText(url)
    showToast({
      type: 'success',
      title: 'Link Copied',
      description: 'Product link copied to clipboard.'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'draft': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getHistoryStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in-progress': return 'bg-blue-100 text-blue-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getSeoScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 80) return 'text-yellow-600'
    if (score >= 70) return 'text-orange-600'
    return 'text-red-600'
  }

  const getPrice = () => {
    if (!product?.variants || product.variants.length === 0) return 0
    return parseFloat(product.variants[0].price || '0')
  }

  const getSku = () => {
    if (!product?.variants || product.variants.length === 0) return 'N/A'
    return product.variants[0].sku || 'N/A'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Loading product details...</span>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Product not found
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {error || 'The product you are looking for does not exist.'}
              </p>
              <Button onClick={() => navigate('/products')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Products
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/products">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {product.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              SKU: {getSku()}
            </p>
            {product.vendor && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                by {product.vendor}
              </p>
            )}
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handleCopyLink}>
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Product Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Status
                  </label>
                  <div className="mt-1">
                    <Badge className={getStatusColor(product.status || 'active')}>
                      {product.status || 'active'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Category
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {product.product_type || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Price
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    ${getPrice().toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Inventory
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {product.variants?.[0]?.inventory_quantity || 'N/A'}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Tags
                </label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {product.tags?.map((tag, index) => (
                    <Badge
                      key={index}
                      className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {product.description ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: product.description }}
                    className="text-gray-700 dark:text-gray-300"
                  />
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">
                    No description available.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SEO Information & Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                SEO Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {product.seoScore && (
                <div className="text-center">
                  <div className={`text-3xl font-bold ${getSeoScoreColor(product.seoScore)}`}>
                    {product.seoScore}%
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    SEO Score
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    SEO Title
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {product.seoTitle || 'Not set'}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    SEO Description
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {product.seoDescription || 'Not set'}
                  </p>
                </div>

                {product.lastOptimized && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Last Optimized
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {new Date(product.lastOptimized).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={handleOptimize}
                className="w-full"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Optimize SEO
              </Button>

              <Button variant="outline" className="w-full">
                <Edit className="h-4 w-4 mr-2" />
                Edit Product
              </Button>

              <Button variant="outline" className="w-full">
                <ExternalLink className="h-4 w-4 mr-2" />
                View on Shopify
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Optimization History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Optimization History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {optimizationHistory.map((history) => (
              <div key={history.id} className="border-l-4 border-blue-200 pl-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className={getHistoryStatusColor(history.status)}>
                      {history.status}
                    </Badge>
                    <span className="text-sm font-medium">{history.action}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {history.score && (
                      <span className={`text-sm font-medium ${getSeoScoreColor(history.score)}`}>
                        {history.score}%
                      </span>
                    )}
                    <span className="text-sm text-gray-500">{history.date}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600">{history.details}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

const ProductDetail: React.FC = () => {
  return (
    <ToastProvider>
      <ErrorBoundary>
        <ProductDetailContent />
      </ErrorBoundary>
    </ToastProvider>
  )
}

export default ProductDetail