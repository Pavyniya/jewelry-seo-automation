import { create } from 'zustand';
import {
  ProviderHealth,
  ProviderPerformance,
  RateLimitState,
  CostOptimization,
  OptimizationStrategy,
  ProviderSelectionResponse,
  ProviderTestResponse
} from '@jewelry-seo/shared/types/aiProvider';

interface AiProviderState {
  // Data
  providers: ProviderHealth[];
  performance: ProviderPerformance[];
  rateLimits: RateLimitState[];
  costOptimization: CostOptimization | null;
  availableProviders: any[];
  selectedProvider: string | null;
  optimizationStrategy: OptimizationStrategy;

  // Loading states
  loading: {
    health: boolean;
    performance: boolean;
    rateLimits: boolean;
    costs: boolean;
    test: boolean;
    optimization: boolean;
  };

  // Error states
  errors: {
    health: string | null;
    performance: string | null;
    rateLimits: string | null;
    costs: string | null;
    test: string | null;
    optimization: string | null;
  };

  // Actions
  fetchProviderHealth: () => Promise<void>;
  fetchProviderPerformance: () => Promise<void>;
  fetchRateLimits: () => Promise<void>;
  fetchCostAnalysis: () => Promise<void>;
  // eslint-disable-next-line no-unused-vars
  selectProvider: (contentType: string, estimatedTokens: number, requirements?: any) => Promise<ProviderSelectionResponse>;
  // eslint-disable-next-line no-unused-vars
  testProvider: (providerId: string, testType?: string, payload?: any) => Promise<ProviderTestResponse>;
  // eslint-disable-next-line no-unused-vars
  triggerFailover: (providerId: string, targetProviderId?: string) => Promise<void>;
  // eslint-disable-next-line no-unused-vars
  optimizeProviders: (strategy?: OptimizationStrategy) => Promise<void>;
  fetchAvailableProviders: () => Promise<void>;
  // eslint-disable-next-line no-unused-vars
  recordRequestResult: (providerId: string, success: boolean, responseTime: number, actualCost: number) => Promise<void>;
  // eslint-disable-next-line no-unused-vars
  setLoading: (key: 'health' | 'performance' | 'rateLimits' | 'costs' | 'test' | 'optimization', value: boolean) => void;
  // eslint-disable-next-line no-unused-vars
  setError: (key: 'health' | 'performance' | 'rateLimits' | 'costs' | 'test' | 'optimization', error: string | null) => void;
  clearErrors: () => void;
  refreshData: () => Promise<void>;
}

export const useAiProviderStore = create<AiProviderState>((set, get) => ({
  // Initial state
  providers: [],
  performance: [],
  rateLimits: [],
  costOptimization: null,
  availableProviders: [],
  selectedProvider: null,
  optimizationStrategy: 'balanced',

  loading: {
    health: false,
    performance: false,
    rateLimits: false,
    costs: false,
    test: false,
    optimization: false,
  },

  errors: {
    health: null,
    performance: null,
    rateLimits: null,
    costs: null,
    test: null,
    optimization: null,
  },

  // Actions
  fetchProviderHealth: async () => {
    const state = get();
    state.setLoading('health', true);
    state.setError('health', null);

    try {
      const response = await fetch('http://localhost:3001/api/v1/ai-providers/health');
      if (!response.ok) {
        throw new Error('Failed to fetch provider health');
      }

      const data = await response.json();
      if (data.success) {
        set({ providers: data.data });
      } else {
        throw new Error(data.error || 'Failed to fetch provider health');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      state.setError('health', errorMessage);
      console.error('Error fetching provider health:', error);
    } finally {
      state.setLoading('health', false);
    }
  },

  fetchProviderPerformance: async () => {
    const state = get();
    state.setLoading('performance', true);
    state.setError('performance', null);

    try {
      const response = await fetch('http://localhost:3001/api/v1/ai-providers/performance');
      if (!response.ok) {
        throw new Error('Failed to fetch provider performance');
      }

      const data = await response.json();
      if (data.success) {
        set({ performance: data.data });
      } else {
        throw new Error(data.error || 'Failed to fetch provider performance');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      state.setError('performance', errorMessage);
      console.error('Error fetching provider performance:', error);
    } finally {
      state.setLoading('performance', false);
    }
  },

  fetchRateLimits: async () => {
    const state = get();
    state.setLoading('rateLimits', true);
    state.setError('rateLimits', null);

    try {
      const response = await fetch('http://localhost:3001/api/v1/ai-providers/rate-limits');
      if (!response.ok) {
        throw new Error('Failed to fetch rate limits');
      }

      const data = await response.json();
      if (data.success) {
        set({ rateLimits: data.data });
      } else {
        throw new Error(data.error || 'Failed to fetch rate limits');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      state.setError('rateLimits', errorMessage);
      console.error('Error fetching rate limits:', error);
    } finally {
      state.setLoading('rateLimits', false);
    }
  },

  fetchCostAnalysis: async () => {
    const state = get();
    state.setLoading('costs', true);
    state.setError('costs', null);

    try {
      const response = await fetch('http://localhost:3001/api/v1/ai-providers/costs');
      if (!response.ok) {
        throw new Error('Failed to fetch cost analysis');
      }

      const data = await response.json();
      if (data.success) {
        set({ costOptimization: data.data.optimization });
      } else {
        throw new Error(data.error || 'Failed to fetch cost analysis');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      state.setError('costs', errorMessage);
      console.error('Error fetching cost analysis:', error);
    } finally {
      state.setLoading('costs', false);
    }
  },

  selectProvider: async (contentType: string, estimatedTokens: number, requirements?: any) => {
    const state = get();
    state.setLoading('test', true);
    state.setError('test', null);

    try {
      const response = await fetch('http://localhost:3001/api/v1/ai-providers/select', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentType,
          estimatedTokens,
          requirements
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to select provider');
      }

      const data = await response.json();
      if (data.success) {
        set({ selectedProvider: data.data.selectedProvider });
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to select provider');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      state.setError('test', errorMessage);
      console.error('Error selecting provider:', error);
      throw error;
    } finally {
      state.setLoading('test', false);
    }
  },

  testProvider: async (providerId: string, testType = 'connectivity', payload?: any) => {
    const state = get();
    state.setLoading('test', true);
    state.setError('test', null);

    try {
      const response = await fetch('http://localhost:3001/api/v1/ai-providers/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          providerId,
          testType,
          payload,
          timeout: 10000
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to test provider');
      }

      const data = await response.json();
      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to test provider');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      state.setError('test', errorMessage);
      console.error('Error testing provider:', error);
      throw error;
    } finally {
      state.setLoading('test', false);
    }
  },

  triggerFailover: async (providerId: string, targetProviderId?: string) => {
    const state = get();
    state.setLoading('optimization', true);
    state.setError('optimization', null);

    try {
      const response = await fetch('http://localhost:3001/api/v1/ai-providers/failover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          providerId,
          targetProviderId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to trigger failover');
      }

      const data = await response.json();
      if (data.success) {
        // Refresh health data after failover
        await state.fetchProviderHealth();
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to trigger failover');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      state.setError('optimization', errorMessage);
      console.error('Error triggering failover:', error);
      throw error;
    } finally {
      state.setLoading('optimization', false);
    }
  },

  optimizeProviders: async (strategy?: OptimizationStrategy) => {
    const state = get();
    state.setLoading('optimization', true);
    state.setError('optimization', null);

    try {
      const response = await fetch('http://localhost:3001/api/v1/ai-providers/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ strategy }),
      });

      if (!response.ok) {
        throw new Error('Failed to optimize providers');
      }

      const data = await response.json();
      if (data.success) {
        set({
          optimizationStrategy: data.data.currentStrategy,
          costOptimization: data.data.optimization
        });
        return data.data;
      } else {
        throw new Error(data.error || 'Failed to optimize providers');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      state.setError('optimization', errorMessage);
      console.error('Error optimizing providers:', error);
      throw error;
    } finally {
      state.setLoading('optimization', false);
    }
  },

  fetchAvailableProviders: async () => {
    try {
      const response = await fetch('http://localhost:3001/api/v1/ai-providers/available');
      if (!response.ok) {
        throw new Error('Failed to fetch available providers');
      }

      const data = await response.json();
      if (data.success) {
        set({ availableProviders: data.data });
      } else {
        throw new Error(data.error || 'Failed to fetch available providers');
      }
    } catch (error) {
      console.error('Error fetching available providers:', error);
    }
  },

  recordRequestResult: async (providerId: string, success: boolean, responseTime: number, actualCost: number) => {
    try {
      await fetch('http://localhost:3001/api/v1/ai-providers/record-result', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          providerId,
          success,
          responseTime,
          actualCost
        }),
      });
    } catch (error) {
      console.error('Error recording request result:', error);
    }
  },

  setLoading: (key, value) => {
    set((state) => ({
      loading: { ...state.loading, [key]: value }
    }));
  },

  setError: (key, error) => {
    set((state) => ({
      errors: { ...state.errors, [key]: error }
    }));
  },

  clearErrors: () => {
    set({
      errors: {
        health: null,
        performance: null,
        rateLimits: null,
        costs: null,
        test: null,
        optimization: null,
      }
    });
  },

  refreshData: async () => {
    const state = get();
    state.clearErrors();

    await Promise.all([
      state.fetchProviderHealth(),
      state.fetchProviderPerformance(),
      state.fetchRateLimits(),
      state.fetchCostAnalysis(),
      state.fetchAvailableProviders()
    ]);
  },
}));