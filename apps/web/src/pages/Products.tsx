import React, { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, Gem } from 'lucide-react';
import ProductCard from '@/components/product/ProductCard';
import ProductFilters from '@/components/product/ProductFilters';
import BatchActions from '@/components/product/BatchActions';
import Pagination from '@/components/common/Pagination';
import { useProductStore } from '@/stores/productStore';

const Products: React.FC = () => {
  const {
    products,
    loading,
    error,
    searchTerm,
    selectedCategory,
    selectedProducts,
    sortBy,
    sortOrder,
    setSearchTerm,
    setSelectedCategory,
    setSortBy,
    setSortOrder,
    toggleSelectAll,
    clearProductSelection,
    currentPage,
    setCurrentPage,
    fetchProducts,
    syncProducts,
    getPaginatedFilteredProducts,
    getFilteredCount,
  } = useProductStore();

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const paginatedFilteredProducts = getPaginatedFilteredProducts();
  const filteredCount = getFilteredCount();
  const totalPages = Math.ceil(filteredCount / 12);
  const categories = ['all', ...new Set(products.map(p => p.product_type).filter((type): type is string => Boolean(type)))];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading products...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-red-600 mb-4">{error}</div>
            <Button onClick={fetchProducts}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Products</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Manage your jewelry catalog and SEO optimization ({products.length} products).</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchProducts} variant="outline" className="flex items-center gap-2">
            Refresh
          </Button>
          <Button onClick={syncProducts} disabled={loading} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {loading ? 'Syncing...' : 'Sync Products'}
          </Button>
        </div>
      </div>

      {/* Filters and search */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <BatchActions />
            <ProductFilters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              categories={categories}
              sortBy={sortBy}
              sortOrder={sortOrder}
              setSortBy={setSortBy}
              setSortOrder={setSortOrder}
            />
          </div>
        </CardContent>
      </Card>

      {/* Select all checkbox */}
      {paginatedFilteredProducts.length > 0 && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="select-all"
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              checked={paginatedFilteredProducts.length > 0 && paginatedFilteredProducts.every(product => selectedProducts.includes(product.id))}
              onChange={toggleSelectAll}
            />
            <label htmlFor="select-all" className="text-sm text-gray-600 dark:text-gray-400">
              {paginatedFilteredProducts.every(product => selectedProducts.includes(product.id)) ? 'Deselect all' : 'Select all'}
            </label>
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {selectedProducts.length} of {paginatedFilteredProducts.length} selected
          </span>
        </div>
      )}

      {/* Products grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {paginatedFilteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {paginatedFilteredProducts.length === 0 && !loading && (
        <div className="text-center py-12">
          <Gem className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || selectedCategory !== 'all'
              ? 'Try adjusting your search or filter criteria.'
              : 'Sync your Shopify products to get started.'}
          </p>
          {(!searchTerm && selectedCategory === 'all') && (
            <Button onClick={syncProducts} disabled={loading}>
              {loading ? 'Syncing...' : 'Sync Products Now'}
            </Button>
          )}
        </div>
      )}

      {/* Pagination */}
      {paginatedFilteredProducts.length > 0 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => {
              clearProductSelection();
              setCurrentPage(page);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Products;
