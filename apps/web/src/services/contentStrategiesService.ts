// Content Strategies Service
// This file provides API client functions for content strategy features

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api/v1';

// Personalization Engine API
export const personalizationEngine = {
  getPersonalization: async (productId: string, customerId?: string, sessionId?: string) => {
    const response = await fetch(`${API_BASE}/content-strategies/personalization/${productId}?customerId=${customerId || ''}&sessionId=${sessionId || ''}`);
    if (!response.ok) throw new Error('Failed to get personalization data');
    return response.json();
  },

  updatePersonalization: async (productId: string, data: any) => {
    const response = await fetch(`${API_BASE}/content-strategies/personalization/${productId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update personalization');
    return response.json();
  },

  getCustomerSegments: async () => {
    const response = await fetch(`${API_BASE}/content-strategies/personalization/segments`);
    if (!response.ok) throw new Error('Failed to get customer segments');
    return response.json();
  }
};

// Behavior Analytics API
export const behaviorAnalytics = {
  getCustomerBehavior: async () => {
    const response = await fetch(`${API_BASE}/content-strategies/behavior/metrics`);
    if (!response.ok) throw new Error('Failed to get customer behavior');
    return response.json();
  },

  getBehaviorPatterns: async (timeframe?: string) => {
    const params = new URLSearchParams();
    if (timeframe) params.append('timeRange', timeframe);

    const response = await fetch(`${API_BASE}/content-strategies/behavior/metrics?${params}`);
    if (!response.ok) throw new Error('Failed to get behavior patterns');
    return response.json();
  },

  getPatterns: async (customerId?: string, timeRange?: string) => {
    const params = new URLSearchParams();
    if (customerId) params.append('customerId', customerId);
    if (timeRange) params.append('timeRange', timeRange);

    const response = await fetch(`${API_BASE}/content-strategies/behavior/metrics?${params}`);
    if (!response.ok) throw new Error('Failed to get behavior patterns');
    return response.json();
  },

  getInteractions: async (productId?: string, category?: string, limit?: number) => {
    const params = new URLSearchParams();
    if (productId) params.append('productId', productId);
    if (category) params.append('category', category);
    if (limit) params.append('limit', limit.toString());

    const response = await fetch(`${API_BASE}/content-strategies/behavior/interactions?${params}`);
    if (!response.ok) throw new Error('Failed to get interactions');
    return response.json();
  },

  trackInteraction: async (data: any) => {
    const response = await fetch(`${API_BASE}/content-strategies/behavior/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to track interaction');
    return response.json();
  }
};

// Trend Analysis API
export const trendAnalysis = {
  getCurrentTrends: async (category?: string) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);

    const response = await fetch(`${API_BASE}/content-strategies/trends/current?${params}`);
    if (!response.ok) throw new Error('Failed to get current trends');
    return response.json();
  },

  getSeasonalTrends: async () => {
    const response = await fetch(`${API_BASE}/content-strategies/trends/seasonal`);
    if (!response.ok) throw new Error('Failed to get seasonal trends');
    return response.json();
  },

  getTrendForecast: async (timeframe: string) => {
    const response = await fetch(`${API_BASE}/content-strategies/trends/forecast?timeframe=${timeframe}`);
    if (!response.ok) throw new Error('Failed to get trend forecast');
    return response.json();
  },

  getTrends: async (category?: string, timeframe?: string) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (timeframe) params.append('timeframe', timeframe);

    const response = await fetch(`${API_BASE}/content-strategies/trends?${params}`);
    if (!response.ok) throw new Error('Failed to get trends');
    return response.json();
  },

  getInsights: async (category?: string) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);

    const response = await fetch(`${API_BASE}/content-strategies/trends/insights?${params}`);
    if (!response.ok) throw new Error('Failed to get insights');
    return response.json();
  },

  getRecommendations: async (category?: string) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);

    const response = await fetch(`${API_BASE}/content-strategies/trends/recommendations?${params}`);
    if (!response.ok) throw new Error('Failed to get recommendations');
    return response.json();
  }
};

// A/B Testing Engine API
export const abTestingEngine = {
  getTests: async (status?: string) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);

    const response = await fetch(`${API_BASE}/content-strategies/ab-tests?${params}`);
    if (!response.ok) throw new Error('Failed to get A/B tests');
    return response.json();
  },

  getTestResults: async () => {
    const response = await fetch(`${API_BASE}/content-strategies/ab-tests/stats`);
    if (!response.ok) throw new Error('Failed to get A/B test results');
    return response.json();
  },

  createTest: async (data: any) => {
    const response = await fetch(`${API_BASE}/content-strategies/ab-tests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create A/B test');
    return response.json();
  },

  getResults: async (testId: string) => {
    const response = await fetch(`${API_BASE}/content-strategies/ab-tests/${testId}/results`);
    if (!response.ok) throw new Error('Failed to get A/B test results');
    return response.json();
  }
};

// Journey Optimizer API
export const journeyOptimizer = {
  getCustomerJourneys: async () => {
    const response = await fetch(`${API_BASE}/content-strategies/journey/statistics`);
    if (!response.ok) throw new Error('Failed to get customer journeys');
    return response.json();
  },

  getJourneyFunnel: async () => {
    const response = await fetch(`${API_BASE}/content-strategies/journey/funnel`);
    if (!response.ok) throw new Error('Failed to get journey funnel');
    return response.json();
  },

  getJourneyStageContent: async () => {
    const response = await fetch(`${API_BASE}/content-strategies/journey/optimization`);
    if (!response.ok) throw new Error('Failed to get journey stage content');
    return response.json();
  },

  getJourneys: async (customerId?: string, status?: string) => {
    const params = new URLSearchParams();
    if (customerId) params.append('customerId', customerId);
    if (status) params.append('status', status);

    const response = await fetch(`${API_BASE}/content-strategies/journey?${params}`);
    if (!response.ok) throw new Error('Failed to get journeys');
    return response.json();
  },

  getStages: async () => {
    const response = await fetch(`${API_BASE}/content-strategies/journey/stages`);
    if (!response.ok) throw new Error('Failed to get journey stages');
    return response.json();
  },

  optimizeJourney: async (journeyId: string, data: any) => {
    const response = await fetch(`${API_BASE}/content-strategies/journey/${journeyId}/optimize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to optimize journey');
    return response.json();
  }
};

// Dashboard API
export const contentStrategiesDashboard = {
  getOverview: async () => {
    const response = await fetch(`${API_BASE}/content-strategies/dashboard/overview`);
    if (!response.ok) throw new Error('Failed to get dashboard overview');
    return response.json();
  },

  getMetrics: async (timeRange?: string, category?: string) => {
    const params = new URLSearchParams();
    if (timeRange) params.append('timeRange', timeRange);
    if (category) params.append('category', category);

    const response = await fetch(`${API_BASE}/content-strategies/dashboard/metrics?${params}`);
    if (!response.ok) throw new Error('Failed to get dashboard metrics');
    return response.json();
  }
};