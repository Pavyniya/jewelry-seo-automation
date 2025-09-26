import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { shopifyConfig } from '../config/shopify';
import { logger } from '../utils/logger';
import {
  ShopifyProductResponse,
  ShopifyProductsResponse,
  ShopifyAPIError,
  SyncProgress
} from '@jewelry-seo/shared';

class ShopifyAPIErrorImpl extends Error {
  constructor(
    public status: number,
    message: string,
    public errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ShopifyAPIError';
  }
}

export class RateLimitError extends ShopifyAPIErrorImpl {
  retryAfter: number;

  constructor(retryAfter: number) {
    super(429, 'Rate limit exceeded');
    this.retryAfter = retryAfter;
    this.name = 'RateLimitError';
  }
}

export class ShopifyService {
  private api: AxiosInstance;
  private requestTimestamps: number[] = [];
  private readonly rateLimit = shopifyConfig.rateLimit;

  constructor() {
    this.api = axios.create({
      baseURL: `${shopifyConfig.baseUrl}/admin/api/${shopifyConfig.apiVersion}`,
      headers: {
        'X-Shopify-Access-Token': shopifyConfig.accessToken,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
      await this.waitForRateLimit();

      (config as any).metadata = { startTime: Date.now() };

      logger.info('Shopify API Request:', {
        method: config.method,
        url: config.url,
        params: config.params,
      });

      return config;
    });

    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        const duration = Date.now() - (response.config as any).metadata?.startTime || 0;

        logger.info('Shopify API Response:', {
          method: response.config.method,
          url: response.config.url,
          status: response.status,
          duration,
        });

        return response;
      },
      (error) => {
        if (error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after'] || 2;
          throw new RateLimitError(parseInt(retryAfter));
        }

        if (error.response?.data?.errors) {
          throw new ShopifyAPIErrorImpl(
            error.response.status,
            error.response.data?.errors?.general?.[0] || 'Shopify API error',
            error.response.data.errors
          );
        }

        throw new ShopifyAPIErrorImpl(
          error.response?.status || 0,
          error.message || 'Unknown Shopify API error'
        );
      }
    );
  }

  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const oneSecondAgo = now - this.rateLimit.interval;

    this.requestTimestamps = this.requestTimestamps.filter(
      timestamp => timestamp > oneSecondAgo
    );

    if (this.requestTimestamps.length >= this.rateLimit.requests) {
      const oldestRequest = Math.min(...this.requestTimestamps);
      const waitTime = this.rateLimit.interval - (now - oldestRequest);

      if (waitTime > 0) {
        logger.info(`Rate limit reached, waiting ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    this.requestTimestamps.push(now);
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async fetchProducts(limit = 50, pageInfo?: string): Promise<{
    products: ShopifyProductResponse[];
    hasNextPage: boolean;
    nextPageInfo?: string;
  }> {
    const params: any = {
      limit: Math.min(limit, 250),
    };

    if (pageInfo) {
      params.page_info = pageInfo;
    }

    try {
      const response = await this.api.get<ShopifyProductsResponse>('/products.json', { params });

      const linkHeader = response.headers.link;
      const hasNextPage = linkHeader?.includes('rel="next"');
      const nextPageInfo = hasNextPage ? this.extractPageInfo(linkHeader) : undefined;

      return {
        products: response.data.products,
        hasNextPage,
        nextPageInfo,
      };
    } catch (error) {
      if (error instanceof RateLimitError) {
        logger.warn(`Rate limit hit, retrying after ${error.retryAfter}s`);
        await this.delay(error.retryAfter * 1000);
        return this.fetchProducts(limit, pageInfo);
      }

      if (error instanceof ShopifyAPIErrorImpl) {
        logger.error('Shopify API error:', error);
        throw error;
      }

      logger.error('Unexpected error fetching products:', error);
      throw new ShopifyAPIErrorImpl(0, 'Failed to fetch products');
    }
  }

  async fetchAllProducts(onProgress?: (progress: SyncProgress) => void): Promise<ShopifyProductResponse[]> {
    const allProducts: ShopifyProductResponse[] = [];
    let pageInfo: string | undefined;
    let page = 1;
    const startTime = Date.now();

    logger.info('Starting to fetch all products from Shopify');

    try {
      do {
        const result = await this.fetchProducts(250, pageInfo);
        allProducts.push(...result.products);
        pageInfo = result.nextPageInfo;

        const progress: SyncProgress = {
          total: result.hasNextPage ? allProducts.length + 250 : allProducts.length,
          processed: allProducts.length,
          succeeded: allProducts.length,
          failed: 0,
          lastUpdated: new Date(),
        };

        if (onProgress) {
          onProgress(progress);
        }

        logger.info(`Fetched page ${page}, total products: ${allProducts.length}`);
        page++;

        if (result.hasNextPage) {
          await this.delay(100);
        }
      } while (pageInfo);

      const duration = Date.now() - startTime;
      logger.info(`Successfully fetched ${allProducts.length} products in ${duration}ms`);

      return allProducts;
    } catch (error) {
      logger.error('Failed to fetch all products:', error);
      throw error;
    }
  }

  async fetchProduct(id: number): Promise<ShopifyProductResponse> {
    try {
      const response = await this.api.get<{ product: ShopifyProductResponse }>(`/products/${id}.json`);
      return response.data.product;
    } catch (error) {
      if (error instanceof RateLimitError) {
        await this.delay(error.retryAfter * 1000);
        return this.fetchProduct(id);
      }

      if (error instanceof ShopifyAPIErrorImpl) {
        logger.error(`Failed to fetch product ${id}:`, error);
        throw error;
      }

      logger.error(`Unexpected error fetching product ${id}:`, error);
      throw new ShopifyAPIErrorImpl(0, `Failed to fetch product ${id}`);
    }
  }

  async getShopInfo(): Promise<{
    name: string;
    email: string;
    domain: string;
    currency: string;
  }> {
    try {
      const response = await this.api.get<{ shop: any }>('/shop.json');
      const shop = response.data.shop;

      return {
        name: shop.name,
        email: shop.email,
        domain: shop.domain,
        currency: shop.currency,
      };
    } catch (error) {
      logger.error('Failed to fetch shop info:', error);
      throw new ShopifyAPIErrorImpl(0, 'Failed to fetch shop information');
    }
  }

  private extractPageInfo(linkHeader: string): string | undefined {
    const nextLink = linkHeader.split(',').find(link => link.includes('rel="next"'));
    if (!nextLink) return undefined;

    const match = nextLink.match(/page_info=([^&>]+)/);
    return match ? match[1] : undefined;
  }
}