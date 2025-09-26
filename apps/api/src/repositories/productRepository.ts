import { database } from '../utils/database';
import { logger } from '../utils/logger';
import { Product, CreateProductDTO, UpdateProductDTO } from '@jewelry-seo/shared';
import { ProductModel } from '../models/Product';

export class ProductRepository {
  static async findById(id: string): Promise<Product | null> {
    try {
      const row = await database.get(
        `SELECT * FROM products WHERE id = ?`,
        [id]
      );

      if (!row) return null;

      return this.rowToProduct(row);
    } catch (error) {
      logger.error(`Failed to find product by id ${id}:`, error);
      throw error;
    }
  }

  static async findAll(limit: number = 50, offset: number = 0): Promise<Product[]> {
    try {
      const rows = await database.all(
        `SELECT * FROM products
         ORDER BY updatedAt DESC
         LIMIT ? OFFSET ?`,
        [limit, offset]
      );

      return rows.map(row => this.rowToProduct(row));
    } catch (error) {
      logger.error('Failed to find all products:', error);
      throw error;
    }
  }

  static async findByStatus(
    status: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Product[]> {
    try {
      const rows = await database.all(
        `SELECT * FROM products
         WHERE optimizationStatus = ?
         ORDER BY updatedAt DESC
         LIMIT ? OFFSET ?`,
        [status, limit, offset]
      );

      return rows.map(row => this.rowToProduct(row));
    } catch (error) {
      logger.error(`Failed to find products by status ${status}:`, error);
      throw error;
    }
  }

  static async create(productData: CreateProductDTO): Promise<Product> {
    try {
      const validatedData = ProductModel.validateCreate(productData);
      const now = new Date();

      const product: Product = {
        id: Date.now().toString(),
        ...validatedData,
        images: validatedData.images || [],
        optimizationStatus: validatedData.optimizationStatus || 'pending',
        createdAt: now,
        updatedAt: now,
      };

      await database.run(
        `INSERT INTO products (
          id, title, description, vendor, productType, tags,
          variants, images, price, sku, seoTitle, seoDescription, optimizedDescription,
          optimizationStatus, lastOptimized, createdAt, updatedAt, shopifyData
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          product.id,
          product.title,
          product.description,
          product.vendor,
          product.productType,
          JSON.stringify(product.tags),
          JSON.stringify(product.variants),
          JSON.stringify(product.images),
          product.price,
          product.sku,
          product.seoTitle || null,
          product.seoDescription || null,
          product.optimizedDescription || null,
          product.optimizationStatus,
          product.lastOptimized?.toISOString() || null,
          product.createdAt.toISOString(),
          product.updatedAt.toISOString(),
          JSON.stringify(product),
        ]
      );

      logger.info(`Created product: ${product.id}`);
      return product;
    } catch (error) {
      logger.error('Failed to create product:', error);
      throw error;
    }
  }

  static async update(id: string, updateData: UpdateProductDTO): Promise<Product | null> {
    try {
      const existingProduct = await this.findById(id);
      if (!existingProduct) return null;

      const validatedData = ProductModel.validateUpdate(updateData);
      const now = new Date();

      const updatedProduct: Product = {
        ...existingProduct,
        ...validatedData,
        updatedAt: now,
      };

      await database.run(
        `UPDATE products SET
          title = ?, description = ?, vendor = ?, productType = ?, tags = ?,
          variants = ?, images = ?, price = ?, sku = ?, seoTitle = ?, seoDescription = ?, 
          optimizedDescription = ?, optimizationStatus = ?, lastOptimized = ?, updatedAt = ?, shopifyData = ?
        WHERE id = ?`,
        [
          updatedProduct.title,
          updatedProduct.description,
          updatedProduct.vendor,
          updatedProduct.productType,
          JSON.stringify(updatedProduct.tags),
          JSON.stringify(updatedProduct.variants),
          JSON.stringify(updatedProduct.images),
          updatedProduct.price,
          updatedProduct.sku,
          updatedProduct.seoTitle || null,
          updatedProduct.seoDescription || null,
          updatedProduct.optimizedDescription || null,
          updatedProduct.optimizationStatus,
          updatedProduct.lastOptimized?.toISOString() || null,
          updatedProduct.updatedAt.toISOString(),
          JSON.stringify(updatedProduct),
          id,
        ]
      );

      logger.info(`Updated product: ${id}`);
      return updatedProduct;
    } catch (error) {
      logger.error(`Failed to update product ${id}:`, error);
      throw error;
    }
  }

  static async upsert(productData: CreateProductDTO & { id?: string }): Promise<Product> {
    try {
      const existing = await this.findById(productData.id || '');
      if (existing) {
        return await this.update(existing.id, productData) as Product;
      }
      return await this.create(productData);
    } catch (error) {
      logger.error('Failed to upsert product:', error);
      throw error;
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      const result = await database.run(
        `DELETE FROM products WHERE id = ?`,
        [id]
      );

      const deleted = (result.changes || 0) > 0;
      if (deleted) {
        logger.info(`Deleted product: ${id}`);
      }
      return deleted;
    } catch (error) {
      logger.error(`Failed to delete product ${id}:`, error);
      throw error;
    }
  }

  static async deleteAll(): Promise<number> {
    try {
      const result = await database.run(`DELETE FROM products`);
      const count = result.changes || 0;
      logger.info(`Deleted all products: ${count} records`);
      return count;
    } catch (error) {
      logger.error('Failed to delete all products:', error);
      throw error;
    }
  }

  static async countByStatus(status?: string): Promise<number> {
    try {
      let query = 'SELECT COUNT(*) as count FROM products';
      let params: any[] = [];

      if (status) {
        query += ' WHERE optimizationStatus = ?';
        params = [status];
      }

      const result = await database.get(query, params);
      return result.count;
    } catch (error) {
      logger.error('Failed to count products:', error);
      throw error;
    }
  }

  static async getStats(): Promise<{
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    needs_review: number;
  }> {
    try {
      const statuses = ['pending', 'processing', 'completed', 'failed', 'needs_review'];
      const stats: any = { total: 0 };

      for (const status of statuses) {
        const count = await this.countByStatus(status);
        stats[status] = count;
        stats.total += count;
      }

      return stats;
    } catch (error) {
      logger.error('Failed to get product stats:', error);
      throw error;
    }
  }

  private static rowToProduct(row: any): Product {
    try {
      const productData = {
        id: row.id,
        title: row.title,
        description: row.description,
        vendor: row.vendor,
        productType: row.productType,
        price: row.price,
        sku: row.sku,
        tags: JSON.parse(row.tags || '[]'),
        variants: JSON.parse(row.variants || '[]'),
        images: JSON.parse(row.images || '[]'),
        seoTitle: row.seoTitle || undefined,
        seoDescription: row.seoDescription || undefined,
        optimizedDescription: row.optimizedDescription || undefined,
        optimizationStatus: row.optimizationStatus,
        lastOptimized: row.lastOptimized ? new Date(row.lastOptimized) : undefined,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      };
      return ProductModel.validateFromDB(productData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      console.error('Failed to parse product row:', { rowId: row.id, error: errorMessage, stack: errorStack });
      logger.error('Failed to parse product row:', { row, error });
      throw new Error(`Invalid product data in database: ${row.id}`);
    }
  }
}