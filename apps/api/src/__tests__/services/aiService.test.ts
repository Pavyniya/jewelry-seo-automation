import { aiService } from '../services/aiService';
import { AIProvider } from '@jewelry-seo/shared/types/automation';

// Mock dependencies
jest.mock('../utils/database', () => ({
  db: {
    query: jest.fn(),
    run: jest.fn(),
    get: jest.fn(),
    all: jest.fn()
  }
}));

const mockDb = require('../utils/database').db;

describe('AI Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProviders', () => {
    it('should return all AI providers', async () => {
      const mockProviders: AIProvider[] = [
        {
          id: 'openai',
          name: 'OpenAI',
          isEnabled: true,
          rateLimit: 100,
          currentUsage: 45,
          usageLimit: 1000,
          lastUsed: new Date(),
          createdAt: new Date()
        }
      ];

      mockDb.all.mockResolvedValue(mockProviders);

      const result = await aiService.getProviders();

      expect(result).toEqual(mockProviders);
      expect(mockDb.all).toHaveBeenCalledWith('SELECT * FROM ai_providers ORDER BY name');
    });

    it('should handle database errors', async () => {
      mockDb.all.mockRejectedValue(new Error('Database error'));

      await expect(aiService.getProviders()).rejects.toThrow('Database error');
    });
  });

  describe('getProviderById', () => {
    it('should return provider by ID', async () => {
      const mockProvider: AIProvider = {
        id: 'openai',
        name: 'OpenAI',
        isEnabled: true,
        rateLimit: 100,
        currentUsage: 45,
        usageLimit: 1000,
        lastUsed: new Date(),
        createdAt: new Date()
      };

      mockDb.get.mockResolvedValue(mockProvider);

      const result = await aiService.getProviderById('openai');

      expect(result).toEqual(mockProvider);
      expect(mockDb.get).toHaveBeenCalledWith('SELECT * FROM ai_providers WHERE id = ?', ['openai']);
    });

    it('should return null if provider not found', async () => {
      mockDb.get.mockResolvedValue(null);

      const result = await aiService.getProviderById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('updateProvider', () => {
    it('should update provider successfully', async () => {
      const updateData = {
        name: 'Updated Provider',
        isEnabled: false,
        rateLimit: 200
      };

      mockDb.run.mockResolvedValue({ changes: 1 });
      mockDb.get.mockResolvedValue({
        id: 'openai',
        ...updateData,
        currentUsage: 45,
        usageLimit: 1000,
        lastUsed: new Date(),
        createdAt: new Date()
      });

      const result = await aiService.updateProvider('openai', updateData);

      expect(result).toEqual(expect.objectContaining(updateData));
      expect(mockDb.run).toHaveBeenCalledWith(
        'UPDATE ai_providers SET name = ?, isEnabled = ?, rateLimit = ? WHERE id = ?',
        ['Updated Provider', false, 200, 'openai']
      );
    });

    it('should throw error if provider not found', async () => {
      mockDb.run.mockResolvedValue({ changes: 0 });

      await expect(aiService.updateProvider('nonexistent', { name: 'Test' }))
        .rejects.toThrow('Provider not found');
    });
  });

  describe('generateContent', () => {
    it('should generate content using AI provider', async () => {
      const mockProvider: AIProvider = {
        id: 'openai',
        name: 'OpenAI',
        isEnabled: true,
        rateLimit: 100,
        currentUsage: 45,
        usageLimit: 1000,
        lastUsed: new Date(),
        createdAt: new Date()
      };

      const mockResponse = {
        content: 'Generated SEO content',
        tokens: 150,
        cost: 0.002
      };

      mockDb.get.mockResolvedValue(mockProvider);
      mockDb.run.mockResolvedValue({ changes: 1 });

      // Mock AI API call
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ choices: [{ message: { content: 'Generated SEO content' } }] })
      });

      const result = await aiService.generateContent('openai', {
        prompt: 'Generate SEO content',
        maxTokens: 200
      });

      expect(result.content).toBe('Generated SEO content');
      expect(mockDb.run).toHaveBeenCalledWith(
        'UPDATE ai_providers SET currentUsage = currentUsage + ?, lastUsed = ? WHERE id = ?',
        [150, expect.any(Date), 'openai']
      );
    });

    it('should throw error if provider is disabled', async () => {
      const mockProvider: AIProvider = {
        id: 'openai',
        name: 'OpenAI',
        isEnabled: false,
        rateLimit: 100,
        currentUsage: 45,
        usageLimit: 1000,
        lastUsed: new Date(),
        createdAt: new Date()
      };

      mockDb.get.mockResolvedValue(mockProvider);

      await expect(aiService.generateContent('openai', { prompt: 'Test' }))
        .rejects.toThrow('Provider is disabled');
    });

    it('should throw error if usage limit exceeded', async () => {
      const mockProvider: AIProvider = {
        id: 'openai',
        name: 'OpenAI',
        isEnabled: true,
        rateLimit: 100,
        currentUsage: 950,
        usageLimit: 1000,
        lastUsed: new Date(),
        createdAt: new Date()
      };

      mockDb.get.mockResolvedValue(mockProvider);

      await expect(aiService.generateContent('openai', { prompt: 'Test', maxTokens: 100 }))
        .rejects.toThrow('Usage limit exceeded');
    });
  });

  describe('getUsageStats', () => {
    it('should return usage statistics', async () => {
      const mockStats = [
        { providerId: 'openai', usage: 500, date: '2024-01-01' },
        { providerId: 'openai', usage: 600, date: '2024-01-02' }
      ];

      mockDb.all.mockResolvedValue(mockStats);

      const result = await aiService.getUsageStats('openai', '2024-01-01', '2024-01-02');

      expect(result).toEqual(mockStats);
      expect(mockDb.all).toHaveBeenCalledWith(
        'SELECT providerId, SUM(tokens) as usage, date FROM ai_usage WHERE providerId = ? AND date BETWEEN ? AND ? GROUP BY date',
        ['openai', '2024-01-01', '2024-01-02']
      );
    });
  });
});