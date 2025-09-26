import { config } from './index';
import { z } from 'zod';

const shopifyConfigSchema = z.object({
  apiKey: z.string().min(1),
  apiSecret: z.string().min(1),
  accessToken: z.string().min(1),
  storeName: z.string().min(1),
  baseUrl: z.string().url(),
  apiVersion: z.string().default('2024-01'),
  rateLimit: z.object({
    requests: z.number().default(40),
    interval: z.number().default(1000),
  }),
});

export const shopifyConfig = shopifyConfigSchema.parse({
  apiKey: config.shopify.apiKey,
  apiSecret: config.shopify.apiSecret,
  accessToken: config.shopify.accessToken,
  storeName: config.shopify.storeName,
  baseUrl: config.shopify.baseUrl,
  apiVersion: '2024-01',
  rateLimit: {
    requests: 40,
    interval: 1000,
  },
});

export const validateShopifyConfig = () => {
  try {
    shopifyConfigSchema.parse(shopifyConfig);
    return { valid: true, error: null };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof z.ZodError ? error.message : 'Invalid Shopify configuration',
    };
  }
};