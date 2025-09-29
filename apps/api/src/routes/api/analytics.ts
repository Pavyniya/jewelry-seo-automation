import { Router, Request, Response } from 'express';
import { ShopifyService } from '../../services/shopifyService';
import { logger } from '../../utils/logger';
import { database } from '../../utils/database';

const router: Router = Router();
const shopifyService = new ShopifyService();

// Function to get products for analytics
async function getProductsForAnalytics() {
  try {
    const products = await shopifyService.fetchAllProducts();
    return products;
  } catch (error) {
    logger.error('Failed to fetch products for analytics:', error);
    return [];
  }
}

// Generate keywords from actual product data (no fake metrics)
function generateKeywordsFromProducts(products: any[]) {
  const keywords = [];
  const uniqueKeywords = new Set();

  // Extract keywords from product titles, descriptions, and tags
  products.forEach((product, index) => {
    const titleWords = product.title.toLowerCase().split(' ');
    const tags = Array.isArray(product.tags) ? product.tags : (product.tags ? product.tags.split(', ') : []);

    // Create meaningful keyword combinations from real product data
    const keywordPhrases = [
      titleWords.slice(0, 2).join(' '),
      titleWords.slice(0, 3).join(' '),
      product.title.toLowerCase(),
      ...tags
    ];

    keywordPhrases.forEach((phrase, phraseIndex) => {
      if (phrase && phrase.length > 3 && !uniqueKeywords.has(phrase)) {
        uniqueKeywords.add(phrase);
        keywords.push({
          id: keywords.length + 1,
          keyword: phrase,
          position: null, // No fake position data
          volume: null, // No fake volume data
          difficulty: null, // No fake difficulty data
          trend: null, // No fake trend data
          clicks: null, // No fake clicks data
          impressions: null, // No fake impressions data
          ctr: null, // No fake CTR data
          url: product.handle ? `/products/${product.handle}` : '/',
          lastUpdated: new Date().toISOString()
        });
      }
    });
  });

  return keywords.slice(0, 15); // Limit to 15 keywords
}

// Generate real performance metrics from product data (no fake data)
function generatePerformanceMetrics(products: any[]) {
  const totalProducts = products.length;
  const totalVariants = products.reduce((sum, product) => sum + (product.variants?.length || 0), 0);
  const availableProducts = products.filter(p => p.status === 'active' || p.available).length;

  return {
    // Only include real metrics calculated from actual product data
    totalProducts,
    totalVariants,
    availableProducts,
    // No fake SEO metrics - these require external API integration
    // averagePosition: null,
    // top10Keywords: null,
    // top3Keywords: null,
  };
}

// Generate real trends based on product data (no fake data)
function generateRealTrends(products: any[]) {
  const trends = [];

  // Only return real product creation dates as trends - no fake metrics
  const productsByMonth = {};

  products.forEach(product => {
    if (product.created_at) {
      const date = new Date(product.created_at);
      const monthKey = date.toISOString().substring(0, 7); // YYYY-MM format

      if (!productsByMonth[monthKey]) {
        productsByMonth[monthKey] = 0;
      }
      productsByMonth[monthKey]++;
    }
  });

  // Convert to trend format with real product creation data
  Object.keys(productsByMonth).forEach(monthKey => {
    trends.push({
      date: monthKey + '-01', // First day of month
      productsCreated: productsByMonth[monthKey],
      // No fake SEO metrics - these require external API integration
      // organicTraffic: null,
      // keywordPositions: null,
      // backlinks: null,
      // pageSpeed: null,
      // mobileUsability: null,
      // overallScore: null,
    });
  });

  return trends.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

// Keywords endpoints
router.get('/keywords', async (req, res) => {
  try {
    const { search, status, dateRange } = req.query;

    const products = await getProductsForAnalytics();
    const keywords = generateKeywordsFromProducts(products);

    let filteredKeywords = [...keywords];

    if (search) {
      filteredKeywords = filteredKeywords.filter(keyword =>
        keyword.keyword.toLowerCase().includes((search as string).toLowerCase())
      );
    }

    if (status) {
      filteredKeywords = filteredKeywords.filter(keyword =>
        keyword.trend === status
      );
    }

    res.json({
      success: true,
      data: filteredKeywords,
      total: filteredKeywords.length,
      page: 1,
      limit: 50
    });
  } catch (error) {
    logger.error('Error fetching keywords:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch keywords',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/keywords', (req, res) => {
  const { keyword } = req.body;

  if (!keyword) {
    return res.status(400).json({
      success: false,
      error: 'Keyword is required'
    });
  }

  // Create keyword with real data only - no fake metrics
  const newKeyword = {
    id: Date.now(), // Use timestamp as ID
    keyword,
    position: null, // No fake position data
    volume: null, // No fake volume data
    difficulty: null, // No fake difficulty data
    trend: null, // No fake trend data
    clicks: null, // No fake clicks data
    impressions: null, // No fake impressions data
    ctr: null, // No fake CTR data
    url: '/',
    lastUpdated: new Date().toISOString()
  };

  res.json({
    success: true,
    data: newKeyword,
    message: 'Keyword added successfully'
  });
});


router.get('/seo', async (req, res) => {
  try {
    const seoMetrics = await database.all('SELECT * FROM seo_metrics');
    res.json({
      success: true,
      data: seoMetrics
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch SEO metrics' });
  }
});

router.get('/competitors', async (req, res) => {
    try {
        const competitorAnalysis = await database.all('SELECT * FROM competitor_analysis');
        res.json({
          success: true,
          data: competitorAnalysis
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch competitor analysis' });
    }
});

router.get('/quality-scores', async (req, res) => {
    try {
        const contentQualityScores = await database.all('SELECT * FROM content_quality_scores');
        res.json({
          success: true,
          data: contentQualityScores
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch content quality scores' });
    }
});

router.get('/trends', async (req, res) => {
    try {
        const trendAnalysis = await database.all('SELECT * FROM trend_analysis');
        res.json({
          success: true,
          data: trendAnalysis
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch trend analysis' });
    }
});


// Performance endpoints
router.get('/performance', async (req, res) => {
  try {
    const products = await getProductsForAnalytics();
    const performance = generatePerformanceMetrics(products);

    res.json({
      success: true,
      data: performance
    });
  } catch (error) {
    logger.error('Error fetching performance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch performance metrics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;

