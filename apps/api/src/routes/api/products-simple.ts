import { Router, Request, Response } from 'express';
import { logger } from '../../utils/logger';
import { ShopifyService } from '../../services/shopifyService';

const router: Router = Router();
const shopifyService = new ShopifyService();

// Cache for products to avoid repeated API calls
let cachedProducts: any[] | null = null;
let lastCacheTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Function to get products (from cache or API)
async function getProducts() {
  const now = Date.now();

  // Return cached products if still valid
  if (cachedProducts && (now - lastCacheTime) < CACHE_DURATION) {
    return cachedProducts;
  }

  try {
    // Fetch ALL products from Shopify (handles pagination automatically)
    const shopifyProducts = await shopifyService.fetchAllProducts();

    // Transform Shopify products to our format
    const transformedProducts = shopifyProducts.map(product => ({
      id: product.id.toString(),
      title: product.title,
      description: product.body_html || '',
      vendor: product.vendor,
      productType: product.product_type,
      tags: product.tags ? product.tags.split(', ') : [],
      variants: product.variants.map(variant => ({
        id: variant.id.toString(),
        title: variant.title,
        price: parseFloat(variant.price),
        sku: variant.sku,
        inventoryQuantity: variant.inventory_quantity || 0,
        available: variant.available,
      })),
      status: product.status === 'active' ? 'completed' : 'pending',
      seoTitle: product.seo_title || product.title,
      seoDescription: product.meta_description_global || product.body_html?.substring(0, 160) || '',
      createdAt: product.created_at,
      updatedAt: product.updated_at,
    }));

    // Cache the results
    cachedProducts = transformedProducts;
    lastCacheTime = now;

    return transformedProducts;
  } catch (error) {
    logger.error('Failed to fetch products from Shopify:', error);
    // No fallback to fake/mock data - return empty array instead
    return [];
  }
}

/**
 * @route   GET /api/v1/products
 * @desc    Get all products with optional filtering
 * @access  Private
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, limit = '50', offset = '0' } = req.query;

    const products = await getProducts();
    let filteredProducts = [...products];

    // Filter by status if provided
    if (status && typeof status === 'string') {
      filteredProducts = filteredProducts.filter(product => product.status === status);
    }

    // Parse limit and offset
    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);

    // Apply pagination
    const paginatedProducts = filteredProducts.slice(offsetNum, offsetNum + limitNum);

    logger.info('Products retrieved', {
      count: paginatedProducts.length,
      total: filteredProducts.length,
      status,
      limit: limitNum,
      offset: offsetNum
    });

    res.json({
      success: true,
      data: {
        products: paginatedProducts,
        pagination: {
          total: filteredProducts.length,
          limit: limitNum,
          offset: offsetNum,
          hasMore: offsetNum + limitNum < filteredProducts.length,
        },
      },
      message: 'Products retrieved successfully',
    });
  } catch (error) {
    logger.error('Error getting products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve products',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @route   GET /api/v1/products/stats
 * @desc    Get product statistics
 * @access  Private
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const products = await getProducts();
    // Calculate actual product types from real data
    const productTypes = products.reduce((acc, product) => {
      const type = product.productType || 'Other';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const stats = {
      total: products.length,
      byStatus: {
        pending: products.filter(p => p.status === 'pending').length,
        processing: products.filter(p => p.status === 'processing').length,
        completed: products.filter(p => p.status === 'completed').length,
        needs_review: products.filter(p => p.status === 'needs_review').length,
        failed: products.filter(p => p.status === 'failed').length,
      },
      byType: productTypes,
      // Remove artificial totalValue - this isn't meaningful business data
      // totalValue: 0,
    };

    logger.info('Product stats retrieved', stats);

    res.json({
      success: true,
      data: stats,
      message: 'Product statistics retrieved successfully',
    });
  } catch (error) {
    logger.error('Error getting product stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve product statistics',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @route   GET /api/v1/products/stats/overview
 * @desc    Get product statistics overview for dashboard
 * @access  Private
 */
router.get('/stats/overview', async (req: Request, res: Response) => {
  try {
    const products = await getProducts();

    const stats = {
      total: products.length,
      pending: products.filter(p => p.status === 'pending').length,
      processing: products.filter(p => p.status === 'processing').length,
      completed: products.filter(p => p.status === 'completed').length,
      failed: products.filter(p => p.status === 'failed').length,
      needs_review: products.filter(p => p.status === 'needs_review').length,
      avgOptimizationTime: 0,
      lastSyncTime: new Date().toISOString()
    };

    logger.info('Product stats overview retrieved', stats);

    res.json({
      success: true,
      data: stats,
      message: 'Product statistics overview retrieved successfully',
    });
  } catch (error) {
    logger.error('Error getting product stats overview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve product statistics overview',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @route   POST /api/v1/products/sync
 * @desc    Sync products from Shopify
 * @access  Private
 */
router.post('/sync', async (req: Request, res: Response) => {
  try {
    // Clear cache to force refresh from Shopify
    cachedProducts = null;
    lastCacheTime = 0;

    // Fetch fresh products
    const products = await getProducts();

    logger.info('Products synced successfully', { count: products.length });

    res.json({
      success: true,
      data: {
        synced: products.length,
        message: 'Products synced successfully from Shopify'
      },
    });
  } catch (error) {
    logger.error('Error syncing products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync products',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @route   GET /api/v1/products/:id
 * @desc    Get a single product by ID
 * @access  Private
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const products = await getProducts();
    const product = products.find(p => p.id === id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    logger.info('Product retrieved', { productId: id });

    res.json({
      success: true,
      data: product,
      message: 'Product retrieved successfully',
    });
  } catch (error) {
    logger.error('Error getting product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve product',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;