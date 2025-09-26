import { aiProviderRepository } from '../../repositories/aiProviderRepository';
import { aiUsageRepository } from '../../repositories/aiUsageRepository';
import { ContentReviewRepository } from '../../repositories/optimizationRepository';
import { database } from '../../utils/database';
import { CreateContentReviewDTO, AiProvider, AiUsageRecord } from '@jewelry-seo/shared';

describe('Repositories', () => {
  beforeAll(async () => {
    await database.connect();
  });

  afterAll(async () => {
    await database.close();
  });

  describe('AiProviderRepository', () => {
    it('should create and find a provider', async () => {
      const providerData: Omit<AiProvider, 'id' | 'createdAt' | 'updatedAt'> = {
        name: 'test-provider',
        apiKey: 'test-key',
        isEnabled: true,
        baseUrl: 'http://localhost:8080',
        rateLimit: 100,
        currentUsage: 0,
        usageLimit: 1000,
      };
      const provider = await aiProviderRepository.create(providerData);

      const foundProvider = await aiProviderRepository.findById(provider.id);
      expect(foundProvider).toBeDefined();
      expect(foundProvider?.name).toBe('test-provider');
    });
  });

  describe('AiUsageRepository', () => {
    it('should create and find a usage record', async () => {
      const providerData: Omit<AiProvider, 'id' | 'createdAt' | 'updatedAt'> = {
        name: 'test-provider-2',
        apiKey: 'test-key-2',
        isEnabled: true,
        baseUrl: 'http://localhost:8080',
        rateLimit: 100,
        currentUsage: 0,
        usageLimit: 1000,
      };
      const provider = await aiProviderRepository.create(providerData);

      const usageRecordData: Omit<AiUsageRecord, 'id' | 'createdAt' | 'updatedAt'> = {
        providerId: provider.id,
        requestType: 'test',
        tokensUsed: 100,
        cost: 0.1,
        responseTime: 500,
        success: true,
      };
      const usageRecord = await aiUsageRepository.create(usageRecordData);

      const foundUsageRecord = await aiUsageRepository.findById(usageRecord.id);
      expect(foundUsageRecord).toBeDefined();
      expect(foundUsageRecord?.tokensUsed).toBe(100);
    });
  });

  describe('ContentReviewRepository', () => {
    it('should create and find a content review', async () => {
      const reviewData: CreateContentReviewDTO = {
        productId: 'test-product',
        versionId: 'test-version',
        reviewer: 'test-reviewer',
        status: 'pending',
        feedback: 'looks good',
      };
      const review = await ContentReviewRepository.create(reviewData);

      const foundReview = await ContentReviewRepository.findById(review.id);
      expect(foundReview).toBeDefined();
      expect(foundReview?.status).toBe('pending');
    });
  });
});