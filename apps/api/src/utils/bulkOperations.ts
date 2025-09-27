import { database } from './database';
import { logger } from './logger';
import { serializeProduct, serializeOptimizationVersion, serializeAiUsageRecord } from './serialization';
import { validateProduct, validateCreateProduct, validateOptimizationVersion, validateAiUsageRecord } from '../schemas';

export interface BulkOperationResult {
  success: boolean;
  processed: number;
  succeeded: number;
  failed: number;
  errors: string[];
  executionTime: number;
}

export interface BulkImportResult<T> extends BulkOperationResult {
  data: T[];
}

export interface BulkUpdateOptions {
  skipValidation?: boolean;
  batchSize?: number;
  continueOnError?: boolean;
  transaction?: boolean;
}

export class BulkOperationsManager {
  private static instance: BulkOperationsManager;

  static getInstance(): BulkOperationsManager {
    if (!BulkOperationsManager.instance) {
      BulkOperationsManager.instance = new BulkOperationsManager();
    }
    return BulkOperationsManager.instance;
  }

  // Bulk insert operations
  async bulkInsert<T>(
    tableName: string,
    data: T[],
    options: BulkUpdateOptions = {}
  ): Promise<BulkOperationResult> {
    const startTime = Date.now();
    const {
      skipValidation = false,
      batchSize = 100,
      continueOnError = false,
      transaction = true,
    } = options;

    const result: BulkOperationResult = {
      success: true,
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [],
      executionTime: 0,
    };

    try {
      if (data.length === 0) {
        logger.warn('Bulk insert called with empty data array');
        return result;
      }

      if (transaction) {
        await database.run('BEGIN TRANSACTION');
      }

      // Process in batches
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        const batchResult = await this.insertBatch(tableName, batch, skipValidation);

        result.processed += batchResult.processed;
        result.succeeded += batchResult.succeeded;
        result.failed += batchResult.failed;
        result.errors.push(...batchResult.errors);

        if (batchResult.failed > 0 && !continueOnError) {
          if (transaction) {
            await database.run('ROLLBACK');
          }
          result.success = false;
          break;
        }
      }

      if (transaction && result.success) {
        await database.run('COMMIT');
      }

      result.executionTime = Date.now() - startTime;

      if (result.failed > 0) {
        logger.warn(`Bulk insert completed with ${result.failed} failures out of ${result.processed} records`);
      } else {
        logger.info(`Bulk insert completed successfully: ${result.succeeded} records inserted`);
      }

      return result;
    } catch (error) {
      if (transaction) {
        await database.run('ROLLBACK');
      }

      result.success = false;
      result.executionTime = Date.now() - startTime;
      result.errors.push(String(error));

      logger.error('Bulk insert failed:', error);
      return result;
    }
  }

  private async insertBatch<T>(
    tableName: string,
    batch: T[],
    skipValidation: boolean
  ): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      success: true,
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [],
      executionTime: 0,
    };

    if (batch.length === 0) {
      return result;
    }

    try {
      // Get column names from first item
      const firstItem = batch[0] as any;
      const columns = Object.keys(firstItem);
      const placeholders = columns.map(() => '?').join(', ');
      const query = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;

      for (const item of batch) {
        result.processed++;

        try {
          // Validate if not skipped
          if (!skipValidation) {
            const validation = this.validateItem(tableName, item);
            if (!validation.isValid) {
              result.failed++;
              result.errors.push(`Validation failed: ${validation.errors.join(', ')}`);
              continue;
            }
          }

          // Convert item to array of values in the same order as columns
          const values = columns.map(col => (item as any)[col]);

          await database.run(query, values);
          result.succeeded++;
        } catch (error) {
          result.failed++;
          result.errors.push(`Failed to insert item: ${String(error)}`);
        }
      }
    } catch (error) {
      result.success = false;
      result.errors.push(`Batch insert failed: ${String(error)}`);
    }

    return result;
  }

  // Bulk update operations
  async bulkUpdate<T>(
    tableName: string,
    updates: { id: string; data: Partial<T> }[],
    options: BulkUpdateOptions = {}
  ): Promise<BulkOperationResult> {
    const startTime = Date.now();
    const {
      skipValidation = false,
      batchSize = 50,
      continueOnError = false,
      transaction = true,
    } = options;

    const result: BulkOperationResult = {
      success: true,
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [],
      executionTime: 0,
    };

    try {
      if (updates.length === 0) {
        logger.warn('Bulk update called with empty updates array');
        return result;
      }

      if (transaction) {
        await database.run('BEGIN TRANSACTION');
      }

      // Process in batches
      for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize);
        const batchResult = await this.updateBatch(tableName, batch, skipValidation);

        result.processed += batchResult.processed;
        result.succeeded += batchResult.succeeded;
        result.failed += batchResult.failed;
        result.errors.push(...batchResult.errors);

        if (batchResult.failed > 0 && !continueOnError) {
          if (transaction) {
            await database.run('ROLLBACK');
          }
          result.success = false;
          break;
        }
      }

      if (transaction && result.success) {
        await database.run('COMMIT');
      }

      result.executionTime = Date.now() - startTime;

      if (result.failed > 0) {
        logger.warn(`Bulk update completed with ${result.failed} failures out of ${result.processed} records`);
      } else {
        logger.info(`Bulk update completed successfully: ${result.succeeded} records updated`);
      }

      return result;
    } catch (error) {
      if (transaction) {
        await database.run('ROLLBACK');
      }

      result.success = false;
      result.executionTime = Date.now() - startTime;
      result.errors.push(String(error));

      logger.error('Bulk update failed:', error);
      return result;
    }
  }

  private async updateBatch<T>(
    tableName: string,
    batch: { id: string; data: Partial<T> }[],
    skipValidation: boolean
  ): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      success: true,
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [],
      executionTime: 0,
    };

    for (const { id, data } of batch) {
      result.processed++;

      try {
        // Validate if not skipped
        if (!skipValidation) {
          const validation = this.validateItem(tableName, data);
          if (!validation.isValid) {
            result.failed++;
            result.errors.push(`Validation failed for ID ${id}: ${validation.errors.join(', ')}`);
            continue;
          }
        }

        // Build update query
        const updateColumns = Object.keys(data).filter(key => key !== 'id');
        if (updateColumns.length === 0) {
          result.succeeded++; // Nothing to update
          continue;
        }

        const setClause = updateColumns.map(col => `${col} = ?`).join(', ');
        const query = `UPDATE ${tableName} SET ${setClause} WHERE id = ?`;
        const values = [...updateColumns.map(col => (data as any)[col]), id];

        const dbResult = await database.run(query, values);

        if (dbResult && 'changes' in dbResult && dbResult.changes > 0) {
          result.succeeded++;
        } else {
          result.failed++;
          result.errors.push(`No records found with ID ${id}`);
        }
      } catch (error) {
        result.failed++;
        result.errors.push(`Failed to update ID ${id}: ${String(error)}`);
      }
    }

    return result;
  }

  // Bulk delete operations
  async bulkDelete(
    tableName: string,
    ids: string[],
    options: { transaction?: boolean; batchSize?: number } = {}
  ): Promise<BulkOperationResult> {
    const startTime = Date.now();
    const { transaction = true, batchSize = 100 } = options;

    const result: BulkOperationResult = {
      success: true,
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [],
      executionTime: 0,
    };

    try {
      if (ids.length === 0) {
        logger.warn('Bulk delete called with empty ids array');
        return result;
      }

      if (transaction) {
        await database.run('BEGIN TRANSACTION');
      }

      // Process in batches
      for (let i = 0; i < ids.length; i += batchSize) {
        const batch = ids.slice(i, i + batchSize);
        const batchResult = await this.deleteBatch(tableName, batch);

        result.processed += batchResult.processed;
        result.succeeded += batchResult.succeeded;
        result.failed += batchResult.failed;
        result.errors.push(...batchResult.errors);
      }

      if (transaction && result.success) {
        await database.run('COMMIT');
      }

      result.executionTime = Date.now() - startTime;

      logger.info(`Bulk delete completed: ${result.succeeded} records deleted, ${result.failed} failed`);
      return result;
    } catch (error) {
      if (transaction) {
        await database.run('ROLLBACK');
      }

      result.success = false;
      result.executionTime = Date.now() - startTime;
      result.errors.push(String(error));

      logger.error('Bulk delete failed:', error);
      return result;
    }
  }

  private async deleteBatch(
    tableName: string,
    ids: string[]
  ): Promise<BulkOperationResult> {
    const result: BulkOperationResult = {
      success: true,
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [],
      executionTime: 0,
    };

    try {
      const placeholders = ids.map(() => '?').join(',');
      const query = `DELETE FROM ${tableName} WHERE id IN (${placeholders})`;
      const dbResult = await database.run(query, ids);

      result.processed = ids.length;
      result.succeeded = dbResult && 'changes' in dbResult ? dbResult.changes : 0;
      result.failed = result.processed - result.succeeded;

      if (result.failed > 0) {
        result.errors.push(`${result.failed} records not found for deletion`);
      }
    } catch (error) {
      result.success = false;
      result.failed = result.processed;
      result.errors.push(`Batch delete failed: ${String(error)}`);
    }

    return result;
  }

  // Specialized bulk operations for products
  async bulkImportProducts(
    products: any[],
    options: BulkUpdateOptions = {}
  ): Promise<BulkImportResult<any>> {
    const startTime = Date.now();
    const result: BulkImportResult<any> = {
      success: true,
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [],
      executionTime: 0,
      data: [],
    };

    try {
      const processedProducts = products.map(product => {
        // Generate UUID if not present
        if (!product.id) {
          product.id = require('uuid').v4();
        }

        // Set timestamps
        const now = new Date().toISOString();
        product.createdAt = product.createdAt || now;
        product.updatedAt = product.updatedAt || now;

        // Serialize nested objects
        if (product.tags && Array.isArray(product.tags)) {
          product.tags = JSON.stringify(product.tags);
        }
        if (product.variants && Array.isArray(product.variants)) {
          product.variants = JSON.stringify(product.variants);
        }
        if (product.images && Array.isArray(product.images)) {
          product.images = JSON.stringify(product.images);
        }

        return product;
      });

      const insertResult = await this.bulkInsert('products', processedProducts, options);

      Object.assign(result, insertResult);
      result.executionTime = Date.now() - startTime;
      result.data = processedProducts;

      return result;
    } catch (error) {
      result.success = false;
      result.executionTime = Date.now() - startTime;
      result.errors.push(String(error));

      logger.error('Bulk product import failed:', error);
      return result;
    }
  }

  // Validation helper
  private validateItem(tableName: string, item: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      switch (tableName) {
        case 'products':
          const productValidation = validateProduct(item);
          if (!productValidation.success) {
            errors.push(...productValidation.error.issues.map(issue => issue.message));
          }
          break;
        case 'optimization_versions':
          const versionValidation = validateOptimizationVersion(item);
          if (!versionValidation.success) {
            errors.push(...versionValidation.error.issues.map(issue => issue.message));
          }
          break;
        case 'ai_usage_records':
          const usageValidation = validateAiUsageRecord(item);
          if (!usageValidation.success) {
            errors.push(...usageValidation.error.issues.map(issue => issue.message));
          }
          break;
        // Add more table-specific validations as needed
      }
    } catch (error) {
      errors.push(`Validation error: ${String(error)}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Bulk upsert operation (insert or update)
  async bulkUpsert<T>(
    tableName: string,
    data: T[],
    uniqueKey: string = 'id',
    options: BulkUpdateOptions = {}
  ): Promise<BulkOperationResult> {
    const startTime = Date.now();
    const result: BulkOperationResult = {
      success: true,
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [],
      executionTime: 0,
    };

    try {
      if (data.length === 0) {
        logger.warn('Bulk upsert called with empty data array');
        return result;
      }

      // For SQLite, we'll use INSERT OR REPLACE
      const firstItem = data[0] as any;
      const columns = Object.keys(firstItem);
      const placeholders = columns.map(() => '?').join(', ');
      const query = `INSERT OR REPLACE INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;

      for (const item of data) {
        result.processed++;

        try {
          const values = columns.map(col => (item as any)[col]);
          await database.run(query, values);
          result.succeeded++;
        } catch (error) {
          result.failed++;
          result.errors.push(`Failed to upsert item: ${String(error)}`);
        }
      }

      result.executionTime = Date.now() - startTime;

      if (result.failed > 0) {
        logger.warn(`Bulk upsert completed with ${result.failed} failures out of ${result.processed} records`);
      } else {
        logger.info(`Bulk upsert completed successfully: ${result.succeeded} records processed`);
      }

      return result;
    } catch (error) {
      result.success = false;
      result.executionTime = Date.now() - startTime;
      result.errors.push(String(error));

      logger.error('Bulk upsert failed:', error);
      return result;
    }
  }
}

export const bulkOperations = BulkOperationsManager.getInstance();