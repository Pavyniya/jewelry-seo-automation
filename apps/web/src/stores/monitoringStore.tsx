import React, { createContext, useContext, useReducer, useEffect } from 'react';
import {
  SystemMetrics,
  UsageAnalytics,
  OptimizationJob,
  ActivityLogEntry,
  SystemStatus,
  Notification
} from '@jewelry-seo/shared/types/monitoring';

interface MonitoringState {
  systemMetrics: SystemMetrics | null;
  usageAnalytics: UsageAnalytics | null;
  jobQueue: OptimizationJob[];
  activityLog: ActivityLogEntry[];
  systemStatus: SystemStatus | null;
  notifications: Notification[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

type MonitoringAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SYSTEM_METRICS'; payload: SystemMetrics }
  | { type: 'SET_USAGE_ANALYTICS'; payload: UsageAnalytics }
  | { type: 'SET_JOB_QUEUE'; payload: OptimizationJob[] }
  | { type: 'SET_ACTIVITY_LOG'; payload: ActivityLogEntry[] }
  | { type: 'SET_SYSTEM_STATUS'; payload: SystemStatus }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'UPDATE_JOB_STATUS'; payload: { jobId: string; status: OptimizationJob['status']; progress?: number } }
  | { type: 'ADD_ACTIVITY_LOG'; payload: ActivityLogEntry }
  | { type: 'REFRESH_DATA' };

const initialState: MonitoringState = {
  systemMetrics: null,
  usageAnalytics: null,
  jobQueue: [],
  activityLog: [],
  systemStatus: null,
  notifications: [],
  loading: false,
  error: null,
  lastUpdated: null,
};

function monitoringReducer(state: MonitoringState, action: MonitoringAction): MonitoringState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };

    case 'SET_SYSTEM_METRICS':
      return {
        ...state,
        systemMetrics: action.payload,
        loading: false,
        lastUpdated: new Date()
      };

    case 'SET_USAGE_ANALYTICS':
      return {
        ...state,
        usageAnalytics: action.payload,
        loading: false,
        lastUpdated: new Date()
      };

    case 'SET_JOB_QUEUE':
      return {
        ...state,
        jobQueue: action.payload,
        loading: false,
        lastUpdated: new Date()
      };

    case 'SET_ACTIVITY_LOG':
      return {
        ...state,
        activityLog: action.payload,
        loading: false,
        lastUpdated: new Date()
      };

    case 'SET_SYSTEM_STATUS':
      return {
        ...state,
        systemStatus: action.payload,
        loading: false,
        lastUpdated: new Date()
      };

    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
      };

    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n.id === action.payload ? { ...n, read: true } : n
        ),
      };

    case 'UPDATE_JOB_STATUS':
      return {
        ...state,
        jobQueue: state.jobQueue.map(job =>
          job.id === action.payload.jobId
            ? {
                ...job,
                status: action.payload.status,
                progress: action.payload.progress ?? job.progress
              }
            : job
        ),
      };

    case 'ADD_ACTIVITY_LOG':
      return {
        ...state,
        activityLog: [action.payload, ...state.activityLog],
      };

    case 'REFRESH_DATA':
      return { ...state, lastUpdated: new Date() };

    default:
      return state;
  }
}

const MonitoringContext = createContext<{
  state: MonitoringState;
  dispatch: React.Dispatch<MonitoringAction>;
  actions: {
    fetchSystemMetrics: () => Promise<void>;
    fetchUsageAnalytics: () => Promise<void>;
    fetchJobQueue: () => Promise<void>;
    fetchActivityLog: () => Promise<void>;
    fetchSystemStatus: () => Promise<void>;
    refreshData: () => void;
    markNotificationRead: (id: string) => void;
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  };
} | null>(null);

export function MonitoringProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(monitoringReducer, initialState);

  // Mock API calls - replace with actual API integration
  const actions = {
    fetchSystemMetrics: async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        // Mock data - replace with actual API call
        const mockMetrics: SystemMetrics = {
          uptime: 99.9,
          responseTime: 245,
          errorRate: 0.1,
          activeJobs: 3,
          lastUpdated: new Date(),
        };

        setTimeout(() => {
          dispatch({ type: 'SET_SYSTEM_METRICS', payload: mockMetrics });
        }, 500);
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch system metrics' });
      }
    },

    fetchUsageAnalytics: async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        // Mock data - replace with actual API call
        const mockUsage: UsageAnalytics = {
          usage: [],
          totalCost: 0.85,
          totalTokens: 15420,
          providerBreakdown: {
            gemini: { usage: 120, cost: 0.45, requests: 45 },
            claude: { usage: 80, cost: 0.40, requests: 32 },
          },
          dailyUsage: {
            '2025-09-26': { tokens: 8200, cost: 0.42 },
            '2025-09-25': { tokens: 7220, cost: 0.43 },
          },
        };

        setTimeout(() => {
          dispatch({ type: 'SET_USAGE_ANALYTICS', payload: mockUsage });
        }, 500);
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch usage analytics' });
      }
    },

    fetchJobQueue: async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        // Mock data - replace with actual API call
        const mockJobs: OptimizationJob[] = [
          {
            id: '1',
            productId: 'prod_1',
            status: 'processing',
            progress: 75,
            startedAt: new Date(Date.now() - 5 * 60 * 1000),
          },
          {
            id: '2',
            productId: 'prod_2',
            status: 'pending',
            progress: 0,
          },
          {
            id: '3',
            productId: 'prod_3',
            status: 'completed',
            progress: 100,
            startedAt: new Date(Date.now() - 15 * 60 * 1000),
            completedAt: new Date(Date.now() - 2 * 60 * 1000),
          },
        ];

        setTimeout(() => {
          dispatch({ type: 'SET_JOB_QUEUE', payload: mockJobs });
        }, 500);
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch job queue' });
      }
    },

    fetchActivityLog: async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        // Mock data - replace with actual API call
        const mockLog: ActivityLogEntry[] = [
          {
            id: '1',
            timestamp: new Date(Date.now() - 5 * 60 * 1000),
            type: 'optimization',
            productId: 'prod_1',
            productName: 'Diamond Ring',
            message: 'SEO optimization started',
            severity: 'info',
          },
          {
            id: '2',
            timestamp: new Date(Date.now() - 10 * 60 * 1000),
            type: 'approval',
            productId: 'prod_2',
            productName: 'Gold Necklace',
            message: 'Content approved and published',
            severity: 'info',
          },
          {
            id: '3',
            timestamp: new Date(Date.now() - 15 * 60 * 1000),
            type: 'error',
            message: 'AI provider timeout - retrying with fallback',
            severity: 'warning',
          },
        ];

        setTimeout(() => {
          dispatch({ type: 'SET_ACTIVITY_LOG', payload: mockLog });
        }, 500);
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch activity log' });
      }
    },

    fetchSystemStatus: async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        // Mock data - replace with actual API call
        const mockStatus: SystemStatus = {
          overall: 'healthy',
          services: {
            shopify: 'connected',
            database: 'online',
            aiProviders: {
              gemini: 'available',
              claude: 'available',
              gpt: 'unavailable',
            },
          },
          lastChecked: new Date(),
        };

        setTimeout(() => {
          dispatch({ type: 'SET_SYSTEM_STATUS', payload: mockStatus });
        }, 500);
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch system status' });
      }
    },

    refreshData: () => {
      dispatch({ type: 'REFRESH_DATA' });
      actions.fetchSystemMetrics();
      actions.fetchUsageAnalytics();
      actions.fetchJobQueue();
      actions.fetchActivityLog();
      actions.fetchSystemStatus();
    },

    markNotificationRead: (id: string) => {
      dispatch({ type: 'MARK_NOTIFICATION_READ', payload: id });
    },

    addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => {
      const newNotification: Notification = {
        ...notification,
        id: Date.now().toString(),
        timestamp: new Date(),
      };
      dispatch({ type: 'ADD_NOTIFICATION', payload: newNotification });
    },
  };

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      actions.refreshData();
    }, 30000);

    // Initial load
    actions.refreshData();

    return () => clearInterval(interval);
  }, []);

  return (
    <MonitoringContext.Provider value={{ state, dispatch, actions }}>
      {children}
    </MonitoringContext.Provider>
  );
}

export function useMonitoringStore() {
  const context = useContext(MonitoringContext);
  if (!context) {
    throw new Error('useMonitoringStore must be used within a MonitoringProvider');
  }
  return context;
}