import { z } from 'zod';

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().url(),
  VITE_SHOPIFY_STORE_URL: z.string().url(),
});

export const env = envSchema.parse({
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
  VITE_SHOPIFY_STORE_URL: import.meta.env.VITE_SHOPIFY_STORE_URL || 'https://demo-store.myshopify.com',
});

export const config = {
  api: {
    baseUrl: env.VITE_API_BASE_URL,
  },
  shopify: {
    storeUrl: env.VITE_SHOPIFY_STORE_URL,
  },
};