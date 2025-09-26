import { database } from '../utils/database';
import { logger } from '../utils/logger';
import {
  OptimizationVersion,
  ContentReview,
  OptimizationJob,
  CreateOptimizationVersionDTO,
  UpdateOptimizationVersionDTO,
  CreateContentReviewDTO,
  UpdateContentReviewDTO,
  CreateOptimizationJobDTO,
  UpdateOptimizationJobDTO,
  ReviewStatus,
  JobStatus
} from '@jewelry-seo/shared';
import {
  OptimizationVersionModel,
  ContentReviewModel,
  OptimizationJobModel
} from '../models/Optimization';

export class OptimizationVersionRepository {
  static async findById(id: string): Promise<OptimizationVersion | null> {
    try {
      const row = await database.get(
        `SELECT * FROM optimization_versions WHERE id = ?`,
        [id]
      );

      if (!row) return null;

      return OptimizationVersionModel.fromDatabase(row);
    } catch (error) {
      logger.error(`Failed to find optimization version by id ${id}:`, error);
      throw error;
    }
  }

  static async findByProductId(productId: string, includeInactive: boolean = false): Promise<OptimizationVersion[]> {
    try {
      let query = `SELECT * FROM optimization_versions WHERE productId = ?`;
      const params: any[] = [productId];

      if (!includeInactive) {
        query += ' AND isActive = 1';
      }

      query += ' ORDER BY version DESC';

      const rows = await database.all(query, params);
      return rows.map(row => OptimizationVersionModel.fromDatabase(row));
    } catch (error) {
      logger.error(`Failed to find optimization versions by product ${productId}:`, error);
      throw error;
    }
  }

  static async findActiveByProductId(productId: string): Promise<OptimizationVersion | null> {
    try {
      const row = await database.get(
        `SELECT * FROM optimization_versions
         WHERE productId = ? AND isActive = 1
         ORDER BY version DESC
         LIMIT 1`,
        [productId]
      );

      if (!row) return null;

      return OptimizationVersionModel.fromDatabase(row);
    } catch (error) {
      logger.error(`Failed to find active optimization version by product ${productId}:`, error);
      throw error;
    }
  }

  static async create(versionData: CreateOptimizationVersionDTO): Promise<OptimizationVersion> {
    try {
      const validatedData = OptimizationVersionModel.validateCreate(versionData);
      const now = new Date();

      // Get the next version number
      const maxVersionResult = await database.get(
        `SELECT MAX(version) as maxVersion FROM optimization_versions WHERE productId = ?`,
        [validatedData.productId]
      );
      const nextVersion = (maxVersionResult.maxVersion || 0) + 1;

      const version: OptimizationVersion = {
        ...validatedData,
        id: `opt_version_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        version: nextVersion,
        createdAt: now,
      };

      await database.run(
        `INSERT INTO optimization_versions (
          id, productId, version, originalTitle, originalDescription,
          originalSeoTitle, originalSeoDescription, optimizedTitle,
          optimizedDescription, optimizedSeoTitle, optimizedSeoDescription,
          aiProvider, tokensUsed, cost, responseTime, isActive, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          version.id,
          version.productId,
          version.version,
          version.originalTitle,
          version.originalDescription,
          version.originalSeoTitle,
          version.originalSeoDescription,
          version.optimizedTitle,
          version.optimizedDescription,
          version.optimizedSeoTitle,
          version.optimizedSeoDescription,
          version.aiProvider,
          version.tokensUsed,
          version.cost,
          version.responseTime,
          version.isActive ? 1 : 0,
          version.createdAt.toISOString(),
        ]
      );

      // Deactivate previous versions
      await database.run(
        `UPDATE optimization_versions SET isActive = 0
         WHERE productId = ? AND id != ?`,
        [version.productId, version.id]
      );

      logger.info(`Created optimization version: ${version.id} for product: ${version.productId}`);
      return version;
    } catch (error) {
      logger.error('Failed to create optimization version:', error);
      throw error;
    }
  }

  static async update(id: string, updateData: UpdateOptimizationVersionDTO): Promise<OptimizationVersion | null> {
    try {
      const existing = await this.findById(id);
      if (!existing) return null;

      const validatedData = OptimizationVersionModel.validateUpdate(updateData);

      await database.run(
        `UPDATE optimization_versions SET
          optimizedTitle = ?, optimizedDescription = ?, optimizedSeoTitle = ?, optimizedSeoDescription = ?,
          tokensUsed = ?, cost = ?, responseTime = ?, isActive = ?
        WHERE id = ?`,
        [
          validatedData.optimizedTitle,
          validatedData.optimizedDescription,
          validatedData.optimizedSeoTitle,
          validatedData.optimizedSeoDescription,
          validatedData.tokensUsed,
          validatedData.cost,
          validatedData.responseTime,
          validatedData.isActive ? 1 : 0,
          id,
        ]
      );

      const updated = await this.findById(id);
      logger.info(`Updated optimization version: ${id}`);
      return updated;
    } catch (error) {
      logger.error(`Failed to update optimization version ${id}:`, error);
      throw error;
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      const result = await database.run(
        `DELETE FROM optimization_versions WHERE id = ?`,
        [id]
      );

      const deleted = (result.changes || 0) > 0;
      if (deleted) {
        logger.info(`Deleted optimization version: ${id}`);
      }
      return deleted;
    } catch (error) {
      logger.error(`Failed to delete optimization version ${id}:`, error);
      throw error;
    }
  }

  static async getStatsByProvider(): Promise<any[]> {
    try {
      const rows = await database.all(`
        SELECT
          aiProvider,
          COUNT(*) as totalVersions,
          SUM(tokensUsed) as totalTokens,
          SUM(cost) as totalCost,
          AVG(responseTime) as avgResponseTime
        FROM optimization_versions
        GROUP BY aiProvider
        ORDER BY totalVersions DESC
      `);

      return rows;
    } catch (error) {
      logger.error('Failed to get optimization stats by provider:', error);
      throw error;
    }
  }

  static async getTotalCost(): Promise<number> {
    try {
      const result = await database.get(
        `SELECT SUM(cost) as totalCost FROM optimization_versions`
      );
      return result.totalCost || 0;
    } catch (error) {
      logger.error('Failed to get total optimization cost:', error);
      throw error;
    }
  }
}

export class ContentReviewRepository {
  static async findById(id: string): Promise<ContentReview | null> {
    try {
      const row = await database.get(
        `SELECT * FROM content_reviews WHERE id = ?`,
        [id]
      );

      if (!row) return null;

      return ContentReviewModel.fromDatabase(row);
    } catch (error) {
      logger.error(`Failed to find content review by id ${id}:`, error);
      throw error;
    }
  }

  static async findByProductId(productId: string): Promise<ContentReview[]> {
    try {
      const rows = await database.all(
        `SELECT * FROM content_reviews
         WHERE productId = ?
         ORDER BY createdAt DESC`,
        [productId]
      );

      return rows.map(row => ContentReviewModel.fromDatabase(row));
    } catch (error) {
      logger.error(`Failed to find content reviews by product ${productId}:`, error);
      throw error;
    }
  }

  static async findByVersionId(versionId: string): Promise<ContentReview[]> {
    try {
      const rows = await database.all(
        `SELECT * FROM content_reviews
         WHERE versionId = ?
         ORDER BY createdAt DESC`,
        [versionId]
      );

      return rows.map(row => ContentReviewModel.fromDatabase(row));
    } catch (error) {
      logger.error(`Failed to find content reviews by version ${versionId}:`, error);
      throw error;
    }
  }

  static async findByStatus(status: ReviewStatus, limit: number = 50): Promise<ContentReview[]> {
    try {
      const rows = await database.all(
        `SELECT * FROM content_reviews
         WHERE status = ?
         ORDER BY createdAt ASC
         LIMIT ?`,
        [status, limit]
      );

      return rows.map(row => ContentReviewModel.fromDatabase(row));
    } catch (error) {
      logger.error(`Failed to find content reviews by status ${status}:`, error);
      throw error;
    }
  }

  static async create(reviewData: CreateContentReviewDTO): Promise<ContentReview> {
    try {
      const validatedData = ContentReviewModel.validateCreate(reviewData);
      const now = new Date();

      const review: ContentReview = {
        ...validatedData,
        id: `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: now,
      };

      await database.run(
        `INSERT INTO content_reviews (
          id, productId, versionId, reviewer, status, feedback, approvedAt, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          review.id,
          review.productId,
          review.versionId,
          review.reviewer,
          review.status,
          review.feedback,
          review.approvedAt?.toISOString(),
          review.createdAt.toISOString(),
        ]
      );

      logger.info(`Created content review: ${review.id} for version: ${review.versionId}`);
      return review;
    } catch (error) {
      logger.error('Failed to create content review:', error);
      throw error;
    }
  }

  static async update(id: string, updateData: UpdateContentReviewDTO): Promise<ContentReview | null> {
    try {
      const existing = await this.findById(id);
      if (!existing) return null;

      const validatedData = ContentReviewModel.validateUpdate(updateData);

      await database.run(
        `UPDATE content_reviews SET
          status = ?, feedback = ?, approvedAt = ?
        WHERE id = ?`,
        [
          validatedData.status,
          validatedData.feedback,
          validatedData.approvedAt?.toISOString(),
          id,
        ]
      );

      const updated = await this.findById(id);
      logger.info(`Updated content review: ${id}`);
      return updated;
    } catch (error) {
      logger.error(`Failed to update content review ${id}:`, error);
      throw error;
    }
  }

  static async approve(id: string, feedback?: string): Promise<ContentReview | null> {
    try {
      return await this.update(id, {
        status: 'approved',
        feedback,
        approvedAt: new Date(),
      });
    } catch (error) {
      logger.error(`Failed to approve content review ${id}:`, error);
      throw error;
    }
  }

  static async reject(id: string, feedback: string): Promise<ContentReview | null> {
    try {
      return await this.update(id, {
        status: 'rejected',
        feedback,
      });
    } catch (error) {
      logger.error(`Failed to reject content review ${id}:`, error);
      throw error;
    }
  }

  static async requestChanges(id: string, feedback: string): Promise<ContentReview | null> {
    try {
      return await this.update(id, {
        status: 'changes_requested',
        feedback,
      });
    } catch (error) {
      logger.error(`Failed to request changes for content review ${id}:`, error);
      throw error;
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      const result = await database.run(
        `DELETE FROM content_reviews WHERE id = ?`,
        [id]
      );

      const deleted = (result.changes || 0) > 0;
      if (deleted) {
        logger.info(`Deleted content review: ${id}`);
      }
      return deleted;
    } catch (error) {
      logger.error(`Failed to delete content review ${id}:`, error);
      throw error;
    }
  }

  static async getReviewStats(): Promise<any> {
    try {
      const rows = await database.all(`
        SELECT
          status,
          COUNT(*) as count,
          AVG(CASE WHEN approvedAt IS NOT NULL THEN
            (julianday(approvedAt) - julianday(createdAt)) * 24 * 60
          END) as avgResolutionMinutes
        FROM content_reviews
        GROUP BY status
      `);

      const stats: any = {};
      rows.forEach((row: any) => {
        stats[row.status] = {
          count: row.count,
          avgResolutionMinutes: Math.round((row.avgResolutionMinutes || 0) * 100) / 100,
        };
      });

      return stats;
    } catch (error) {
      logger.error('Failed to get review stats:', error);
      throw error;
    }
  }
}

export class OptimizationJobRepository {
  static async findById(id: string): Promise<OptimizationJob | null> {
    try {
      const row = await database.get(
        `SELECT * FROM optimization_jobs WHERE id = ?`,
        [id]
      );

      if (!row) return null;

      return OptimizationJobModel.fromDatabase(row);
    } catch (error) {
      logger.error(`Failed to find optimization job by id ${id}:`, error);
      throw error;
    }
  }

  static async findByProductId(productId: string): Promise<OptimizationJob[]> {
    try {
      const rows = await database.all(
        `SELECT * FROM optimization_jobs
         WHERE productId = ?
         ORDER BY createdAt DESC`,
        [productId]
      );

      return rows.map(row => OptimizationJobModel.fromDatabase(row));
    } catch (error) {
      logger.error(`Failed to find optimization jobs by product ${productId}:`, error);
      throw error;
    }
  }

  static async findByStatus(status: JobStatus, limit: number = 50): Promise<OptimizationJob[]> {
    try {
      const rows = await database.all(
        `SELECT * FROM optimization_jobs
         WHERE status = ?
         ORDER BY priority DESC, createdAt ASC
         LIMIT ?`,
        [status, limit]
      );

      return rows.map(row => OptimizationJobModel.fromDatabase(row));
    } catch (error) {
      logger.error(`Failed to find optimization jobs by status ${status}:`, error);
      throw error;
    }
  }

  static async findPendingJobs(limit: number = 50): Promise<OptimizationJob[]> {
    try {
      const rows = await database.all(
        `SELECT * FROM optimization_jobs
         WHERE status = 'pending'
         ORDER BY priority DESC, createdAt ASC
         LIMIT ?`,
        [limit]
      );

      return rows.map(row => OptimizationJobModel.fromDatabase(row));
    } catch (error) {
      logger.error('Failed to find pending optimization jobs:', error);
      throw error;
    }
  }

  static async findFailedJobsForRetry(limit: number = 50): Promise<OptimizationJob[]> {
    try {
      const rows = await database.all(
        `SELECT * FROM optimization_jobs
         WHERE status = 'failed' AND retryCount < maxRetries
         ORDER BY priority DESC, createdAt ASC
         LIMIT ?`,
        [limit]
      );

      return rows.map(row => OptimizationJobModel.fromDatabase(row));
    } catch (error) {
      logger.error('Failed to find failed optimization jobs for retry:', error);
      throw error;
    }
  }

  static async create(jobData: CreateOptimizationJobDTO): Promise<OptimizationJob> {
    try {
      const validatedData = OptimizationJobModel.validateCreate(jobData);
      const now = new Date();

      const job: OptimizationJob = {
        ...validatedData,
        id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: now,
      };

      await database.run(
        `INSERT INTO optimization_jobs (
          id, productId, jobType, status, providerId, priority,
          retryCount, maxRetries, errorMessage, startedAt, completedAt, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          job.id,
          job.productId,
          job.jobType,
          job.status,
          job.providerId,
          job.priority,
          job.retryCount,
          job.maxRetries,
          job.errorMessage,
          job.startedAt?.toISOString(),
          job.completedAt?.toISOString(),
          job.createdAt.toISOString(),
        ]
      );

      logger.info(`Created optimization job: ${job.id} for product: ${job.productId}`);
      return job;
    } catch (error) {
      logger.error('Failed to create optimization job:', error);
      throw error;
    }
  }

  static async update(id: string, updateData: UpdateOptimizationJobDTO): Promise<OptimizationJob | null> {
    try {
      const existing = await this.findById(id);
      if (!existing) return null;

      const validatedData = OptimizationJobModel.validateUpdate(updateData);

      await database.run(
        `UPDATE optimization_jobs SET
          status = ?, providerId = ?, priority = ?, retryCount = ?,
          errorMessage = ?, startedAt = ?, completedAt = ?
        WHERE id = ?`,
        [
          validatedData.status,
          validatedData.providerId,
          validatedData.priority,
          validatedData.retryCount,
          validatedData.errorMessage,
          validatedData.startedAt?.toISOString(),
          validatedData.completedAt?.toISOString(),
          id,
        ]
      );

      const updated = await this.findById(id);
      logger.info(`Updated optimization job: ${id}`);
      return updated;
    } catch (error) {
      logger.error(`Failed to update optimization job ${id}:`, error);
      throw error;
    }
  }

  static async startJob(id: string, providerId: string): Promise<OptimizationJob | null> {
    try {
      return await this.update(id, {
        status: 'running',
        providerId,
        startedAt: new Date(),
        retryCount: 0, // Reset retry count on new start
      });
    } catch (error) {
      logger.error(`Failed to start optimization job ${id}:`, error);
      throw error;
    }
  }

  static async completeJob(id: string): Promise<OptimizationJob | null> {
    try {
      return await this.update(id, {
        status: 'completed',
        completedAt: new Date(),
      });
    } catch (error) {
      logger.error(`Failed to complete optimization job ${id}:`, error);
      throw error;
    }
  }

  static async failJob(id: string, errorMessage: string): Promise<OptimizationJob | null> {
    try {
      const existing = await this.findById(id);
      if (!existing) return null;

      const newRetryCount = existing.retryCount + 1;
      const newStatus = newRetryCount >= existing.maxRetries ? 'failed' : 'pending';

      return await this.update(id, {
        status: newStatus,
        errorMessage,
        retryCount: newRetryCount,
      });
    } catch (error) {
      logger.error(`Failed to fail optimization job ${id}:`, error);
      throw error;
    }
  }

  static async cancelJob(id: string): Promise<OptimizationJob | null> {
    try {
      return await this.update(id, {
        status: 'cancelled',
      });
    } catch (error) {
      logger.error(`Failed to cancel optimization job ${id}:`, error);
      throw error;
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      const result = await database.run(
        `DELETE FROM optimization_jobs WHERE id = ?`,
        [id]
      );

      const deleted = (result.changes || 0) > 0;
      if (deleted) {
        logger.info(`Deleted optimization job: ${id}`);
      }
      return deleted;
    } catch (error) {
      logger.error(`Failed to delete optimization job ${id}:`, error);
      throw error;
    }
  }

  static async getJobStats(): Promise<any> {
    try {
      const rows = await database.all(`
        SELECT
          status,
          COUNT(*) as count,
          AVG(CASE WHEN startedAt IS NOT NULL AND completedAt IS NOT NULL THEN
            (julianday(completedAt) - julianday(startedAt)) * 24 * 60 * 60
          END) as avgDurationSeconds
        FROM optimization_jobs
        GROUP BY status
      `);

      const stats: any = {};
      rows.forEach((row: any) => {
        stats[row.status] = {
          count: row.count,
          avgDurationSeconds: Math.round((row.avgDurationSeconds || 0) * 100) / 100,
        };
      });

      return stats;
    } catch (error) {
      logger.error('Failed to get job stats:', error);
      throw error;
    }
  }

  static async cleanupOldJobs(daysOld: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await database.run(
        `DELETE FROM optimization_jobs
         WHERE status IN ('completed', 'cancelled', 'failed')
         AND createdAt < ?`,
        [cutoffDate.toISOString()]
      );

      const count = result.changes || 0;
      logger.info(`Cleaned up ${count} old optimization jobs older than ${daysOld} days`);
      return count;
    } catch (error) {
      logger.error('Failed to cleanup old optimization jobs:', error);
      throw error;
    }
  }
}