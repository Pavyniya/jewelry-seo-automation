import { database } from '../utils/database';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export abstract class BaseRepository<T extends { id: string }> {
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  protected abstract validate(item: Partial<T>): ValidationResult;

  protected validateId(id: string): ValidationResult {
    const errors: string[] = [];

    if (!id || typeof id !== 'string') {
      errors.push('ID is required and must be a string');
    } else if (id.length < 1) {
      errors.push('ID cannot be empty');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  async findById(id: string): Promise<T | null> {
    const idValidation = this.validateId(id);
    if (!idValidation.isValid) {
      logger.warn(`Invalid ID provided to findById: ${idValidation.errors.join(', ')}`);
      throw new Error('Invalid ID provided');
    }

    try {
      const query = `SELECT * FROM ${this.tableName} WHERE id = ?`;
      const row = await database.get(query, [id]);
      return row ? (row as T) : null;
    } catch (error) {
      logger.error(`Error finding ${this.tableName} by ID ${id}:`, error);
      throw error;
    }
  }

  async findAll(limit?: number, offset?: number): Promise<T[]> {
    try {
      let query = `SELECT * FROM ${this.tableName}`;
      const params: any[] = [];

      if (limit !== undefined) {
        query += ` LIMIT ?`;
        params.push(limit);

        if (offset !== undefined) {
          query += ` OFFSET ?`;
          params.push(offset);
        }
      }

      const rows = await database.all(query, params);
      return rows as T[];
    } catch (error) {
      logger.error(`Error finding all ${this.tableName}:`, error);
      throw error;
    }
  }

  async create(item: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const validation = this.validate(item as Partial<T>);
    if (!validation.isValid) {
      const errorMsg = `Validation failed for ${this.tableName}: ${validation.errors.join(', ')}`;
      logger.warn(errorMsg);
      throw new Error(errorMsg);
    }

    try {
      const id = uuidv4();
      const now = new Date();
      const newItem = { ...item, id, createdAt: now, updatedAt: now } as unknown as T;

      const columns = Object.keys(newItem).join(', ');
      const placeholders = Object.keys(newItem).map(() => '?').join(', ');
      const values = Object.values(newItem);

      const query = `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`;
      await database.run(query, values);

      logger.info(`Created new ${this.tableName} with ID: ${id}`);
      return newItem;
    } catch (error) {
      logger.error(`Error creating ${this.tableName}:`, error);
      throw error;
    }
  }

  async update(id: string, item: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    const idValidation = this.validateId(id);
    if (!idValidation.isValid) {
      logger.warn(`Invalid ID provided to update: ${idValidation.errors.join(', ')}`);
      throw new Error('Invalid ID provided');
    }

    const validation = this.validate(item as Partial<T>);
    if (!validation.isValid) {
      const errorMsg = `Validation failed for ${this.tableName} update: ${validation.errors.join(', ')}`;
      logger.warn(errorMsg);
      throw new Error(errorMsg);
    }

    try {
      const now = new Date();
      const updatedItem = { ...item, updatedAt: now };

      const columns = Object.keys(updatedItem).map(key => `${key} = ?`).join(', ');
      const values = [...Object.values(updatedItem), id];
      const query = `UPDATE ${this.tableName} SET ${columns} WHERE id = ?`;

      const result = await database.run(query, values);

      if (result && 'changes' in result && result.changes === 0) {
        logger.warn(`No ${this.tableName} found with ID: ${id} for update`);
        throw new Error(`${this.tableName} not found`);
      }

      logger.info(`Updated ${this.tableName} with ID: ${id}`);
    } catch (error) {
      logger.error(`Error updating ${this.tableName} with ID ${id}:`, error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const idValidation = this.validateId(id);
    if (!idValidation.isValid) {
      logger.warn(`Invalid ID provided to delete: ${idValidation.errors.join(', ')}`);
      throw new Error('Invalid ID provided');
    }

    try {
      const query = `DELETE FROM ${this.tableName} WHERE id = ?`;
      const result = await database.run(query, [id]);

      if (result && 'changes' in result && result.changes === 0) {
        logger.warn(`No ${this.tableName} found with ID: ${id} for deletion`);
        throw new Error(`${this.tableName} not found`);
      }

      logger.info(`Deleted ${this.tableName} with ID: ${id}`);
    } catch (error) {
      logger.error(`Error deleting ${this.tableName} with ID ${id}:`, error);
      throw error;
    }
  }

  async count(whereClause: string = '', params: any[] = []): Promise<number> {
    try {
      let query = `SELECT COUNT(*) as total FROM ${this.tableName}`;
      if (whereClause) {
        query += ` WHERE ${whereClause}`;
      }

      const result = await database.get(query, params);
      return result ? result.total : 0;
    } catch (error) {
      logger.error(`Error counting ${this.tableName}:`, error);
      throw error;
    }
  }

  async exists(id: string): Promise<boolean> {
    try {
      const query = `SELECT 1 as exists FROM ${this.tableName} WHERE id = ?`;
      const result = await database.get(query, [id]);
      return !!result;
    } catch (error) {
      logger.error(`Error checking existence of ${this.tableName} with ID ${id}:`, error);
      throw error;
    }
  }
}
