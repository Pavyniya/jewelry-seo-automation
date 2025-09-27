import {
  Product,
  CreateProductDTO,
  UpdateProductDTO,
  OptimizationVersion,
  CreateOptimizationVersionDTO,
  UpdateOptimizationVersionDTO,
  ContentReview,
  CreateContentReviewDTO,
  UpdateContentReviewDTO,
  AiProvider,
  AiUsageRecord,
  OptimizationJob,
  CreateOptimizationJobDTO,
  UpdateOptimizationJobDTO,
} from '../schemas';
import { sanitizeProductData, sanitizeOptimizationVersionData, sanitizeContentReviewData, sanitizeAiProviderData } from './sanitization';

// Product serialization/deserialization
export function serializeProduct(product: Product): any {
  return {
    ...product,
    tags: JSON.stringify(product.tags),
    variants: JSON.stringify(product.variants),
    images: JSON.stringify(product.images),
    shopifyData: product.shopifyData ? JSON.stringify(product.shopifyData) : null,
    lastOptimized: product.lastOptimized?.toISOString() || null,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

export function deserializeProduct(row: any): Product {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    vendor: row.vendor,
    productType: row.productType,
    tags: row.tags ? JSON.parse(row.tags) : [],
    variants: row.variants ? JSON.parse(row.variants) : [],
    images: row.images ? JSON.parse(row.images) : [],
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    optimizedDescription: row.optimizedDescription,
    optimizationStatus: row.optimizationStatus,
    lastOptimized: row.lastOptimized ? new Date(row.lastOptimized) : undefined,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
    price: row.price,
    sku: row.sku,
  };
}

export function serializeCreateProductDTO(dto: CreateProductDTO): any {
  const sanitized = sanitizeProductData(dto);
  return {
    ...sanitized,
    tags: JSON.stringify(sanitized.tags || []),
    variants: JSON.stringify(sanitized.variants || []),
    images: JSON.stringify(sanitized.images || []),
    shopifyData: sanitized.shopifyData ? JSON.stringify(sanitized.shopifyData) : null,
    optimizationStatus: sanitized.optimizationStatus || 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function serializeUpdateProductDTO(dto: UpdateProductDTO): any {
  const sanitized = sanitizeProductData(dto);
  const serialized: any = { ...sanitized };

  if (sanitized.tags) serialized.tags = JSON.stringify(sanitized.tags);
  if (sanitized.variants) serialized.variants = JSON.stringify(sanitized.variants);
  if (sanitized.images) serialized.images = JSON.stringify(sanitized.images);
  if (sanitized.shopifyData) serialized.shopifyData = JSON.stringify(sanitized.shopifyData);
  if (sanitized.lastOptimized) serialized.lastOptimized = sanitized.lastOptimized.toISOString();
  if (Object.keys(serialized).length > 0) {
    serialized.updatedAt = new Date().toISOString();
  }

  return serialized;
}

// Optimization version serialization/deserialization
export function serializeOptimizationVersion(version: OptimizationVersion): any {
  return {
    ...version,
    createdAt: version.createdAt.toISOString(),
  };
}

export function deserializeOptimizationVersion(row: any): OptimizationVersion {
  return {
    id: row.id,
    productId: row.productId,
    version: row.version,
    originalTitle: row.originalTitle,
    originalDescription: row.originalDescription,
    originalSeoTitle: row.originalSeoTitle,
    originalSeoDescription: row.originalSeoDescription,
    optimizedTitle: row.optimizedTitle,
    optimizedDescription: row.optimizedDescription,
    optimizedSeoTitle: row.optimizedSeoTitle,
    optimizedSeoDescription: row.optimizedSeoDescription,
    aiProvider: row.aiProvider,
    tokensUsed: row.tokensUsed,
    cost: row.cost,
    responseTime: row.responseTime,
    isActive: Boolean(row.isActive),
    createdAt: new Date(row.createdAt),
  };
}

export function serializeCreateOptimizationVersionDTO(dto: CreateOptimizationVersionDTO): any {
  const sanitized = sanitizeOptimizationVersionData(dto);
  return {
    ...sanitized,
    createdAt: new Date().toISOString(),
  };
}

export function serializeUpdateOptimizationVersionDTO(dto: UpdateOptimizationVersionDTO): any {
  const sanitized = sanitizeOptimizationVersionData(dto);
  return sanitized;
}

// Content review serialization/deserialization
export function serializeContentReview(review: ContentReview): any {
  return {
    ...review,
    approvedAt: review.approvedAt?.toISOString() || null,
    createdAt: review.createdAt.toISOString(),
  };
}

export function deserializeContentReview(row: any): ContentReview {
  return {
    id: row.id,
    productId: row.productId,
    versionId: row.versionId,
    reviewer: row.reviewer,
    status: row.status,
    feedback: row.feedback,
    approvedAt: row.approvedAt ? new Date(row.approvedAt) : undefined,
    createdAt: new Date(row.createdAt),
  };
}

export function serializeCreateContentReviewDTO(dto: CreateContentReviewDTO): any {
  const sanitized = sanitizeContentReviewData(dto);
  return {
    ...sanitized,
    createdAt: new Date().toISOString(),
  };
}

export function serializeUpdateContentReviewDTO(dto: UpdateContentReviewDTO): any {
  const sanitized = sanitizeContentReviewData(dto);
  const serialized: any = { ...sanitized };

  if (sanitized.approvedAt) serialized.approvedAt = sanitized.approvedAt.toISOString();

  return serialized;
}

// AI provider serialization/deserialization
export function serializeAiProvider(provider: AiProvider): any {
  return {
    ...provider,
    lastUsed: provider.lastUsed?.toISOString() || null,
    createdAt: provider.createdAt.toISOString(),
    updatedAt: provider.updatedAt.toISOString(),
  };
}

export function deserializeAiProvider(row: any): AiProvider {
  return {
    id: row.id,
    name: row.name,
    apiKey: row.apiKey,
    baseUrl: row.baseUrl,
    isEnabled: Boolean(row.isEnabled),
    rateLimit: row.rateLimit,
    currentUsage: row.currentUsage,
    usageLimit: row.usageLimit,
    lastUsed: row.lastUsed ? new Date(row.lastUsed) : undefined,
    createdAt: new Date(row.createdAt),
  };
}

// AI usage record serialization/deserialization
export function serializeAiUsageRecord(record: AiUsageRecord): any {
  return {
    ...record,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export function deserializeAiUsageRecord(row: any): AiUsageRecord {
  return {
    id: row.id,
    providerId: row.providerId,
    productId: row.productId,
    requestType: row.requestType,
    tokensUsed: row.tokensUsed,
    cost: row.cost,
    responseTime: row.responseTime,
    success: Boolean(row.success),
    errorMessage: row.errorMessage,
    createdAt: new Date(row.createdAt),
  };
}

// Optimization job serialization/deserialization
export function serializeOptimizationJob(job: OptimizationJob): any {
  return {
    ...job,
    startedAt: job.startedAt?.toISOString() || null,
    completedAt: job.completedAt?.toISOString() || null,
    createdAt: job.createdAt.toISOString(),
  };
}

export function deserializeOptimizationJob(row: any): OptimizationJob {
  return {
    id: row.id,
    productId: row.productId,
    jobType: row.jobType,
    status: row.status,
    providerId: row.providerId,
    priority: row.priority,
    retryCount: row.retryCount,
    maxRetries: row.maxRetries,
    errorMessage: row.errorMessage,
    startedAt: row.startedAt ? new Date(row.startedAt) : undefined,
    completedAt: row.completedAt ? new Date(row.completedAt) : undefined,
    createdAt: new Date(row.createdAt),
  };
}

export function serializeCreateOptimizationJobDTO(dto: CreateOptimizationJobDTO): any {
  return {
    ...dto,
    createdAt: new Date().toISOString(),
  };
}

export function serializeUpdateOptimizationJobDTO(dto: UpdateOptimizationJobDTO): any {
  const serialized: any = { ...dto };

  if (dto.startedAt) serialized.startedAt = dto.startedAt.toISOString();
  if (dto.completedAt) serialized.completedAt = dto.completedAt.toISOString();

  return serialized;
}

// Utility functions for batch operations
export function serializeProductBatch(products: Product[]): any[] {
  return products.map(serializeProduct);
}

export function deserializeProductBatch(rows: any[]): Product[] {
  return rows.map(deserializeProduct);
}

export function serializeOptimizationVersionBatch(versions: OptimizationVersion[]): any[] {
  return versions.map(serializeOptimizationVersion);
}

export function deserializeOptimizationVersionBatch(rows: any[]): OptimizationVersion[] {
  return rows.map(deserializeOptimizationVersion);
}

// Generic serialization helpers
export function serializeDate(date: Date | undefined): string | null {
  return date ? date.toISOString() : null;
}

export function deserializeDate(dateString: string | null): Date | undefined {
  return dateString ? new Date(dateString) : undefined;
}

export function serializeBoolean(value: boolean): number {
  return value ? 1 : 0;
}

export function deserializeBoolean(value: number): boolean {
  return value === 1;
}