import { z } from 'zod';

// Product schemas
export const productVariantSchema = z.object({
  id: z.string(),
  title: z.string(),
  price: z.number(),
  sku: z.string(),
  inventoryQuantity: z.number(),
  available: z.boolean(),
});

export const productImageSchema = z.object({
  id: z.string(),
  src: z.string(),
  altText: z.string().optional(),
});

export const optimizationStatusSchema = z.enum(['pending', 'processing', 'completed', 'failed', 'needs_review']);

export const productSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(200),
  description: z.string().max(5000),
  vendor: z.string().max(100),
  productType: z.string().max(100),
  tags: z.array(z.string().max(50)),
  variants: z.array(productVariantSchema),
  images: z.array(productImageSchema),
  seoTitle: z.string().max(60).optional(),
  seoDescription: z.string().max(160).optional(),
  optimizedDescription: z.string().max(5000).optional(),
  optimizationStatus: optimizationStatusSchema,
  lastOptimized: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  price: z.number().positive(),
  sku: z.string().max(100).optional(),
});

export const createProductDTOSchema = productSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastOptimized: true,
}).partial({
  optimizationStatus: true,
});

export const updateProductDTOSchema = productSchema.partial().omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// AI Provider schemas
export const aiProviderSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(50),
  apiKey: z.string().min(1),
  baseUrl: z.string().url().optional(),
  isEnabled: z.boolean(),
  rateLimit: z.number().positive().optional(),
  currentUsage: z.number().min(0),
  usageLimit: z.number().positive().optional(),
  lastUsed: z.date().optional(),
  createdAt: z.date(),
});

export const aiUsageRecordSchema = z.object({
  id: z.string(),
  providerId: z.string(),
  productId: z.string().optional(),
  requestType: z.string().min(1),
  tokensUsed: z.number().min(0),
  cost: z.number().min(0),
  responseTime: z.number().min(0),
  success: z.boolean(),
  errorMessage: z.string().max(1000).optional(),
  createdAt: z.date(),
});

// Optimization Version schemas
export const optimizationVersionSchema = z.object({
  id: z.string(),
  productId: z.string(),
  version: z.number().positive(),
  originalTitle: z.string().min(1).max(200),
  originalDescription: z.string().max(5000),
  originalSeoTitle: z.string().max(60).optional(),
  originalSeoDescription: z.string().max(160).optional(),
  optimizedTitle: z.string().min(1).max(200),
  optimizedDescription: z.string().max(5000),
  optimizedSeoTitle: z.string().max(60).optional(),
  optimizedSeoDescription: z.string().max(160).optional(),
  aiProvider: z.string().min(1),
  tokensUsed: z.number().min(0),
  cost: z.number().min(0),
  responseTime: z.number().min(0),
  isActive: z.boolean(),
  createdAt: z.date(),
});

export const createOptimizationVersionDTOSchema = optimizationVersionSchema.omit({
  id: true,
  createdAt: true,
});

export const updateOptimizationVersionDTOSchema = optimizationVersionSchema.partial().omit({
  id: true,
  productId: true,
  createdAt: true,
});

// Content Review schemas
export const reviewStatusSchema = z.enum(['pending', 'approved', 'rejected', 'needs_revision']);

export const contentReviewSchema = z.object({
  id: z.string(),
  productId: z.string(),
  versionId: z.string(),
  reviewer: z.string().min(1).max(100),
  status: reviewStatusSchema,
  feedback: z.string().max(2000).optional(),
  approvedAt: z.date().optional(),
  createdAt: z.date(),
});

export const createContentReviewDTOSchema = contentReviewSchema.omit({
  id: true,
  createdAt: true,
});

export const updateContentReviewDTOSchema = contentReviewSchema.partial().omit({
  id: true,
  productId: true,
  versionId: true,
  createdAt: true,
});

// Optimization Job schemas
export const jobTypeSchema = z.enum(['seo_optimization', 'content_generation', 'bulk_optimization']);
export const jobStatusSchema = z.enum(['pending', 'running', 'completed', 'failed', 'cancelled']);

export const optimizationJobSchema = z.object({
  id: z.string(),
  productId: z.string(),
  jobType: jobTypeSchema,
  status: jobStatusSchema,
  providerId: z.string().optional(),
  priority: z.number().min(1).max(10),
  retryCount: z.number().min(0),
  maxRetries: z.number().min(1),
  errorMessage: z.string().max(1000).optional(),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
  createdAt: z.date(),
});

export const createOptimizationJobDTOSchema = optimizationJobSchema.omit({
  id: true,
  createdAt: true,
});

export const updateOptimizationJobDTOSchema = optimizationJobSchema.partial().omit({
  id: true,
  productId: true,
  createdAt: true,
});

// Utility schemas
export const productFiltersSchema = z.object({
  search: z.string().max(100).optional(),
  status: optimizationStatusSchema.optional(),
  vendor: z.string().max(100).optional(),
  productType: z.string().max(100).optional(),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  page: z.number().positive().optional(),
  limit: z.number().positive().max(100).optional(),
  sortBy: z.enum(['title', 'price', 'createdAt', 'updatedAt', 'optimizationScore']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// Validation helpers
export const validateProduct = (data: unknown) => productSchema.safeParse(data);
export const validateCreateProduct = (data: unknown) => createProductDTOSchema.safeParse(data);
export const validateUpdateProduct = (data: unknown) => updateProductDTOSchema.safeParse(data);

export const validateAiProvider = (data: unknown) => aiProviderSchema.safeParse(data);
export const validateAiUsageRecord = (data: unknown) => aiUsageRecordSchema.safeParse(data);

export const validateOptimizationVersion = (data: unknown) => optimizationVersionSchema.safeParse(data);
export const validateCreateOptimizationVersion = (data: unknown) => createOptimizationVersionDTOSchema.safeParse(data);
export const validateUpdateOptimizationVersion = (data: unknown) => updateOptimizationVersionDTOSchema.safeParse(data);

export const validateContentReview = (data: unknown) => contentReviewSchema.safeParse(data);
export const validateCreateContentReview = (data: unknown) => createContentReviewDTOSchema.safeParse(data);
export const validateUpdateContentReview = (data: unknown) => updateContentReviewDTOSchema.safeParse(data);

export const validateOptimizationJob = (data: unknown) => optimizationJobSchema.safeParse(data);
export const validateCreateOptimizationJob = (data: unknown) => createOptimizationJobDTOSchema.safeParse(data);
export const validateUpdateOptimizationJob = (data: unknown) => updateOptimizationJobDTOSchema.safeParse(data);

export const validateProductFilters = (data: unknown) => productFiltersSchema.safeParse(data);

// Export types from schemas
export type Product = z.infer<typeof productSchema>;
export type CreateProductDTO = z.infer<typeof createProductDTOSchema>;
export type UpdateProductDTO = z.infer<typeof updateProductDTOSchema>;

export type AiProvider = z.infer<typeof aiProviderSchema>;
export type AiUsageRecord = z.infer<typeof aiUsageRecordSchema>;

export type OptimizationVersion = z.infer<typeof optimizationVersionSchema>;
export type CreateOptimizationVersionDTO = z.infer<typeof createOptimizationVersionDTOSchema>;
export type UpdateOptimizationVersionDTO = z.infer<typeof updateOptimizationVersionDTOSchema>;

export type ContentReview = z.infer<typeof contentReviewSchema>;
export type CreateContentReviewDTO = z.infer<typeof createContentReviewDTOSchema>;
export type UpdateContentReviewDTO = z.infer<typeof updateContentReviewDTOSchema>;

export type OptimizationJob = z.infer<typeof optimizationJobSchema>;
export type CreateOptimizationJobDTO = z.infer<typeof createOptimizationJobDTOSchema>;
export type UpdateOptimizationJobDTO = z.infer<typeof updateOptimizationJobDTOSchema>;

export type ProductFilters = z.infer<typeof productFiltersSchema>;
export type OptimizationStatus = z.infer<typeof optimizationStatusSchema>;
export type ReviewStatus = z.infer<typeof reviewStatusSchema>;
export type JobType = z.infer<typeof jobTypeSchema>;
export type JobStatus = z.infer<typeof jobStatusSchema>;