// Shared types and utilities for jewelry SEO automation

export * from './types/product';
export * from './types/ai';

export interface ShopifyProduct {
  id: string;
  title: string;
  description: string;
  tags: string[];
  handle: string;
  vendor: string;
  productType: string;
  variants: ShopifyProductVariant[];
  images: ShopifyProductImage[];
  publishedAt: string;
  updatedAt: string;
}

export interface ShopifyProductVariant {
  id: string;
  title: string;
  price: string;
  sku: string;
  available: boolean;
}

export interface ShopifyProductImage {
  id: string;
  src: string;
  altText?: string;
}

export interface SEOData {
  title: string;
  description: string;
  keywords: string[];
  altTexts: Record<string, string>;
}

export interface GenerationResult {
  productId: string;
  seoData: SEOData;
  confidence: number;
  timestamp: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}