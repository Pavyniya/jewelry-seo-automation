import { database } from '../utils/database';
import { v4 as uuidv4 } from 'uuid';

export abstract class BaseRepository<T extends { id: string }> {
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  async findById(id: string): Promise<T | null> {
    const query = `SELECT * FROM ${this.tableName} WHERE id = ?`;
    const row = await database.get(query, [id]);
    return row ? (row as T) : null;
  }

  async findAll(): Promise<T[]> {
    const query = `SELECT * FROM ${this.tableName}`;
    const rows = await database.all(query);
    return rows as T[];
  }

  async create(item: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const id = uuidv4();
    const now = new Date();
    const newItem = { ...item, id, createdAt: now, updatedAt: now } as unknown as T;

    const columns = Object.keys(newItem).join(', ');
    const placeholders = Object.keys(newItem).map(() => '?').join(', ');
    const values = Object.values(newItem);

    const query = `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`;
    await database.run(query, values);

    return newItem;
  }

  async update(id: string, item: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    const now = new Date();
    const updatedItem = { ...item, updatedAt: now };

    const columns = Object.keys(updatedItem).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updatedItem), id];
    const query = `UPDATE ${this.tableName} SET ${columns} WHERE id = ?`;
    await database.run(query, values);
  }

  async delete(id: string): Promise<void> {
    const query = `DELETE FROM ${this.tableName} WHERE id = ?`;
    await database.run(query, [id]);
  }
}
