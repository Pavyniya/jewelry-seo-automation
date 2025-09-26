import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors({
  origin: 'http://localhost:4000',
  credentials: true,
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: 'development',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: 'disconnected (testing)',
    shopify: 'configured',
  });
});

// Shopify configuration
const SHOPIFY_CONFIG = {
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecret: process.env.SHOPIFY_API_SECRET,
  accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
  storeName: process.env.SHOPIFY_STORE || 'vqgsa5-kc.myshopify.com',
  baseUrl: `https://${process.env.SHOPIFY_STORE || 'vqgsa5-kc.myshopify.com'}`
};

// Real products storage
let realProducts = [];
let lastSyncTime = null;

// Helper function to fetch from Shopify API
async function fetchFromShopify(endpoint) {
  const url = `${SHOPIFY_CONFIG.baseUrl}/admin/api/2024-01/${endpoint}`;

  console.log('🔄 Fetching from:', url);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-Shopify-Access-Token': SHOPIFY_CONFIG.accessToken,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });

  console.log('📡 Response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.log('❌ Error response:', errorText);
    throw new Error(`Shopify API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const responseText = await response.text();
  console.log('✅ Response text length:', responseText.length);

  try {
    const jsonData = JSON.parse(responseText);
    // Add headers to the response object for pagination
    jsonData.headers = Object.fromEntries(response.headers);
    return jsonData;
  } catch (parseError) {
    console.log('❌ JSON parse error:', parseError.message);
    console.log('📄 Raw response:', responseText.substring(0, 500));
    throw new Error(`Failed to parse JSON response: ${parseError.message}`);
  }
}

// Test Shopify connection
app.post('/api/v1/products/test-connection', async (req, res) => {
  try {
    const shopData = await fetchFromShopify('shop');
    res.json({
      success: true,
      data: {
        shop: shopData.shop,
        connected: true,
      },
      message: 'Successfully connected to Shopify API',
    });
  } catch (error) {
    res.json({
      success: false,
      data: {
        connected: false,
        error: error.message,
      },
      message: 'Failed to connect to Shopify API',
    });
  }
});

// Sync products from Shopify
app.post('/api/v1/products/sync', async (req, res) => {
  try {
    console.log('🔄 Starting complete product synchronization...');

    // Get all products with proper pagination for large catalogs
    console.log('🔄 Starting paginated product synchronization...');
    let allShopifyProducts = [];
    let nextPageUrl = null;
    let pageCount = 1;
    const perPage = 250; // Shopify maximum per page

    // Fetch first page
    let shopifyResponse = await fetchFromShopify(`products.json?limit=${perPage}`);
    allShopifyProducts = allShopifyProducts.concat(shopifyResponse.products);

    // Extract next page URL from Link header
    const linkHeader = shopifyResponse.headers?.link || '';
    if (linkHeader.includes('rel="next"')) {
      const match = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
      if (match) {
        nextPageUrl = match[1];
      }
    }

    console.log(`📦 Page ${pageCount}: Found ${shopifyResponse.products.length} products`);

    // Continue fetching pages until no more
    while (nextPageUrl) {
      pageCount++;

      // Extract the relative path from the full URL
      const urlMatch = nextPageUrl.match(/\/admin\/api\/2024-01\/(.+)/);
      if (urlMatch) {
        const endpoint = urlMatch[1];
        const pageResponse = await fetchFromShopify(endpoint);

        if (pageResponse.products && pageResponse.products.length > 0) {
          allShopifyProducts = allShopifyProducts.concat(pageResponse.products);
          console.log(`📦 Page ${pageCount}: Found ${pageResponse.products.length} products`);

          // Check for next page
          const pageLinkHeader = pageResponse.headers?.link || '';
          if (pageLinkHeader.includes('rel="next"')) {
            const nextMatch = pageLinkHeader.match(/<([^>]+)>;\s*rel="next"/);
            nextPageUrl = nextMatch ? nextMatch[1] : null;
          } else {
            nextPageUrl = null;
          }
        } else {
          nextPageUrl = null;
        }
      } else {
        nextPageUrl = null;
      }
    }

    console.log(`📊 Total pages fetched: ${pageCount}`);
    console.log(`📦 Total products found: ${allShopifyProducts.length}`);

    // Transform Shopify products to our format
    const transformedProducts = allShopifyProducts.map(shopifyProduct => ({
      id: shopifyProduct.id.toString(),
      title: shopifyProduct.title,
      description: shopifyProduct.body_html || '',
      vendor: shopifyProduct.vendor,
      productType: shopifyProduct.product_type,
      tags: shopifyProduct.tags || '',
      variants: JSON.stringify(shopifyProduct.variants || []),
      images: JSON.stringify(shopifyProduct.images || []),
      price: shopifyProduct.variants && shopifyProduct.variants[0] ? shopifyProduct.variants[0].price : 0,
      sku: shopifyProduct.variants && shopifyProduct.variants[0] ? shopifyProduct.variants[0].sku : '',
      seoTitle: shopifyProduct.seo_title || shopifyProduct.title,
      seoDescription: shopifyProduct.seo_description || shopifyProduct.body_html?.replace(/<[^>]*>/g, '').substring(0, 160) || '',
      optimizedDescription: null,
      optimizationStatus: 'pending',
      lastOptimized: null,
      createdAt: shopifyProduct.created_at,
      updatedAt: shopifyProduct.updated_at,
      shopifyData: JSON.stringify(shopifyProduct),
      syncVersion: 1
    }));

    realProducts = transformedProducts;
    lastSyncTime = new Date().toISOString();

    console.log(`✅ Successfully synced ${transformedProducts.length} total products`);

    res.json({
      success: true,
      data: {
        processed: transformedProducts.length,
        succeeded: transformedProducts.length,
        failed: 0,
        pagesFetched: pageCount,
        duration: Date.now() - Date.now(),
        stats: getProductStats(),
      },
      message: `Successfully synchronized ${transformedProducts.length} products from Shopify (${pageCount} pages)`,
    });
  } catch (error) {
    console.error('❌ Sync failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to sync products from Shopify',
    });
  }
});

// Helper function to get product stats
function getProductStats() {
  return {
    total: realProducts.length,
    pending: realProducts.filter(p => p.optimizationStatus === 'pending').length,
    processing: realProducts.filter(p => p.optimizationStatus === 'processing').length,
    completed: realProducts.filter(p => p.optimizationStatus === 'completed').length,
    failed: realProducts.filter(p => p.optimizationStatus === 'failed').length,
    needs_review: realProducts.filter(p => p.optimizationStatus === 'needs_review').length,
    avgOptimizationTime: 0,
    lastSyncTime: lastSyncTime
  };
}

// Products stats endpoint
app.get('/api/v1/products/stats/overview', (req, res) => {
  res.json({
    success: true,
    data: getProductStats(),
  });
});

// Products list endpoint
app.get('/api/v1/products', (req, res) => {
  const { limit = 50, offset = 0, status } = req.query;
  let filteredProducts = realProducts;

  if (status) {
    filteredProducts = realProducts.filter(p => p.optimizationStatus === status);
  }

  const paginatedProducts = filteredProducts.slice(Number(offset), Number(offset) + Number(limit));

  res.json({
    success: true,
    data: {
      products: paginatedProducts,
      stats: getProductStats(),
      pagination: {
        limit: Number(limit),
        offset: Number(offset),
        total: status ? filteredProducts.length : realProducts.length,
      },
    },
  });
});

// Remove duplicate products
app.post('/api/v1/products/deduplicate', (req, res) => {
  try {
    console.log('🔄 Starting product deduplication...');

    // Group products by ID to identify duplicates
    const productGroups = {};
    realProducts.forEach(product => {
      if (!productGroups[product.id]) {
        productGroups[product.id] = [];
      }
      productGroups[product.id].push(product);
    });

    // For each duplicate group, keep only the first occurrence
    const uniqueProducts = [];
    let removedCount = 0;
    let originalCount = realProducts.length;

    Object.keys(productGroups).forEach(productId => {
      const products = productGroups[productId];
      if (products.length > 1) {
        // Keep the first occurrence, remove the rest
        uniqueProducts.push(products[0]);
        removedCount += products.length - 1;
        console.log(`🗑️ Removed ${products.length - 1} duplicates of product ID ${productId} (${products[0].title})`);
      } else {
        // Product is already unique
        uniqueProducts.push(products[0]);
      }
    });

    // Replace the products array with deduplicated products
    realProducts = uniqueProducts;

    console.log(`✅ Deduplication complete: ${removedCount} duplicates removed, ${realProducts.length} unique products remaining`);

    res.json({
      success: true,
      data: {
        originalCount: originalCount,
        uniqueCount: realProducts.length,
        removedCount: removedCount,
        stats: getProductStats(),
      },
      message: `Successfully removed ${removedCount} duplicate products. ${realProducts.length} unique products remain.`,
    });
  } catch (error) {
    console.error('❌ Deduplication failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Failed to deduplicate products',
    });
  }
});

// Review workflow endpoints
app.get('/api/v1/reviews', (req, res) => {
  const { status, reviewer, priority } = req.query;
  let filteredReviews = [];

  // Mock reviews data based on synced products
  const mockReviews = realProducts.slice(0, 10).map((product, index) => ({
    id: `review-${product.id}`,
    productId: product.id,
    productName: product.title,
    type: index % 3 === 0 ? 'content' : index % 3 === 1 ? 'seo' : 'compliance',
    status: ['pending', 'approved', 'rejected', 'needs_revision'][index % 4],
    reviewer: 'AI Assistant',
    submittedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    reviewedAt: index % 2 === 0 ? new Date().toISOString() : null,
    priority: ['high', 'medium', 'low'][index % 3],
    estimatedReviewTime: 5 + Math.floor(Math.random() * 15),
    assignedTo: index % 3 === 0 ? 'Admin' : null,
    feedback: index % 2 === 0 ? 'Great optimization work!' : null,
    score: 70 + Math.floor(Math.random() * 30),
    contentDiffs: [
      {
        type: 'added',
        text: 'premium quality features',
        position: 100,
        originalText: ''
      },
      {
        type: 'modified',
        text: product.title,
        position: 0,
        originalText: product.title
      }
    ]
  }));

  // Apply filters
  filteredReviews = mockReviews.filter(review => {
    if (status && review.status !== status) return false;
    if (reviewer && review.reviewer !== reviewer) return false;
    if (priority && review.priority !== priority) return false;
    return true;
  });

  res.json({
    success: true,
    data: {
      reviews: filteredReviews,
      total: filteredReviews.length,
      stats: {
        pending: filteredReviews.filter(r => r.status === 'pending').length,
        approved: filteredReviews.filter(r => r.status === 'approved').length,
        rejected: filteredReviews.filter(r => r.status === 'rejected').length,
        needs_revision: filteredReviews.filter(r => r.status === 'needs_revision').length
      }
    }
  });
});

app.get('/api/v1/reviews/:id', (req, res) => {
  const { id } = req.params;
  const product = realProducts.find(p => p.id === id.replace('review-', ''));

  if (!product) {
    return res.status(404).json({
      success: false,
      error: 'Review not found'
    });
  }

  const review = {
    id,
    productId: product.id,
    productName: product.title,
    type: 'seo',
    status: 'pending',
    reviewer: 'AI Assistant',
    submittedAt: new Date().toISOString(),
    reviewedAt: null,
    priority: 'medium',
    estimatedReviewTime: 10,
    assignedTo: null,
    feedback: null,
    score: 85,
    contentDiffs: [
      {
        type: 'added',
        text: 'premium quality features',
        position: 100,
        originalText: ''
      },
      {
        type: 'modified',
        text: product.title,
        position: 0,
        originalText: product.title
      }
    ],
    originalContent: {
      title: product.title,
      description: product.description || '',
      seoTitle: product.seoTitle,
      seoDescription: product.seoDescription
    },
    optimizedContent: {
      title: `${product.title} | Fine Jewelry Collection`,
      description: `${product.description || ''}\n\n✨ **Premium Quality Features:**\n• Expertly crafted with attention to detail\n• Perfect for special occasions and everyday elegance\n• Timeless design that complements any style`,
      seoTitle: `${product.title} - Luxury Jewelry | Ohh Glam`,
      seoDescription: `Discover our exquisite ${product.title.toLowerCase()}. Handcrafted with premium materials.`
    }
  };

  res.json({
    success: true,
    data: review
  });
});

app.post('/api/v1/reviews/:id', (req, res) => {
  const { id } = req.params;
  const { status, feedback, reviewer } = req.body;

  // Update product status in our in-memory store
  const product = realProducts.find(p => p.id === id.replace('review-', ''));
  if (product) {
    if (status === 'approved') {
      product.optimizationStatus = 'completed';
      product.lastOptimized = new Date().toISOString();
      product.seoTitle = `${product.title} - Luxury Jewelry | Ohh Glam`;
      product.seoDescription = `Discover our exquisite ${product.title.toLowerCase()}. Handcrafted with premium materials.`;
      product.optimizedDescription = `${product.description || ''}\n\n✨ **Premium Quality Features:**\n• Expertly crafted with attention to detail`;
    } else if (status === 'rejected') {
      product.optimizationStatus = 'failed';
    } else if (status === 'needs_revision') {
      product.optimizationStatus = 'needs_review';
    }
  }

  console.log(`📝 Review ${id} ${status} by ${reviewer}`);
  if (feedback) {
    console.log(`💬 Feedback: ${feedback}`);
  }

  res.json({
    success: true,
    data: {
      id,
      status,
      reviewer,
      reviewedAt: new Date().toISOString(),
      feedback
    },
    message: `Review ${status} successfully`
  });
});

app.get('/api/v1/reviews/pending', (req, res) => {
  const pendingReviews = realProducts
    .filter(p => p.optimizationStatus === 'pending' || p.optimizationStatus === 'needs_review')
    .slice(0, 5)
    .map(product => ({
      id: `review-${product.id}`,
      productId: product.id,
      productName: product.title,
      type: 'seo',
      status: 'pending',
      reviewer: 'AI Assistant',
      submittedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      priority: product.seoScore && product.seoScore < 70 ? 'high' : 'medium',
      estimatedReviewTime: 8 + Math.floor(Math.random() * 12),
      assignedTo: null
    }));

  res.json({
    success: true,
    data: pendingReviews
  });
});

app.get('/api/v1/reviews/stats', (req, res) => {
  const stats = {
    total: realProducts.length,
    pending: realProducts.filter(p => p.optimizationStatus === 'pending').length,
    approved: realProducts.filter(p => p.optimizationStatus === 'completed').length,
    rejected: realProducts.filter(p => p.optimizationStatus === 'failed').length,
    needs_revision: realProducts.filter(p => p.optimizationStatus === 'needs_review').length,
    avgQualityScore: 87,
    avgReviewTime: 12,
    backlogCount: realProducts.filter(p => p.optimizationStatus === 'pending').length
  };

  res.json({
    success: true,
    data: stats
  });
});

app.post('/api/v1/quality-score', (req, res) => {
  const { content } = req.body;

  // Simple quality score calculation based on content metrics
  const wordCount = content.split(/\s+/).length;
  const charCount = content.length;
  const hasKeywords = /quality|premium|luxury|handcrafted|exquisite/gi.test(content);
  const hasStructure = /[•\-\*]/g.test(content);
  const hasEmojis = /✨|🎁|💎|⭐/g.test(content);

  let score = 60; // Base score

  // Add points for various quality factors
  if (wordCount > 50) score += 10;
  if (wordCount > 100) score += 5;
  if (charCount > 300) score += 5;
  if (hasKeywords) score += 10;
  if (hasStructure) score += 8;
  if (hasEmojis) score += 2;

  // Cap at 100
  score = Math.min(score, 100);

  const qualityScore = {
    score,
    breakdown: {
      contentLength: Math.min(wordCount / 10, 15),
      keywordUsage: hasKeywords ? 15 : 0,
      structure: hasStructure ? 12 : 0,
      readability: 10,
      branding: hasEmojis ? 3 : 0
    },
    suggestions: score < 80 ? [
      'Add more descriptive details about the product',
      'Include specific materials and craftsmanship information',
      'Add structured bullet points for better readability',
      'Include brand voice and personality elements'
    ] : []
  };

  res.json({
    success: true,
    data: qualityScore
  });
});

app.post('/api/v1/content-diffs', (req, res) => {
  const { original, optimized } = req.body;

  // Simple diff detection (in a real implementation, you'd use a proper diff library)
  const diffs = [];
  const originalWords = original.split(/\s+/);
  const optimizedWords = optimized.split(/\s+/);

  // Find added words (simplified algorithm)
  optimizedWords.forEach((word, index) => {
    if (!originalWords.includes(word) && word.length > 3) {
      diffs.push({
        type: 'added',
        text: word,
        position: index,
        originalText: ''
      });
    }
  });

  // Find modified words (very simplified)
  originalWords.forEach((word, index) => {
    const optimizedWord = optimizedWords[index];
    if (optimizedWord && optimizedWord !== word && word.length > 3) {
      diffs.push({
        type: 'modified',
        text: optimizedWord,
        position: index,
        originalText: word
      });
    }
  });

  res.json({
    success: true,
    data: diffs.slice(0, 10) // Limit to prevent overwhelming responses
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Test API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API Base: http://localhost:${PORT}/api/v1`);
});

export default app;