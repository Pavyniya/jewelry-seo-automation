export interface Product {
  id: string;
  title: string;
  description: string;
  vendor: string;
  productType: string;
  tags: string[];
  variants: ProductVariant[];
  images: ProductImage[];
  seoTitle?: string;
  seoDescription?: string;
  optimizedDescription?: string;
  optimizationStatus: OptimizationStatus;
  lastOptimized?: Date;
  createdAt: Date;
  updatedAt: Date;
  price: number;
  sku?: string;
}

export type CreateProductDTO = Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'lastOptimized'> & {
  optimizationStatus?: OptimizationStatus;
};

export type UpdateProductDTO = Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>;

export interface ProductVariant {
  id: string;
  title: string;
  price: number;
  sku: string;
  inventoryQuantity: number;
  available: boolean;
}

export interface ProductImage {
  id: string;
  src: string;
  altText?: string;
}

export type OptimizationStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'needs_review';

export interface ShopifyProductResponse {
  id: number;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  tags: string;
  variants: ShopifyVariantResponse[];
  images: ShopifyImageResponse[];
  created_at: string;
  updated_at: string;
  published_at: string;
}

export interface ShopifyVariantResponse {
  id: number;
  title: string;
  price: string;
  sku: string;
  inventory_quantity: number;
  available: boolean;
}

export interface ShopifyImageResponse {
  id: number;
  src: string;
  alt_text?: string;
}

export interface ShopifyProductsResponse {
  products: ShopifyProductResponse[];
}

export interface ShopifyAPIError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
}

export interface OptimizationVersion {
  id: string;
  productId: string;
  version: number;
  originalTitle: string;
  originalDescription: string;
  originalSeoTitle?: string;
  originalSeoDescription?: string;
  optimizedTitle: string;
  optimizedDescription: string;
  optimizedSeoTitle: string;
  optimizedSeoDescription: string;
  aiProvider: string;
  tokensUsed: number;
  cost: number;
  responseTime: number;
  isActive: boolean;
  createdAt: Date;
}

export interface ContentReview {
  id: string;
  productId: string;
  versionId: string;
  reviewer: string;
  status: ReviewStatus;
  feedback?: string;
  approvedAt?: Date;
  createdAt: Date;
}

export interface OptimizationJob {
  id: string;
  productId: string;
  jobType: JobType;
  status: JobStatus;
  providerId?: string;
  priority: number;
  retryCount: number;
  maxRetries: number;
  errorMessage?: string;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}

export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'changes_requested';
export type JobType = 'seo_optimization' | 'content_generation' | 'bulk_optimization';
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export type CreateOptimizationVersionDTO = Omit<OptimizationVersion, 'id' | 'createdAt'>;
export type UpdateOptimizationVersionDTO = Partial<Omit<OptimizationVersion, 'id' | 'productId' | 'createdAt'>>;

export type CreateContentReviewDTO = Omit<ContentReview, 'id' | 'createdAt'>;
export type UpdateContentReviewDTO = Partial<Omit<ContentReview, 'id' | 'productId' | 'versionId' | 'createdAt'>>;

export type CreateOptimizationJobDTO = Omit<OptimizationJob, 'id' | 'createdAt'>;
export type UpdateOptimizationJobDTO = Partial<Omit<OptimizationJob, 'id' | 'productId' | 'createdAt'>>;

export interface SyncProgress {
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  lastUpdated: Date;
}

export interface ProductFilters {
  search?: string;
  status?: OptimizationStatus;
  vendor?: string;
  productType?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
  sortBy?: keyof Product | 'optimizationScore';
  sortOrder?: 'asc' | 'desc';
}

export interface ProductListResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}