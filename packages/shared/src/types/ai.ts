export interface AiProvider {
  id: string;
  name: string;
  apiKey: string;
  baseUrl: string;
  isEnabled: boolean;
  rateLimit: number;
  currentUsage: number;
  usageLimit: number;
  lastUsed?: Date;
  createdAt: Date;
}

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

export interface GeneratedContent {
  content: string;
  provider: string;
  tokensUsed: number;
  cost: number;
}

export type AiProviderName = 'gemini' | 'claude' | 'gpt';
