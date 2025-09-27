import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Gem, TrendingUp, Clock, Edit } from 'lucide-react';
import { Product } from '@/types/product';
import { useProductStore } from '@/stores/productStore';
import { ReviewModal } from '@/components/review/ReviewModal';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { selectedProducts, toggleProductSelection } = useProductStore();
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const getStatusColor = (status: Product['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'draft': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getSeoScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 80) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getOptimizationProgress = (product: Product) => {
    // Simulate progress based on status and last optimized time
    if (product.status === 'processing') {
      return { progress: 65, status: 'Processing...', color: 'bg-blue-500' };
    }
    if (product.seoScore && product.seoScore >= 90) {
      return { progress: 100, status: 'Optimized', color: 'bg-green-500' };
    }
    if (product.seoScore) {
      return { progress: product.seoScore, status: 'Partially Optimized', color: 'bg-yellow-500' };
    }
    return { progress: 0, status: 'Not Optimized', color: 'bg-gray-300' };
  }

  const getPrice = (product: Product) => {
    if (product.variants && product.variants.length > 0) {
      return parseFloat(product.variants[0].price || '0')
    }
    return 0
  }

  const getSku = (product: Product) => {
    if (product.variants && product.variants.length > 0) {
      return product.variants[0].sku || 'N/A'
    }
    return 'N/A'
  }

  return (
    <>
      <Card className={`hover:shadow-lg transition-shadow ${selectedProducts.includes(product.id) ? 'ring-2 ring-primary-500' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              checked={selectedProducts.includes(product.id)}
              onChange={() => toggleProductSelection(product.id)}
            />
            <Gem className="h-5 w-5 text-primary-600" />
            <CardTitle className="text-lg line-clamp-2">{product.title}</CardTitle>
          </div>
          <Badge className={getStatusColor(product.status || 'active')}>
            {product.status || 'active'}
          </Badge>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">{getSku(product)}</p>
        {product.vendor && (
          <p className="text-sm text-gray-500 dark:text-gray-400">by {product.vendor}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {product.product_type && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Category</span>
              <span className="text-sm font-medium">{product.product_type}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">Price</span>
            <span className="text-sm font-medium">${getPrice(product).toLocaleString()}</span>
          </div>

          {/* Optimization Progress */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Optimization</span>
              </div>
              <span className="text-xs text-gray-500">
                {getOptimizationProgress(product).status}
              </span>
            </div>
            <Progress
              value={getOptimizationProgress(product).progress}
              className="h-2"
            />
          </div>

          {product.seoScore && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">SEO Score</span>
              <span className={`text-sm font-medium ${getSeoScoreColor(product.seoScore)}`}>
                {product.seoScore}%
              </span>
            </div>
          )}
          {product.lastOptimized && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Last Optimized</span>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-gray-500" />
                <span className="text-sm text-gray-900 dark:text-white">{product.lastOptimized}</span>
              </div>
            </div>
          )}
        </div>
        <div className="mt-4 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => setShowEditModal(true)}
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button
            size="sm"
            className="flex-1"
            onClick={() => setShowReviewModal(true)}
          >
            Optimize
          </Button>
        </div>
      </CardContent>
      </Card>

      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        product={product}
      />

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Product</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Product Title
                </label>
                <input
                  type="text"
                  defaultValue={product.title}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter product title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  defaultValue={product.body_html}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter product description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Price
                </label>
                <input
                  type="number"
                  defaultValue={getPrice(product)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    // Here you would typically save the changes
                    alert('Product updated successfully!');
                    setShowEditModal(false);
                  }}
                  className="flex-1"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductCard;