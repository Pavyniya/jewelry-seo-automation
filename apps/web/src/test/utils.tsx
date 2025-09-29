import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-hot-toast';

// Test providers wrapper
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0
      },
      mutations: {
        retry: false
      }
    }
  });

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        {children}
        <ToastContainer />
      </QueryClientProvider>
    </BrowserRouter>
  );
};

// Custom render function with providers
const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything from testing-library
export * from '@testing-library/react';
export { customRender as render };

// Mock data factories
export const mockData = {
  createProduct: (overrides = {}) => ({
    id: 'test-product-1',
    title: 'Test Jewelry Product',
    vendor: 'Test Vendor',
    product_type: 'Ring',
    price: 299.99,
    status: 'active',
    images: ['test-image.jpg'],
    tags: ['ring', 'gold', 'diamont'],
    seoTitle: 'Test Ring - Beautiful Jewelry',
    seoDescription: 'Discover our beautiful test ring',
    optimizedDescription: 'Optimized description for test ring',
    optimizationStatus: 'completed' as const,
    lastOptimized: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }),

  createAIProvider: (overrides = {}) => ({
    id: 'test-provider-1',
    name: 'Test AI Provider',
    isEnabled: true,
    rateLimit: 100,
    currentUsage: 45,
    usageLimit: 1000,
    lastUsed: new Date(),
    createdAt: new Date(),
    ...overrides
  }),

  createAnalyticsData: (overrides = {}) => ({
    keywordRankings: [
      { keyword: 'gold ring', position: 3, change: 1 },
      { keyword: 'diamont jewelry', position: 5, change: -2 }
    ],
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

  createContentStrategy: (overrides = {}) => ({
    id: 'test-strategy-1',
    name: 'Test Strategy',
    targetAudience: ['new_visitor', 'returning_customer'],
    personalizedContent: {
      title: 'Personalized Title',
      description: 'Personalized description',
      callToAction: 'Shop Now',
      personalizationScore: 85,
      confidence: 90
    },
    performance: {
      impressions: 1000,
      clicks: 35,
      conversions: 5,
      ctr: 3.5,
      conversionRate: 0.5
    },
    ...overrides
  })
};

// Mock service factories
export const mockServices = {
  createMockApiService: () => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() }
    }
  }),

  createMockAnalyticsService: () => ({
    getKeywordRankings: jest.fn(),
    getSearchVisibility: jest.fn(),
    getCompetitorAnalysis: jest.fn(),
    getTrendAnalysis: jest.fn()
  }),

  createMockProductService: () => ({
    getProducts: jest.fn(),
    getProduct: jest.fn(),
    updateProduct: jest.fn(),
    deleteProduct: jest.fn()
  })
};

// Test helpers
export const testHelpers = {
  // Async utilities
  waitFor: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  // Form helpers
  fillForm: async (form: HTMLFormElement, data: Record<string, string>) => {
    Object.entries(data).forEach(([name, value]) => {
      const input = form.querySelector(`[name="${name}"]`) as HTMLInputElement;
      if (input) {
        input.value = value;
        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
  },

  // Event simulation
  fireEventAsync: async (element: Element, event: string) => {
    element.dispatchEvent(new Event(event, { bubbles: true }));
    await testHelpers.waitFor(0);
  },

  // Component state helpers
  getComponentState: (component: React.Component) => {
    return (component as any).state || {};
  },

  // Prop helpers
  getComponentProps: (component: React.Component) => {
    return (component as any).props || {};
  }
};

// Mock configuration
export const mockConfig = {
  setupApiMocks: () => {
    const axios = require('axios');
    axios.get = jest.fn();
    axios.post = jest.fn();
    axios.put = jest.fn();
    axios.delete = jest.fn();
    axios.create = jest.fn(() => ({
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() }
      }
    }));
  },

  setupRouterMocks: () => {
    const navigate = jest.fn();
    const useParams = jest.fn(() => ({}));
    const useLocation = jest.fn(() => ({
      pathname: '/',
      search: '',
      hash: '',
      state: null
    }));

    return { navigate, useParams, useLocation };
  },

  setupStoreMocks: () => {
    const mockStore = {
      getState: jest.fn(() => ({})),
      setState: jest.fn(),
      subscribe: jest.fn(),
      destroy: jest.fn()
    };
    return mockStore;
  }
};

// Test assertion helpers
export const assertions = {
  toHaveBeenCalledWithExactly: (mock: jest.Mock, ...args: any[]) => {
    expect(mock).toHaveBeenCalledWith(...args);
  },

  toHaveBeenCalledTimesExactly: (mock: jest.Mock, times: number) => {
    expect(mock).toHaveBeenCalledTimes(times);
  },

  toBeError: (error: any, expectedMessage?: string) => {
    expect(error).toBeInstanceOf(Error);
    if (expectedMessage) {
      expect(error.message).toBe(expectedMessage);
    }
  },

  toBeWithinRange: (value: number, min: number, max: number) => {
    expect(value).toBeGreaterThanOrEqual(min);
    expect(value).toBeLessThanOrEqual(max);
  }
};

// Integration test helpers
export const integrationHelpers = {
  simulateUserJourney: async (steps: Array<() => Promise<void>>) => {
    for (const step of steps) {
      await step();
      await testHelpers.waitFor(100);
    }
  },

  waitForElementToBeVisible: async (element: Element) => {
    while (window.getComputedStyle(element).display === 'none') {
      await testHelpers.waitFor(50);
    }
  },

  simulateNetworkDelay: (delay: number = 100) => {
    return new Promise(resolve => setTimeout(resolve, delay));
  }
};