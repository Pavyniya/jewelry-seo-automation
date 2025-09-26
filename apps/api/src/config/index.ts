import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),

  // Shopify API
  SHOPIFY_API_KEY: z.string().min(1),
  SHOPIFY_API_SECRET: z.string().min(1),
  SHOPIFY_ACCESS_TOKEN: z.string().min(1),
  SHOPIFY_STORE_NAME: z.string().min(1),

  // AI Service
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_MODEL: z.string().default('gpt-4'),
  GEMINI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),

  // Database (optional for SQLite)
  DATABASE_URL: z.string().optional(),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FILE_PATH: z.string().default('logs/app.log'),

  // CORS
  FRONTEND_URL: z.string().url(),
});

// Try to parse environment, but allow missing values for development
let env;
try {
  env = envSchema.parse(process.env);
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.warn('Environment validation failed, using defaults for development:', errorMessage);
  // Create a minimal valid environment for development
  env = {
    NODE_ENV: 'development',
    PORT: 3001,
    SHOPIFY_API_KEY: 'dev_key',
    SHOPIFY_API_SECRET: 'dev_secret',
    SHOPIFY_ACCESS_TOKEN: 'dev_token',
    SHOPIFY_STORE_NAME: 'dev-store.myshopify.com',
    OPENAI_API_KEY: 'dev_openai_key',
    OPENAI_MODEL: 'gpt-4',
    GEMINI_API_KEY: 'dev_gemini_key',
    ANTHROPIC_API_KEY: 'dev_anthropic_key',
    DATABASE_URL: undefined,
    LOG_LEVEL: 'info',
    LOG_FILE_PATH: 'logs/app.log',
    FRONTEND_URL: 'http://localhost:4000',
  };
}

export const config = {
  env: env.NODE_ENV,
  port: env.PORT,

  shopify: {
    apiKey: env.SHOPIFY_API_KEY,
    apiSecret: env.SHOPIFY_API_SECRET,
    accessToken: env.SHOPIFY_ACCESS_TOKEN,
    storeName: env.SHOPIFY_STORE_NAME,
    baseUrl: `https://${env.SHOPIFY_STORE_NAME}`,
  },

  ai: {
    openaiApiKey: env.OPENAI_API_KEY,
    openaiModel: env.OPENAI_MODEL,
    geminiApiKey: env.GEMINI_API_KEY,
    anthropicApiKey: env.ANTHROPIC_API_KEY,
  },

  database: {
    url: env.DATABASE_URL,
  },

  logging: {
    level: env.LOG_LEVEL,
    filePath: env.LOG_FILE_PATH,
  },

  cors: {
    origin: env.FRONTEND_URL,
  },

  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
};