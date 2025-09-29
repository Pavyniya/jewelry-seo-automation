import { jest, expect } from '@jest/globals';

// Database test utilities
export const testDatabase = {
  createMockDb: () => ({
    run: jest.fn().mockResolvedValue({}),
    get: jest.fn(),
    all: jest.fn().mockResolvedValue([]),
    close: jest.fn().mockResolvedValue(true),
    exec: jest.fn().mockResolvedValue(true)
  }),

  createMockTransaction: () => ({
    run: jest.fn().mockResolvedValue({}),
    get: jest.fn(),
    all: jest.fn().mockResolvedValue([]),
    commit: jest.fn().mockResolvedValue(true),
    rollback: jest.fn().mockResolvedValue(true)
  }),

  // Mock data factories
  createTestProduct: (overrides = {}) => ({
    id: 'test-product-123',
    title: 'Test Jewelry Product',
    description: 'Beautiful test jewelry piece',
    price: 299.99,
    vendor: 'Test Vendor',
    productType: 'Ring',
    tags: ['ring', 'gold', 'diamont'],
    images: ['image1.jpg', 'image2.jpg'],
    variants: [],
    seoTitle: 'Test Ring - Beautiful Jewelry',
    seoDescription: 'Discover our beautiful test ring',
    optimizedDescription: 'Optimized description for test ring',
    optimizationStatus: 'completed',
    lastOptimized: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  }),

  createTestAIProvider: (overrides = {}) => ({
    id: 'test-provider-123',
    name: 'Test AI Provider',
    apiKey: 'test-api-key',
    baseUrl: 'https://api.test.com/v1',
    isEnabled: true,
    rateLimit: 100,
    currentUsage: 45,
    usageLimit: 1000,
    lastUsed: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    ...overrides
  }),

  createTestUser: (overrides = {}) => ({
    id: 'test-user-123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'admin',
    createdAt: new Date().toISOString(),
    ...overrides
  })
};

// API test utilities
export const testApi = {
  createMockRequest: (overrides = {}) => ({
    body: {},
    params: {},
    query: {},
    headers: {},
    user: null,
    ...overrides
  }),

  createMockResponse: () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.setHeader = jest.fn().mockReturnValue(res);
    res.end = jest.fn().mockReturnValue(res);
    return res;
  },

  createMockNext: () => jest.fn()
};

// Service test utilities
export const testServices = {
  createMockShopifyService: () => ({
    getShopInfo: jest.fn(),
    fetchProducts: jest.fn(),
    fetchProduct: jest.fn(),
    updateProductSEO: jest.fn(),
    syncProducts: jest.fn()
  }),

  createMockAIService: () => ({
    generateContent: jest.fn(),
    getProviders: jest.fn(),
    toggleProvider: jest.fn(),
    trackUsage: jest.fn()
  }),

  createMockLogger: () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn()
  })
};

// Test helpers
export const testHelpers = {
  // Async test utilities
  waitFor: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  // Mock data generation
  generateRandomString: (length = 10) =>
    Math.random().toString(36).substring(2, length + 2),

  generateTestProducts: (count = 5) =>
    Array.from({ length: count }, (_, i) =>
      testDatabase.createTestProduct({ id: `product-${i + 1}` })
    ),

  // Test assertion helpers
  assertCalledWith: (mock: jest.Mock, expected: any) => {
    expect(mock).toHaveBeenCalledWith(expected);
  },

  assertCalledTimes: (mock: jest.Mock, times: number) => {
    expect(mock).toHaveBeenCalledTimes(times);
  },

  // Error simulation
  simulateError: (error: Error, asyncFunction: Function) => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    return asyncFunction().catch(e => {
      expect(e).toBe(error);
    });
  }
};

// Environment setup for tests
export const testEnvironment = {
  setupTestEnvironment: () => {
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = ':memory:';
    process.env.SHOPIFY_API_KEY = 'test-key';
    process.env.SHOPIFY_API_SECRET = 'test-secret';
    process.env.SHOPIFY_ACCESS_TOKEN = 'test-token';
    process.env.SHOPIFY_STORE_NAME = 'test-store.myshopify.com';
  },

  cleanupTestEnvironment: () => {
    delete process.env.NODE_ENV;
    delete process.env.DATABASE_URL;
    delete process.env.SHOPIFY_API_KEY;
    delete process.env.SHOPIFY_API_SECRET;
    delete process.env.SHOPIFY_ACCESS_TOKEN;
    delete process.env.SHOPIFY_STORE_NAME;
  }
};

// Mock external services
export const mockExternalServices = {
  shopify: {
    mockGetShopInfo: jest.fn(),
    mockFetchProducts: jest.fn(),
    mockUpdateProduct: jest.fn()
  },

  aiProviders: {
    mockOpenAI: jest.fn(),
    mockAnthropic: jest.fn(),
    mockGoogleAI: jest.fn()
  },

  analytics: {
    mockTrackEvent: jest.fn(),
    mockGetMetrics: jest.fn()
  }
};