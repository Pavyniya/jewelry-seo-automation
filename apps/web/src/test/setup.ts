import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import axios from 'axios';

// Mock axios
vi.mock('axios');

// Mock React Router
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    BrowserRouter: ({ children }: { children: React.ReactNode }) => children,
    Routes: ({ children }: { children: React.ReactNode }) => children,
    Route: ({ children }: { children: React.ReactNode }) => children,
    useNavigate: () => vi.fn(),
    useParams: () => ({}),
    useLocation: () => ({
      pathname: '/',
      search: '',
      hash: '',
      state: null
    })
  };
});

// Mock react-toast
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn()
  }
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Setup global test utilities
global.testUtils = {
  createMockProduct: (overrides = {}) => ({
    id: 'test-product-1',
    title: 'Test Product',
    vendor: 'Test Vendor',
    product_type: 'Jewelry',
    price: 99.99,
    status: 'active',
    images: ['test-image.jpg'],
    tags: ['test', 'jewelry'],
    optimizedDescription: 'Test optimized description',
    optimizationStatus: 'completed' as const,
    lastOptimized: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }),

  createMockAIProvider: (overrides = {}) => ({
    id: 'test-provider-1',
    name: 'Test Provider',
    isEnabled: true,
    rateLimit: 60,
    currentUsage: 0,
    usageLimit: 1000,
    lastUsed: new Date(),
    createdAt: new Date(),
    ...overrides
  }),

  createMockAnalytics: (overrides = {}) => ({
    keywordRankings: [],
    searchVisibility: 75.5,
    ctr: 3.2,
    organicTraffic: 1250,
    competitorAnalysis: {
      marketShare: 15.2,
      contentGap: 8,
      opportunities: ['keyword1', 'keyword2']
    },
    ...overrides
  }),

  renderWithProviders: (component: React.ReactElement, options = {}) => {
    const { wrapper, ...renderOptions } = options;
    return render(component, {
      wrapper: ({ children }) => (
        <div>{children}</div>
      ),
      ...renderOptions
    });
  },

  mockAxiosResponse: (data: any, status = 200) => ({
    data,
    status,
    statusText: 'OK',
    headers: {},
    config: {}
  }),

  mockAxiosError: (message: string, code = 500) => ({
    response: {
      status: code,
      data: { message }
    },
    isAxiosError: true,
    toJSON: () => ({})
  })
};

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Setup console mocks for cleaner test output
beforeAll(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'info').mockImplementation(() => {});
});

// Test timeout
vi.setConfig({ testTimeout: 30000 });