import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Eye, Check, X, Search, Filter } from 'lucide-react'

interface Review {
  id: string
  productId: string
  productName: string
  type: 'content' | 'seo' | 'compliance'
  status: 'pending' | 'approved' | 'rejected'
  reviewer: string
  reviewDate: string
  changes: string[]
  score: number
}

const Reviews: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedType, setSelectedType] = useState('all')

  const reviews: Review[] = [
    {
      id: '1',
      productId: '1',
      productName: '14K Gold Diamond Engagement Ring',
      type: 'seo',
      status: 'pending',
      reviewer: 'AI Assistant',
      reviewDate: '2025-01-15',
      changes: [
        'Optimized title: "Diamond Engagement Ring" → "14K Gold Solitaire Diamond Engagement Ring 1.5ct"',
        'Enhanced meta description with target keywords',
        'Added jewelry-specific schema markup for SEO',
        'Included carat weight, clarity, and cut information'
      ],
      score: 94,
    },
    {
      id: '2',
      productId: '2',
      productName: 'Classic Pearl Necklace',
      type: 'content',
      status: 'approved',
      reviewer: 'AI Assistant',
      reviewDate: '2025-01-14',
      changes: [
        'Enhanced product description with pearl grading details',
        'Added material specifications (freshwater pearls, 18K gold clasp)',
        'Improved care instructions for longevity',
        'Added occasion-based styling suggestions'
      ],
      score: 91,
    },
    {
      id: '3',
      productId: '3',
      productName: 'Rose Gold Statement Earrings',
      type: 'seo',
      status: 'rejected',
      reviewer: 'AI Assistant',
      reviewDate: '2025-01-13',
      changes: [
        'Keyword over-optimization in product title',
        'Missing earring back type and weight information',
        'Incomplete metal composition (14K rose gold specifics needed)',
        'Lack of size dimensions and comfort fit details'
      ],
      score: 72,
    },
    {
      id: '4',
      productId: '4',
      productName: 'Diamond Tennis Bracelet',
      type: 'content',
      status: 'pending',
      reviewer: 'AI Assistant',
      reviewDate: '2025-01-12',
      changes: [
        'Added security clasp type and safety chain information',
        'Enhanced sizing guide with wrist measurements',
        'Included total diamond weight and clarity specifications',
        'Added styling tips for everyday wear and special occasions'
      ],
      score: 87,
    },
  ]

  const statuses = ['all', 'pending', 'approved', 'rejected']
  const types = ['all', 'content', 'seo', 'compliance']

  const getStatusColor = (status: Review['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeColor = (type: Review['type']) => {
    switch (type) {
      case 'content': return 'bg-blue-100 text-blue-800'
      case 'seo': return 'bg-purple-100 text-purple-800'
      case 'compliance': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeLabel = (type: Review['type']) => {
    switch (type) {
      case 'content': return 'Content'
      case 'seo': return 'SEO'
      case 'compliance': return 'Compliance'
      default: return type
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 80) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Review Queue</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Manage and approve AI-generated SEO optimizations for your jewelry products.</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Optimizations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">215</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Products processed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">12</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Awaiting approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">189</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">SEO applied to products</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg. Quality</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">91.5</div>
            <p className="text-xs text-gray-600 dark:text-gray-400">SEO optimization score</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search reviews..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status === 'all' ? 'All Statuses' : status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
              <select
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                {types.map((type) => (
                  <option key={type} value={type}>
                    {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
              <Button variant="outline" className="flex items-center gap-2 dark:hover:bg-gray-700">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews list */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id} className="hover:shadow-lg transition-shadow dark:hover:bg-gray-800">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg dark:text-white">{review.productName}</CardTitle>
                  <div className="flex gap-2 mt-2">
                    <Badge className={getStatusColor(review.status)}>
                      {review.status}
                    </Badge>
                    <Badge className={getTypeColor(review.type)}>
                      {review.type}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${getScoreColor(review.score)}`}>
                    {review.score}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{review.reviewDate}</div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Reviewer</h4>
                  <p className="text-gray-600 dark:text-gray-400">{review.reviewer}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Changes</h4>
                  <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
                    {review.changes.map((change, index) => (
                      <li key={index}>{change}</li>
                    ))}
                  </ul>
                </div>
                {review.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex items-center gap-2 dark:hover:bg-gray-700">
                      <Eye className="h-4 w-4" />
                      View Details
                    </Button>
                    <Button variant="outline" size="sm" className="flex items-center gap-2 text-green-600 dark:hover:bg-gray-700">
                      <Check className="h-4 w-4" />
                      Approve
                    </Button>
                    <Button variant="outline" size="sm" className="flex items-center gap-2 text-red-600 dark:hover:bg-gray-700">
                      <X className="h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center">
        <nav className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="dark:hover:bg-gray-700">
            Previous
          </Button>
          <Button variant="outline" size="sm" className="dark:hover:bg-gray-700">
            1
          </Button>
          <Button variant="outline" size="sm" className="dark:hover:bg-gray-700">
            2
          </Button>
          <Button variant="outline" size="sm" className="dark:hover:bg-gray-700">
            3
          </Button>
          <Button variant="outline" size="sm" className="dark:hover:bg-gray-700">
            Next
          </Button>
        </nav>
      </div>
    </div>
  )
}

export default Reviews