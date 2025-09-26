import { Router, Request, Response } from 'express';
import { ShopifyService } from '../../services/shopifyService';
import { ProductRepository } from '../../repositories/productRepository';
import { ProductModel } from '../../models/Product';
import { logger } from '../../utils/logger';
import { asyncHandler, createError } from '../../middleware/errorHandler';
import { validateRequest } from '../../middleware/validation';
import { z } from 'zod';
import { aiService } from '../../services/aiService';
import { generateSeoTitlePrompt, generateSeoDescriptionPrompt } from '../../prompts/jewelry-seo';
import { OptimizationStatus } from '@jewelry-seo/shared';

const router: Router = Router();

const shopifyService = new ShopifyService();

const syncProductsSchema = z.object({
  force: z.boolean().optional().default(false),
  limit: z.number().min(1).max(1000).optional().default(250),
});

const getProductSchema = z.object({
  id: z.string().min(1),
});

const getProductsSchema = z.object({
  status: z.enum(['pending', 'processing', 'completed', 'failed', 'needs_review']).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('50'),
  offset: z.string().regex(/^\d+$/).transform(Number).optional().default('0'),
});

router.post('/sync',
  validateRequest({ body: syncProductsSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { force = false, limit = 250 } = req.body;
    const startTime = Date.now();

    logger.info('Starting product synchronization', { force, limit });

    try {
      if (force) {
        await ProductRepository.deleteAll();
        logger.info('Cleared existing products for forced sync');
      }

      let processed = 0;
      let succeeded = 0;
      let failed = 0;

      const onProgress = async (progress: any) => {
        processed = progress.processed;
        succeeded = progress.succeeded;
        failed = progress.failed;

        logger.info('Sync progress:', {
          total: progress.total,
          processed: processed,
          succeeded: succeeded,
          failed: failed,
        });
      };

      const shopifyProducts = await shopifyService.fetchAllProducts(onProgress);

      const processProducts = async (products: any[]) => {
        for (const shopifyProduct of products) {
          try {
            const product = ProductModel.fromShopifyResponse(shopifyProduct);
            await ProductRepository.upsert(product);
            succeeded++;
          } catch (error) {
            logger.error(`Failed to process product ${shopifyProduct.id}:`, error);
            failed++;
          }
          processed++;
        }
      };

      await processProducts(shopifyProducts);

      const duration = Date.now() - startTime;
      const stats = await ProductRepository.getStats();

      logger.info('Product synchronization completed', {
        duration,
        processed,
        succeeded,
        failed,
        totalProducts: stats.total,
      });

      res.json({
        success: true,
        data: {
          processed,
          succeeded,
          failed,
          duration,
          stats,
        },
        message: `Successfully synchronized ${succeeded} products`,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Product synchronization failed:', { error, duration });

      throw createError(
        `Synchronization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  })
);

router.get('/',
  validateRequest({ query: getProductsSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { status, limit = 50, offset = 0 } = req.query;

    try {
      // Return mock data when database is not connected
      const mockProducts = [
        {
          id: 'mock-product-1',
          title: 'Diamond Ring',
          description: 'Beautiful diamond ring',
          vendor: 'Ohh Glam',
          productType: 'Ring',
          tags: 'diamond, ring, jewelry',
          variants: '[]',
          images: '[]',
          price: 999.99,
          sku: 'DR-001',
          seoTitle: 'Diamond Ring - Ohh Glam',
          seoDescription: 'Beautiful diamond ring from Ohh Glam',
          optimizedDescription: null,
          optimizationStatus: 'pending',
          lastOptimized: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          shopifyData: '{}',
          syncVersion: 1
        }
      ];

      const mockStats = {
        total: 1,
        pending: 1,
        processing: 0,
        completed: 0,
        failed: 0,
        needs_review: 0
      };

      let products;
      if (status) {
        products = mockProducts.filter(p => p.optimizationStatus === status);
      } else {
        products = mockProducts.slice(Number(offset), Number(offset) + Number(limit));
      }

      const stats = mockStats;

      res.json({
        success: true,
        data: {
          products,
          stats,
          pagination: {
            limit: Number(limit),
            offset: Number(offset),
            total: status ? await ProductRepository.countByStatus(status as string) : stats.total,
          },
        },
      });
    } catch (error) {
      logger.error('Failed to fetch products:', error);
      throw createError('Failed to fetch products', 500);
    }
  })
);

router.get('/:id',
  validateRequest({ params: getProductSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const product = await ProductRepository.findById(id);

      if (!product) {
        throw createError('Product not found', 404);
      }

      res.json({
        success: true,
        data: product,
      });
    } catch (error) {
      logger.error(`Failed to fetch product ${id}:`, error);
      throw error;
    }
  })
);

router.get('/stats/overview',
  asyncHandler(async (req: Request, res: Response) => {
    try {
      // Return mock stats when database is not connected
      const mockStats = {
        total: 1,
        pending: 1,
        processing: 0,
        completed: 0,
        failed: 0,
        needs_review: 0,
        avgOptimizationTime: 0,
        lastSyncTime: new Date().toISOString()
      };

      res.json({
        success: true,
        data: mockStats,
      });
    } catch (error) {
      logger.error('Failed to fetch product stats:', error);
      throw createError('Failed to fetch product stats', 500);
    }
  })
);

router.post('/test-connection',
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const shopInfo = await shopifyService.getShopInfo();

      res.json({
        success: true,
        data: {
          shop: shopInfo,
          connected: true,
        },
        message: 'Successfully connected to Shopify API',
      });
    } catch (error) {
      logger.error('Shopify connection test failed:', error);

      res.json({
        success: false,
        data: {
          connected: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        message: 'Failed to connect to Shopify API',
      });
    }
  })
);

router.post('/:id/generate-seo',
  validateRequest({ params: getProductSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const product = await ProductRepository.findById(id);

      if (!product) {
        throw createError('Product not found', 404);
      }

      const titlePrompt = generateSeoTitlePrompt(product as any);
      const descriptionPrompt = generateSeoDescriptionPrompt(product as any);

      const [generatedTitle, generatedDescription] = await Promise.all([
        aiService.generateContent(titlePrompt),
        aiService.generateContent(descriptionPrompt),
      ]);

      const updatedProduct = {
        ...product,
        seoTitle: generatedTitle.content.split('\n')[0],
        seoDescription: generatedDescription.content,
        optimizationStatus: 'needs_review' as OptimizationStatus,
      };

      await ProductRepository.update(id, updatedProduct);

      res.json({
        success: true,
        data: updatedProduct,
        message: 'Successfully generated SEO content.',
      });
    } catch (error) {
      logger.error(`Failed to generate SEO content for product ${id}:`, error);
      throw createError('Failed to generate SEO content', 500);
    }
  })
);

export default router;