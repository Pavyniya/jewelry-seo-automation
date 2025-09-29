import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Eye,
  ShoppingCart,
  Star,
  MousePointer,
  Calendar,
  BarChart3,
  PieChart
} from 'lucide-react'
import { useProductStore } from '@/stores/productStore'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { CardSkeleton } from '@/components/ui/Skeleton'

interface AnalyticsData {
  views: number
  sales: number
  conversionRate: number
  revenue: number
  seoScore: number
  clickThroughRate: number
  averagePosition: number
  impressions: number
}

interface TrendData {
  date: string
  views: number
  sales: number
  revenue: number
}

const ProductAnalyticsContent: React.FC = () => {
  const { productId } = useParams<{ productId: string }>()
  const navigate = useNavigate()
  const {
    products,
    loading,
    error,
    fetchProducts,
  } = useProductStore()

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [trends, setTrends] = useState<TrendData[]>([])
  const [timeRange, setTimeRange] = useState('30d')

  const product = products.find(p => p.id === productId)

  useEffect(() => {
    if (!product && products.length === 0) {
      fetchProducts()
    }
  }, [product, products.length, fetchProducts])

  useEffect(() => {
    // Mock analytics data - in a real app, this would come from an API
    if (product) {
      setAnalytics({
        views: Math.floor(Math.random() * 10000) + 1000,
        sales: Math.floor(Math.random() * 500) + 50,
        conversionRate: Math.random() * 10 + 1,
        revenue: Math.floor(Math.random() * 50000) + 5000,
        seoScore: product.seoScore || Math.floor(Math.random() * 40) + 60,
        clickThroughRate: Math.random() * 20 + 5,
        averagePosition: Math.floor(Math.random() * 50) + 1,
        impressions: Math.floor(Math.random() * 50000) + 5000,
      })

      // Generate mock trend data
      const trendData: TrendData[] = []
      for (let i = 29; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        trendData.push({
          date: date.toISOString().split('T')[0],
          views: Math.floor(Math.random() * 500) + 50,
          sales: Math.floor(Math.random() * 20) + 1,
          revenue: Math.floor(Math.random() * 2000) + 200,
        })
      }
      setTrends(trendData)
    }
  }, [product])

  const getChangeIndicator = (current: number, previous: number) => {
    const change = ((current - previous) / previous) * 100
    if (Math.abs(change) < 0.1) return { icon: null, color: 'text-gray-600' }

    if (change > 0) {
      return {
        icon: <TrendingUp className="h-4 w-4" />,
        color: 'text-green-600',
        text: `+${change.toFixed(1)}%`
      }
    } else {
      return {
        icon: <TrendingDown className="h-4 w-4" />,
        color: 'text-red-600',
        text: `${change.toFixed(1)}%`
      }
    }
  }

  const getSeoScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 80) return 'text-yellow-600'
    if (score >= 70) return 'text-orange-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <CardSkeleton className="w-12 h-12" />
          <div className="space-y-2">
            <CardSkeleton className="h-8 w-64" />
            <CardSkeleton className="h-4 w-32" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
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
                {error || 'The product analytics you are looking for does not exist.'}
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

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Loading analytics...</span>
      </div>
    )
  }

  const currentMonthViews = trends.slice(-30).reduce((sum, day) => sum + day.views, 0)
  const previousMonthViews = trends.slice(-60, -30).reduce((sum, day) => sum + day.views, 0)
  const viewsChange = getChangeIndicator(currentMonthViews, previousMonthViews)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to={`/products/${productId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Product Analytics
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {product.title}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Views
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analytics.views.toLocaleString()}
                </p>
                {viewsChange.icon && (
                  <div className={`flex items-center space-x-1 mt-1 ${viewsChange.color}`}>
                    {viewsChange.icon}
                    <span className="text-xs">{viewsChange.text}</span>
                  </div>
                )}
              </div>
              <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <Eye className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Sales
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analytics.sales}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {analytics.conversionRate.toFixed(1)}% conversion
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Revenue
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${analytics.revenue.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  ${(analytics.revenue / analytics.sales).toFixed(2)} avg/order
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  SEO Score
                </p>
                <p className={`text-2xl font-bold ${getSeoScoreColor(analytics.seoScore)}`}>
                  {analytics.seoScore}%
                </p>
                <div className="flex items-center space-x-1 mt-1">
                  <Badge className={
                    analytics.seoScore >= 90 ? 'bg-green-100 text-green-800' :
                    analytics.seoScore >= 80 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }>
                    {analytics.seoScore >= 90 ? 'Excellent' :
                     analytics.seoScore >= 80 ? 'Good' : 'Needs Work'}
                  </Badge>
                </div>
              </div>
              <div className="h-12 w-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                <Star className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SEO Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MousePointer className="h-5 w-5" />
              Click-Through Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {analytics.clickThroughRate.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Search CTR
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Average Position
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                #{analytics.averagePosition}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Search ranking
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Impressions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {analytics.impressions.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Search impressions
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Performance Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Views</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {currentMonthViews.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Sales</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {trends.slice(-30).reduce((sum, day) => sum + day.sales, 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  ${trends.slice(-30).reduce((sum, day) => sum + day.revenue, 0).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Chart visualization would be displayed here
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Showing data for the last 30 days
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

const ProductAnalytics: React.FC = () => {
  return (
    <ErrorBoundary>
      <ProductAnalyticsContent />
    </ErrorBoundary>
  )
}

export default ProductAnalytics