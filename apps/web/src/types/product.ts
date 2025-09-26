export interface Product {
  id: string;
  title: string;
  vendor?: string;
  product_type?: string;
  variants?: Array<{
    price: string;
    sku?: string;
  }>;
  status: 'active' | 'inactive' | 'draft' | 'processing';
  seoScore?: number;
  lastOptimized?: string;
  updatedAt?: string;
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
  description?: string;
}
