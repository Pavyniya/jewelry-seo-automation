import { database } from './database';
import { logger } from './logger';

export interface AggregationResult<T = any> {
  data: T;
  total: number;
  count: number;
  average?: number;
  min?: number;
  max?: number;
  sum?: number;
}

export interface GroupByResult {
  group: string;
  count: number;
  sum?: number;
  average?: number;
  min?: number;
  max?: number;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class DataAggregator {
  // Basic aggregation functions
  async count(tableName: string, whereClause: string = '', params: any[] = []): Promise<number> {
    try {
      let query = `SELECT COUNT(*) as total FROM ${tableName}`;
      if (whereClause) {
        query += ` WHERE ${whereClause}`;
      }

      const result = await database.get(query, params);
      return result ? result.total : 0;
    } catch (error) {
      logger.error(`Error counting from ${tableName}:`, error);
      throw error;
    }
  }

  async sum(tableName: string, column: string, whereClause: string = '', params: any[] = []): Promise<number> {
    try {
      let query = `SELECT SUM(${column}) as total FROM ${tableName}`;
      if (whereClause) {
        query += ` WHERE ${whereClause}`;
      }

      const result = await database.get(query, params);
      return result ? (result.total || 0) : 0;
    } catch (error) {
      logger.error(`Error summing ${column} from ${tableName}:`, error);
      throw error;
    }
  }

  async average(tableName: string, column: string, whereClause: string = '', params: any[] = []): Promise<number> {
    try {
      let query = `SELECT AVG(${column}) as avg FROM ${tableName}`;
      if (whereClause) {
        query += ` WHERE ${whereClause}`;
      }

      const result = await database.get(query, params);
      return result ? (result.avg || 0) : 0;
    } catch (error) {
      logger.error(`Error averaging ${column} from ${tableName}:`, error);
      throw error;
    }
  }

  async min(tableName: string, column: string, whereClause: string = '', params: any[] = []): Promise<number> {
    try {
      let query = `SELECT MIN(${column}) as min FROM ${tableName}`;
      if (whereClause) {
        query += ` WHERE ${whereClause}`;
      }

      const result = await database.get(query, params);
      return result ? (result.min || 0) : 0;
    } catch (error) {
      logger.error(`Error getting min ${column} from ${tableName}:`, error);
      throw error;
    }
  }

  async max(tableName: string, column: string, whereClause: string = '', params: any[] = []): Promise<number> {
    try {
      let query = `SELECT MAX(${column}) as max FROM ${tableName}`;
      if (whereClause) {
        query += ` WHERE ${whereClause}`;
      }

      const result = await database.get(query, params);
      return result ? (result.max || 0) : 0;
    } catch (error) {
      logger.error(`Error getting max ${column} from ${tableName}:`, error);
      throw error;
    }
  }

  // Comprehensive aggregation
  async aggregate(
    tableName: string,
    column: string,
    whereClause: string = '',
    params: any[] = []
  ): Promise<AggregationResult> {
    try {
      let query = `
        SELECT
          COUNT(*) as count,
          SUM(${column}) as sum,
          AVG(${column}) as average,
          MIN(${column}) as min,
          MAX(${column}) as max
        FROM ${tableName}
      `;

      if (whereClause) {
        query += ` WHERE ${whereClause}`;
      }

      const result = await database.get(query, params);

      return {
        data: result,
        total: result?.count || 0,
        count: result?.count || 0,
        sum: result?.sum || 0,
        average: result?.average || 0,
        min: result?.min || 0,
        max: result?.max || 0,
      };
    } catch (error) {
      logger.error(`Error aggregating ${column} from ${tableName}:`, error);
      throw error;
    }
  }

  // Group by operations
  async groupBy(
    tableName: string,
    groupColumn: string,
    valueColumn?: string,
    whereClause: string = '',
    params: any[] = []
  ): Promise<GroupByResult[]> {
    try {
      let query = `
        SELECT
          ${groupColumn} as group,
          COUNT(*) as count
      `;

      if (valueColumn) {
        query += `,
          SUM(${valueColumn}) as sum,
          AVG(${valueColumn}) as average,
          MIN(${valueColumn}) as min,
          MAX(${valueColumn}) as max
        `;
      }

      query += ` FROM ${tableName}`;

      if (whereClause) {
        query += ` WHERE ${whereClause}`;
      }

      query += ` GROUP BY ${groupColumn} ORDER BY count DESC`;

      const results = await database.all(query, params);
      return results.map(row => ({
        group: row.group,
        count: row.count,
        sum: row.sum,
        average: row.average,
        min: row.min,
        max: row.max,
      }));
    } catch (error) {
      logger.error(`Error grouping by ${groupColumn} from ${tableName}:`, error);
      throw error;
    }
  }

  // Date range aggregation
  async aggregateByDateRange(
    tableName: string,
    dateColumn: string,
    valueColumn: string,
    dateRange: DateRange,
    interval: 'day' | 'week' | 'month' = 'day'
  ): Promise<GroupByResult[]> {
    try {
      let dateFormat: string;
      switch (interval) {
        case 'day':
          dateFormat = '%Y-%m-%d';
          break;
        case 'week':
          dateFormat = '%Y-%W';
          break;
        case 'month':
          dateFormat = '%Y-%m';
          break;
      }

      const query = `
        SELECT
          strftime('${dateFormat}', ${dateColumn}) as group,
          COUNT(*) as count,
          SUM(${valueColumn}) as sum,
          AVG(${valueColumn}) as average,
          MIN(${valueColumn}) as min,
          MAX(${valueColumn}) as max
        FROM ${tableName}
        WHERE ${dateColumn} BETWEEN ? AND ?
        GROUP BY strftime('${dateFormat}', ${dateColumn})
        ORDER BY group
      `;

      const params = [dateRange.start.toISOString(), dateRange.end.toISOString()];
      const results = await database.all(query, params);

      return results.map(row => ({
        group: row.group,
        count: row.count,
        sum: row.sum,
        average: row.average,
        min: row.min,
        max: row.max,
      }));
    } catch (error) {
      logger.error(`Error aggregating by date range from ${tableName}:`, error);
      throw error;
    }
  }

  // Product-specific aggregations
  async getProductStats(
    whereClause: string = '',
    params: any[] = []
  ): Promise<{
    totalProducts: number;
    optimizedProducts: number;
    averagePrice: number;
    priceRange: { min: number; max: number };
    vendors: { name: string; count: number }[];
    productTypes: { type: string; count: number }[];
    statusDistribution: { status: string; count: number }[];
  }> {
    try {
      const [totalProducts, optimizedProducts, priceStats, vendors, productTypes, statusDistribution] = await Promise.all([
        this.count('products', whereClause, params),
        this.count('products', `${whereClause ? whereClause + ' AND ' : ''}optimizationStatus = 'completed'`, params),
        this.aggregate('products', 'price', whereClause, params),
        this.groupBy('products', 'vendor', undefined, whereClause, params),
        this.groupBy('products', 'productType', undefined, whereClause, params),
        this.groupBy('products', 'optimizationStatus', undefined, whereClause, params),
      ]);

      return {
        totalProducts,
        optimizedProducts,
        averagePrice: priceStats.average,
        priceRange: { min: priceStats.min, max: priceStats.max },
        vendors: vendors.map(v => ({ name: v.group, count: v.count })),
        productTypes: productTypes.map(t => ({ type: t.group, count: t.count })),
        statusDistribution: statusDistribution.map(s => ({ status: s.group, count: s.count })),
      };
    } catch (error) {
      logger.error('Error getting product stats:', error);
      throw error;
    }
  }

  // AI usage aggregations
  async getAiUsageStats(
    whereClause: string = '',
    params: any[] = []
  ): Promise<{
    totalTokens: number;
    totalCost: number;
    averageResponseTime: number;
    successRate: number;
    providerStats: { provider: string; tokens: number; cost: number; requests: number }[];
    usageByDate: GroupByResult[];
  }> {
    try {
      const [totalTokens, totalCost, responseTimeStats, successStats, providerStats] = await Promise.all([
        this.sum('ai_usage_records', 'tokensUsed', whereClause, params),
        this.sum('ai_usage_records', 'cost', whereClause, params),
        this.aggregate('ai_usage_records', 'responseTime', whereClause, params),
        this.groupBy('ai_usage_records', 'success', undefined, whereClause, params),
        this.groupBy('ai_usage_records', 'providerId', 'tokensUsed', whereClause, params),
      ]);

      const successRate = successStats.length > 0 ?
        (successStats.find(s => s.group === '1')?.count || 0) / (successStats.reduce((acc, curr) => acc + curr.count, 0)) * 100 : 0;

      // Get usage by date for the last 30 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const usageByDate = await this.aggregateByDateRange(
        'ai_usage_records',
        'createdAt',
        'tokensUsed',
        { start: startDate, end: endDate },
        'day'
      );

      return {
        totalTokens,
        totalCost,
        averageResponseTime: responseTimeStats.average,
        successRate,
        providerStats: providerStats.map(p => ({
          provider: p.group,
          tokens: p.sum || 0,
          cost: p.sum || 0,
          requests: p.count,
        })),
        usageByDate,
      };
    } catch (error) {
      logger.error('Error getting AI usage stats:', error);
      throw error;
    }
  }

  // Optimization job aggregations
  async getOptimizationJobStats(
    whereClause: string = '',
    params: any[] = []
  ): Promise<{
    totalJobs: number;
    successRate: number;
    averageExecutionTime: number;
    statusDistribution: { status: string; count: number }[];
    jobTypeDistribution: { type: string; count: number }[];
    jobsByDay: GroupByResult[];
  }> {
    try {
      const [totalJobs, statusDistribution, jobTypeDistribution] = await Promise.all([
        this.count('optimization_jobs', whereClause, params),
        this.groupBy('optimization_jobs', 'status', undefined, whereClause, params),
        this.groupBy('optimization_jobs', 'jobType', undefined, whereClause, params),
      ]);

      const successRate = statusDistribution.length > 0 ?
        (statusDistribution.find(s => s.group === 'completed')?.count || 0) / totalJobs * 100 : 0;

      // Get jobs by day for the last 30 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const jobsByDay = await this.aggregateByDateRange(
        'optimization_jobs',
        'createdAt',
        'tokensUsed',
        { start: startDate, end: endDate },
        'day'
      );

      return {
        totalJobs,
        successRate,
        averageExecutionTime: 0, // Would need completedAt - startedAt calculation
        statusDistribution: statusDistribution.map(s => ({ status: s.group, count: s.count })),
        jobTypeDistribution: jobTypeDistribution.map(j => ({ type: j.group, count: j.count })),
        jobsByDay,
      };
    } catch (error) {
      logger.error('Error getting optimization job stats:', error);
      throw error;
    }
  }

  // Pagination helper
  async paginate<T>(
    tableName: string,
    options: PaginationOptions,
    whereClause: string = '',
    params: any[] = []
  ): Promise<PaginationResult<T>> {
    try {
      const { page, limit, sortBy, sortOrder = 'asc' } = options;
      const offset = (page - 1) * limit;

      // Get total count
      const total = await this.count(tableName, whereClause, params);
      const totalPages = Math.ceil(total / limit);

      // Build query
      let query = `SELECT * FROM ${tableName}`;
      const queryParams = [...params];

      if (whereClause) {
        query += ` WHERE ${whereClause}`;
      }

      if (sortBy) {
        query += ` ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`;
      }

      query += ` LIMIT ? OFFSET ?`;
      queryParams.push(limit, offset);

      // Get data
      const data = await database.all(query, queryParams);

      return {
        data: data as T[],
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      logger.error(`Error paginating ${tableName}:`, error);
      throw error;
    }
  }
}

export const dataAggregator = new DataAggregator();