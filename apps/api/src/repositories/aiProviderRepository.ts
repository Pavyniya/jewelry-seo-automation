import { AiProvider } from '@jewelry-seo/shared/src/types/ai';
import { BaseRepository } from './BaseRepository';
import { database } from '../utils/database';

class AiProviderRepository extends BaseRepository<AiProvider> {
  constructor() {
    super('ai_providers');
  }

  async findByName(name: string): Promise<AiProvider | null> {
    const query = `SELECT * FROM ${this.tableName} WHERE name = ?`;
    const row = await database.get(query, [name]);
    return row ? (row as AiProvider) : null;
  }

  async toggle(id: string, isEnabled: boolean): Promise<void> {
    return this.update(id, { isEnabled });
  }
}

export const aiProviderRepository = new AiProviderRepository();
