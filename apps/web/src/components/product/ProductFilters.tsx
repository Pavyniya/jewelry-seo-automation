import React from 'react';
import { Button } from '@/components/ui/Button';
import { Search, Filter, ArrowUpDown } from 'lucide-react';

interface ProductFiltersProps {
  searchTerm: string;
  // eslint-disable-next-line no-unused-vars
  setSearchTerm: (term: string) => void;
  selectedCategory: string;
  // eslint-disable-next-line no-unused-vars
  setSelectedCategory: (category: string) => void;
  categories: string[];
  sortBy: 'title' | 'price' | 'status' | 'lastOptimized';
  sortOrder: 'asc' | 'desc';
  // eslint-disable-next-line no-unused-vars
  setSortBy: (sortBy: 'title' | 'price' | 'status' | 'lastOptimized') => void;
  // eslint-disable-next-line no-unused-vars
  setSortOrder: (sortOrder: 'asc' | 'desc') => void;
}

const ProductFilters: React.FC<ProductFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  categories,
  sortBy,
  sortOrder,
  setSortBy,
  setSortOrder
}) => {
  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search products..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <select
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category === 'all' ? 'All Categories' : category}
            </option>
          ))}
        </select>
        <select
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
        >
          <option value="title">Sort by Title</option>
          <option value="price">Sort by Price</option>
          <option value="status">Sort by Status</option>
          <option value="lastOptimized">Sort by Last Optimized</option>
        </select>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          className="flex items-center gap-2"
        >
          <ArrowUpDown className="h-4 w-4" />
          {sortOrder === 'asc' ? '↑' : '↓'}
        </Button>
        <Button variant="outline" className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filter
        </Button>
      </div>
    </div>
  );
};

export default ProductFilters;
