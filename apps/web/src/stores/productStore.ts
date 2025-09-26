import { create } from 'zustand';
import { Product } from '@/types/product';

interface ProductsResponse {
  success: boolean;
  data: {
    products: Product[];
    stats: {
      total: number;
      pending: number;
      processing: number;
      completed: number;
      failed: number;
      needs_review: number;
    };
    pagination: {
      limit: number;
      offset: number;
      total: number;
    };
  };
}

interface ProductState {
  allProducts: Product[]; // All products from server
  products: Product[]; // Current page products
  loading: boolean;
  error: string | null;
  searchTerm: string;
  selectedCategory: string;
  selectedProducts: string[];
  currentPage: number;
  totalPages: number;
  sortBy: 'title' | 'price' | 'status' | 'lastOptimized';
  sortOrder: 'asc' | 'desc';
  setSearchTerm: (term: string) => void;
  setSelectedCategory: (category: string) => void;
  toggleProductSelection: (productId: string) => void;
  toggleSelectAll: () => void;
  clearProductSelection: () => void;
  setCurrentPage: (page: number) => void;
  setSortBy: (sortBy: 'title' | 'price' | 'status' | 'lastOptimized') => void;
  setSortOrder: (sortOrder: 'asc' | 'desc') => void;
  fetchProducts: () => Promise<void>;
  syncProducts: () => Promise<void>;
  getFilteredProducts: () => Product[];
  getPaginatedFilteredProducts: () => Product[]; // Get filtered products for current page
  getFilteredCount: () => number; // Get total count of filtered products
}

export const useProductStore = create<ProductState>((set, get) => ({
  allProducts: [],
  products: [],
  loading: true,
  error: null,
  searchTerm: '',
  selectedCategory: 'all',
  selectedProducts: [],
  currentPage: 1,
  totalPages: 1,
  sortBy: 'title',
  sortOrder: 'asc',
  setSearchTerm: (term) => set({ searchTerm: term, currentPage: 1 }),
  setSelectedCategory: (category) => set({ selectedCategory: category, currentPage: 1 }),
  toggleProductSelection: (productId) =>
    set((state) => ({
      selectedProducts: state.selectedProducts.includes(productId)
        ? state.selectedProducts.filter((id) => id !== productId)
        : [...state.selectedProducts, productId],
    })),
  toggleSelectAll: () =>
    set((state) => {
      const currentFilteredProducts = state.getFilteredProducts();
      const allSelected = currentFilteredProducts.every(product => state.selectedProducts.includes(product.id));

      if (allSelected) {
        // If all are selected, deselect all
        return { selectedProducts: [] };
      } else {
        // If not all are selected, select all filtered products
        const allFilteredIds = currentFilteredProducts.map(product => product.id);
        return { selectedProducts: allFilteredIds };
      }
    }),
  clearProductSelection: () => set({ selectedProducts: [] }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setSortBy: (sortBy) => set({ sortBy }),
  setSortOrder: (sortOrder) => set({ sortOrder }),
  fetchProducts: async () => {
    try {
      set({ loading: true, error: null });
      // First, get total count to calculate how many pages we need
      const countResponse = await fetch('/api/v1/products?limit=1&offset=0');
      const countData: ProductsResponse = await countResponse.json();

      if (countData.success) {
        const total = countData.data.pagination.total;
        const totalPages = Math.ceil(total / 12);

        // Now fetch all products in batches
        const allProducts: Product[] = [];
        const batchSize = 250; // Max allowed by API

        for (let page = 0; page < Math.ceil(total / batchSize); page++) {
          const offset = page * batchSize;
          const response = await fetch(`/api/v1/products?limit=${batchSize}&offset=${offset}`);
          const data: ProductsResponse = await response.json();

          if (data.success) {
            allProducts.push(...data.data.products);
          }
        }

        set({
          allProducts: allProducts,
          products: allProducts.slice(0, 12), // First page for backwards compatibility
          totalPages: totalPages,
          loading: false
        });
      } else {
        set({ error: 'Failed to fetch products', loading: false });
      }
    } catch (err) {
      set({ error: 'Error connecting to server', loading: false });
      console.error('Error fetching products:', err);
    }
  },
  syncProducts: async () => {
    try {
      set({ loading: true, error: null, currentPage: 1, searchTerm: '', selectedCategory: 'all' });
      const response = await fetch('/api/v1/products/sync', {
        method: 'POST',
      });
      const data = await response.json();
      if (data.success) {
        // After syncing, fetch the updated product list
        get().fetchProducts();
      } else {
        set({ error: 'Failed to sync products', loading: false });
      }
    } catch (err) {
      set({ error: 'Error syncing products', loading: false });
      console.error('Error syncing products:', err);
    }
  },
  getFilteredProducts: () => {
    const { allProducts, searchTerm, selectedCategory, sortBy, sortOrder } = get();

    const filtered = allProducts.filter(product => {
      const matchesSearch = product.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory = selectedCategory === 'all' || product.product_type === selectedCategory;

      return matchesSearch && matchesCategory;
    });

    // Sort the filtered products
    return filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'price':
          aValue = a.variants?.[0]?.price ? parseFloat(a.variants[0].price) : 0;
          bValue = b.variants?.[0]?.price ? parseFloat(b.variants[0].price) : 0;
          break;
        case 'status':
          aValue = a.status || 'active';
          bValue = b.status || 'active';
          break;
        case 'lastOptimized':
          aValue = a.lastOptimized ? new Date(a.lastOptimized).getTime() : 0;
          bValue = b.lastOptimized ? new Date(b.lastOptimized).getTime() : 0;
          break;
        default:
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  },
  getPaginatedFilteredProducts: () => {
    const { getFilteredProducts, currentPage } = get();
    const filteredProducts = getFilteredProducts();
    const itemsPerPage = 12;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    return filteredProducts.slice(startIndex, endIndex);
  },
  getFilteredCount: () => {
    const { getFilteredProducts } = get();
    return getFilteredProducts().length;
  },
}));