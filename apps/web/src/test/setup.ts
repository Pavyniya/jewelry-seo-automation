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

// Setup global test utilities
beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks();

  // Setup default mock implementations
  (axios.get as any).mockResolvedValue({ data: [] });
  (axios.post as any).mockResolvedValue({ data: {} });
  (axios.put as any).mockResolvedValue({ data: {} });
  (axios.delete as any).mockResolvedValue({ data: {} });
});

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Setup console mocks for cleaner test output
beforeAll(() => {
  // Suppress console errors during tests unless debugging
  const originalError = console.error;
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning:') || args[0].includes('Error:'))
    ) {
      return;
    }
    originalError(...args);
  };
});

afterAll(() => {
  // Restore console methods
  console.error = console.error;
});

// Test timeout
vi.setConfig({ testTimeout: 10000 });

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;