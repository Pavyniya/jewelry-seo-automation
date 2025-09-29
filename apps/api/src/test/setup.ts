import { jest } from '@jest/globals';
import { database } from '../utils/database';
import { aiProviderEngine } from '../services/aiProviderEngine';

// Mock external dependencies
jest.mock('../utils/database', () => ({
  database: {
    run: jest.fn(),
    get: jest.fn(),
    all: jest.fn(),
    close: jest.fn()
  }
}));

jest.mock('../services/aiProviderEngine', () => ({
  aiProviderEngine: {
    generateContent: jest.fn(),
    getProviders: jest.fn(),
    toggleProvider: jest.fn()
  }
}));

// Global test setup
beforeAll(async () => {
  // Setup test environment
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = ':memory:';

  // Mock logger
  jest.mock('../utils/logger', () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }));
});

beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();

  // Reset mock implementations
  if (database.run) {
    (database.run as jest.Mock).mockResolvedValue({});
  }
  if (database.get) {
    (database.get as jest.Mock).mockResolvedValue(null);
  }
  if (database.all) {
    (database.all as jest.Mock).mockResolvedValue([]);
  }
});

afterAll(async () => {
  // Cleanup after all tests
  if (database.close) {
    await database.close();
  }
});

// Global test utilities
global.testUtils = {
  createMockProduct: (overrides = {}) => ({
    id: 'test-product-1',
    title: 'Test Product',
    description: 'Test Description',
    price: 99.99,
    vendor: 'Test Vendor',
    productType: 'Jewelry',
    tags: ['test', 'jewelry'],
    images: ['test-image.jpg'],
    variants: [],
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }),

  createMockAIProvider: (overrides = {}) => ({
    id: 'test-provider-1',
    name: 'Test Provider',
    apiKey: 'test-key',
    baseUrl: 'https://api.test.com',
    isEnabled: true,
    rateLimit: 60,
    currentUsage: 0,
    usageLimit: 1000,
    createdAt: new Date(),
    ...overrides
  }),

  createMockUser: (overrides = {}) => ({
    id: 'test-user-1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'admin',
    createdAt: new Date(),
    ...overrides
  }),

  mockApiResponse: (data: any, status = 200) => ({
    status,
    data,
    headers: {},
    config: {}
  }),

  mockError: (message: string, code = 500) => ({
    response: {
      status: code,
      data: { message }
    }
  })
};

// Test timeout handling
jest.setTimeout(30000);