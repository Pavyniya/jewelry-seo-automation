import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  X,
  Edit,
  ExternalLink,
  Clock,
  TrendingUp,
  Package
} from 'lucide-react';
import { Product } from '@/types/product';

interface ProductDetailProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onOptimize?: () => void;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ product, isOpen, onClose, onOptimize }) => {
  const [optimizationHistory] = useState([
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
  ]);

  const getStatusColor = (status: Product['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getHistoryStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeoScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-yellow-600';
    if (score >= 70) return 'text-orange-600';
    return 'text-red-600';
  };

  
  
  const getPrice = (product: Product) => {
    if (product.variants && product.variants.length > 0) {
      return parseFloat(product.variants[0].price || '0');
    }
    return 0;
  };

  const getSku = (product: Product) => {
    if (product.variants && product.variants.length > 0) {
      return product.variants[0].sku || 'N/A';
    }
    return 'N/A';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{product.title}</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">SKU: {getSku(product)}</p>
              {product.vendor && (
                <p className="text-sm text-gray-500 dark:text-gray-400">by {product.vendor}</p>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Product Information */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Product Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                    <Badge className={getStatusColor(product.status || 'active')}>
                      {product.status || 'active'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Category</span>
                    <span className="text-sm font-medium">{product.product_type || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Price</span>
                    <span className="text-sm font-medium">${getPrice(product).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Tags</span>
                    <div className="flex flex-wrap gap-1">
                      {product.tags?.map((tag, index) => (
                        <Badge key={index} className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    SEO Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {product.seoScore && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">SEO Score</span>
                      <span className={`text-sm font-medium ${getSeoScoreColor(product.seoScore)}`}>
                        {product.seoScore}%
                      </span>
                    </div>
                  )}
                  {product.lastOptimized && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Last Optimized</span>
                      <span className="text-sm text-gray-900 dark:text-white">{product.lastOptimized}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">SEO Title</span>
                    <span className="text-sm font-medium text-right max-w-xs">
                      {product.seoTitle || 'Not set'}
                    </span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-sm text-gray-600 dark:text-gray-400">SEO Description</span>
                    <span className="text-sm font-medium text-right max-w-xs">
                      {product.seoDescription || 'Not set'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Description and Actions */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {product.description || 'No description available.'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={onOptimize}
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
          <Card className="mt-6">
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
      </div>
    </div>
  );
};

export default ProductDetail;