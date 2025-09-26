export interface AiUsageRecord {
  id: string;
  providerId: string;
  productId?: string;
  requestType: string;
  tokensUsed: number;
  cost: number;
  responseTime: number;
  success: boolean;
  errorMessage?: string;
  createdAt: Date;
}

export interface SystemMetrics {
  uptime: number;
  responseTime: number;
  errorRate: number;
  activeJobs: number;
  lastUpdated: Date;
}

export interface OptimizationJob {
  id: string;
  productId: string;
  status: JobStatus;
  progress: number;
  errorMessage?: string;
  startedAt?: Date;
  completedAt?: Date;
}

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface UsageAnalytics {
  usage: AiUsageRecord[];
  totalCost: number;
  totalTokens: number;
  providerBreakdown: {
    [provider: string]: {
      usage: number;
      cost: number;
      requests: number;
    };
  };
  dailyUsage: {
    [date: string]: {
      tokens: number;
      cost: number;
    };
  };
}

export interface ActivityLogEntry {
  id: string;
  timestamp: Date;
  type: 'optimization' | 'approval' | 'rejection' | 'system' | 'error';
  productId?: string;
  productName?: string;
  message: string;
  details?: any;
  severity: 'info' | 'warning' | 'error';
}

export interface SystemStatus {
  overall: 'healthy' | 'degraded' | 'down';
  services: {
    shopify: 'connected' | 'disconnected' | 'error';
    database: 'online' | 'offline' | 'maintenance';
    aiProviders: {
      gemini: 'available' | 'unavailable' | 'rate_limited';
      claude: 'available' | 'unavailable' | 'rate_limited';
      gpt: 'available' | 'unavailable' | 'rate_limited';
    };
  };
  lastChecked: Date;
}

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}