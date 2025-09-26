import { AiUsageRecord } from '@jewelry-seo/shared/src/types/ai';
import { BaseRepository } from './BaseRepository';
import { database } from '../utils/database';

class AiUsageRepository extends BaseRepository<AiUsageRecord> {
  constructor() {
    super('ai_usage_records');
  }

  async findByProvider(providerId: string): Promise<AiUsageRecord[]> {
    const query = `SELECT * FROM ${this.tableName} WHERE provider_id = ?`;
    const rows = await database.all(query, [providerId]);
    return rows as AiUsageRecord[];
  }
}

export const aiUsageRepository = new AiUsageRepository();
