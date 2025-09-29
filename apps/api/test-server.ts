import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3002;

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

// Real products storage - pre-populated with sample data
let realProducts = [
  {
    id: '1',
    title: '3D Rose Pendant Necklace',
    description: 'Elegant 3D rose pendant necklace crafted with precision',
    vendor: 'Ohh Glam',
    productType: 'Necklace',
    tags: 'necklace, rose, 3d, pendant, jewelry',
    variants: JSON.stringify([
      { id: 1, price: '54.00', sku: 'RPN001-G', title: 'Gold' },
      { id: 2, price: '48.00', sku: 'RPN001-S', title: 'Silver' }
    ]),
    images: JSON.stringify([{
      src: 'https://example.com/rose-pendant.jpg'
    }]),
    price: 54,
    sku: 'RPN001-G',
    seoTitle: '3D Rose Pendant Necklace | Ohh Glam Jewelry',
    seoDescription: 'Elegant 3D rose pendant necklace perfect for special occasions',
    optimizedDescription: null,
    optimizationStatus: 'pending',
    lastOptimized: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    shopifyData: '{}',
    syncVersion: 1
  },
  {
    id: '2',
    title: 'AMORE Heart Link Necklace',
    description: 'Beautiful heart link necklace symbolizing love and connection',
    vendor: 'Ohh Glam',
    productType: 'Necklace',
    tags: 'necklace, heart, love, link, jewelry',
    variants: JSON.stringify([
      { id: 1, price: '84.00', sku: 'AHL001-G', title: 'Gold' },
      { id: 2, price: '76.00', sku: 'AHL001-S', title: 'Silver' }
    ]),
    images: JSON.stringify([{
      src: 'https://example.com/heart-necklace.jpg'
    }]),
    price: 84,
    sku: 'AHL001-G',
    seoTitle: 'AMORE Heart Link Necklace | Luxury Jewelry',
    seoDescription: 'Beautiful heart link necklace symbolizing love and connection',
    optimizedDescription: null,
    optimizationStatus: 'pending',
    lastOptimized: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    shopifyData: '{}',
    syncVersion: 1
  }
];
let lastSyncTime = new Date().toISOString();

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

// Analytics endpoints
app.get('/api/v1/analytics/keywords', (req, res) => {
  const { search, status, dateRange } = req.query;

  // Real keywords based on Ohh Glam's actual jewelry products
  const mockKeywords = [
    {
      id: 1,
      keyword: '3d rose pendant necklace',
      position: 3,
      volume: 8500,
      difficulty: 65,
      trend: 'up',
      clicks: 285,
      impressions: 3600,
      ctr: 7.9,
      url: '/products/3d-rose-pendant-necklace',
      lastUpdated: new Date().toISOString()
    },
    {
      id: 2,
      keyword: 'heart necklace gold',
      position: 5,
      volume: 12200,
      difficulty: 72,
      trend: 'stable',
      clicks: 445,
      impressions: 6250,
      ctr: 7.1,
      url: '/products/amore-heart-link-necklace',
      lastUpdated: new Date().toISOString()
    },
    {
      id: 3,
      keyword: 'charm necklace colorful',
      position: 8,
      volume: 6800,
      difficulty: 58,
      trend: 'up',
      clicks: 195,
      impressions: 3000,
      ctr: 6.5,
      url: '/products/amora-charm-necklace',
      lastUpdated: new Date().toISOString()
    },
    {
      id: 4,
      keyword: 'heart ring open adjustable',
      position: 12,
      volume: 5400,
      difficulty: 52,
      trend: 'down',
      clicks: 125,
      impressions: 2850,
      ctr: 4.4,
      url: '/products/amore-hearts-open-ring',
      lastUpdated: new Date().toISOString()
    },
    {
      id: 5,
      keyword: 'drop heart earrings waterproof',
      position: 7,
      volume: 4200,
      difficulty: 48,
      trend: 'up',
      clicks: 142,
      impressions: 1870,
      ctr: 7.6,
      url: '/products/amour-drop-heart-earrings',
      lastUpdated: new Date().toISOString()
    },
    {
      id: 6,
      keyword: 'stainless steel jewelry hypoallergenic',
      position: 9,
      volume: 15600,
      difficulty: 68,
      trend: 'stable',
      clicks: 680,
      impressions: 9800,
      ctr: 6.9,
      url: '/collections/all',
      lastUpdated: new Date().toISOString()
    },
    {
      id: 7,
      keyword: 'gold plated necklace tarnish resistant',
      position: 6,
      volume: 9800,
      difficulty: 62,
      trend: 'up',
      clicks: 395,
      impressions: 5600,
      ctr: 7.1,
      url: '/collections/necklaces',
      lastUpdated: new Date().toISOString()
    },
    {
      id: 8,
      keyword: 'ohh glam jewelry',
      position: 2,
      volume: 3200,
      difficulty: 35,
      trend: 'up',
      clicks: 285,
      impressions: 3200,
      ctr: 8.9,
      url: '/',
      lastUpdated: new Date().toISOString()
    }
  ];

  let filteredKeywords = [...mockKeywords];

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
});

app.get('/api/v1/analytics/competitors', (req, res) => {
  const mockCompetitors = [
    {
      id: 1,
      name: 'Brilliant Earth',
      domain: 'brilliantearth.com',
      authority: 85,
      overlap: 78,
      keywords: 2450,
      description: 'Sustainable and ethically sourced fine jewelry',
      category: 'Fine Jewelry',
      traffic: 1250000,
      backlinks: 45000,
      sharedKeywords: ['diamond engagement rings', 'wedding rings', 'ethical jewelry'],
      strengths: ['Brand reputation', 'Product quality', 'Ethical sourcing'],
      weaknesses: ['Higher prices', 'Limited customization']
    },
    {
      id: 2,
      name: 'Blue Nile',
      domain: 'bluenile.com',
      authority: 92,
      overlap: 65,
      keywords: 3200,
      description: 'Online diamond and jewelry retailer',
      category: 'Online Jewelry',
      traffic: 2100000,
      backlinks: 67000,
      sharedKeywords: ['diamond rings', 'engagement rings', 'fine jewelry'],
      strengths: ['Brand authority', 'Wide selection', 'Competitive pricing'],
      weaknesses: ['Less personal touch', 'Limited physical stores']
    },
    {
      id: 3,
      name: 'James Allen',
      domain: 'jamesallen.com',
      authority: 88,
      overlap: 58,
      keywords: 2800,
      description: 'Online retailer of engagement rings and fine jewelry',
      category: 'Online Jewelry',
      traffic: 1850000,
      backlinks: 52000,
      sharedKeywords: ['engagement rings', 'diamond jewelry', 'custom rings'],
      strengths: ['Technology', 'Customization', 'Customer service'],
      weaknesses: ['Brand recognition', 'Market share']
    }
  ];

  res.json({
    success: true,
    data: mockCompetitors,
    total: mockCompetitors.length
  });
});

app.get('/api/v1/analytics/trends', (req, res) => {
  const { dateRange } = req.query;

  const mockTrends = [
    {
      date: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      organicTraffic: 12500,
      keywordPositions: 45,
      backlinks: 850,
      pageSpeed: 92,
      mobileUsability: 88,
      overallScore: 78
    },
    {
      date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      organicTraffic: 13200,
      keywordPositions: 42,
      backlinks: 875,
      pageSpeed: 94,
      mobileUsability: 90,
      overallScore: 81
    },
    {
      date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      organicTraffic: 14100,
      keywordPositions: 38,
      backlinks: 920,
      pageSpeed: 91,
      mobileUsability: 89,
      overallScore: 84
    },
    {
      date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      organicTraffic: 15800,
      keywordPositions: 35,
      backlinks: 980,
      pageSpeed: 93,
      mobileUsability: 92,
      overallScore: 87
    },
    {
      date: new Date().toISOString().split('T')[0],
      organicTraffic: 17200,
      keywordPositions: 32,
      backlinks: 1050,
      pageSpeed: 95,
      mobileUsability: 94,
      overallScore: 91
    }
  ];

  let filteredTrends = [...mockTrends];

  if (dateRange) {
    const days = parseInt(dateRange.toString().replace('d', ''));
    if (days) {
      filteredTrends = mockTrends.slice(-Math.min(days / 30, mockTrends.length));
    }
  }

  res.json({
    success: true,
    data: filteredTrends
  });
});

app.get('/api/v1/analytics/performance', (req, res) => {
  const mockPerformance = {
    impressions: 45600,
    ctr: 7.2,
    conversionRate: 2.8,
    revenue: 38450,
    averagePosition: 6.8,
    top10Keywords: 8,
    top3Keywords: 3
  };

  res.json({
    success: true,
    data: mockPerformance
  });
});

app.post('/api/v1/analytics/keywords', (req, res) => {
  const { keyword } = req.body;

  if (!keyword) {
    return res.status(400).json({
      success: false,
      error: 'Keyword is required'
    });
  }

  const newKeyword = {
    id: 9,
    keyword,
    position: Math.floor(Math.random() * 50) + 20,
    volume: Math.floor(Math.random() * 50000) + 1000,
    difficulty: Math.floor(Math.random() * 40) + 60,
    trend: 'stable',
    clicks: Math.floor(Math.random() * 1000) + 100,
    impressions: Math.floor(Math.random() * 10000) + 1000,
    ctr: Math.random() * 10 + 1,
    url: '/',
    lastUpdated: new Date().toISOString()
  };

  res.json({
    success: true,
    data: newKeyword,
    message: 'Keyword added successfully'
  });
});

app.post('/api/v1/analytics/competitors', (req, res) => {
  const { domain } = req.body;

  if (!domain) {
    return res.status(400).json({
      success: false,
      error: 'Domain is required'
    });
  }

  const newCompetitor = {
    id: 4,
    name: domain.split('.')[0],
    domain,
    authority: Math.floor(Math.random() * 40) + 60,
    overlap: Math.floor(Math.random() * 50) + 30,
    keywords: Math.floor(Math.random() * 3000) + 500,
    description: 'Competitor website',
    category: 'Jewelry',
    traffic: Math.floor(Math.random() * 2000000) + 100000,
    backlinks: Math.floor(Math.random() * 50000) + 10000,
    sharedKeywords: [],
    strengths: [],
    weaknesses: []
  };

  res.json({
    success: true,
    data: newCompetitor,
    message: 'Competitor added successfully'
  });
});

// AI Provider endpoints for dashboard compatibility
app.get('/api/ai-providers/health', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 'gemini-pro',
        name: 'Google Gemini Pro',
        status: 'healthy',
        responseTime: 180,
        successRate: 98.5,
        lastCheck: new Date().toISOString(),
        error: null
      },
      {
        id: 'claude-3',
        name: 'Anthropic Claude 3',
        status: 'healthy',
        responseTime: 320,
        successRate: 96.2,
        lastCheck: new Date().toISOString(),
        error: null
      },
      {
        id: 'gpt-4',
        name: 'OpenAI GPT-4',
        status: 'degraded',
        responseTime: 520,
        successRate: 89.1,
        lastCheck: new Date().toISOString(),
        error: 'High latency detected'
      }
    ]
  });
});

app.get('/api/ai-providers/performance', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        providerId: 'gemini-pro',
        providerName: 'Google Gemini Pro',
        totalRequests: 1250,
        successfulRequests: 1231,
        failedRequests: 19,
        averageResponseTime: 180,
        successRate: 98.5,
        totalTokens: 45600,
        estimatedCost: 0.09,
        lastUpdated: new Date().toISOString()
      },
      {
        providerId: 'claude-3',
        providerName: 'Anthropic Claude 3',
        totalRequests: 980,
        successfulRequests: 943,
        failedRequests: 37,
        averageResponseTime: 320,
        successRate: 96.2,
        totalTokens: 28900,
        estimatedCost: 0.43,
        lastUpdated: new Date().toISOString()
      },
      {
        providerId: 'gpt-4',
        providerName: 'OpenAI GPT-4',
        totalRequests: 2100,
        successfulRequests: 1871,
        failedRequests: 229,
        averageResponseTime: 520,
        successRate: 89.1,
        totalTokens: 67800,
        estimatedCost: 2.03,
        lastUpdated: new Date().toISOString()
      }
    ]
  });
});

app.get('/api/ai-providers/rate-limits', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        providerId: 'gemini-pro',
        providerName: 'Google Gemini Pro',
        limit: 60,
        used: 24,
        remaining: 36,
        resetTime: new Date(Date.now() + 3600000).toISOString(),
        percentage: 40
      },
      {
        providerId: 'claude-3',
        providerName: 'Anthropic Claude 3',
        limit: 50,
        used: 18,
        remaining: 32,
        resetTime: new Date(Date.now() + 3600000).toISOString(),
        percentage: 36
      },
      {
        providerId: 'gpt-4',
        providerName: 'OpenAI GPT-4',
        limit: 200,
        used: 156,
        remaining: 44,
        resetTime: new Date(Date.now() + 3600000).toISOString(),
        percentage: 78
      }
    ]
  });
});

app.get('/api/ai-providers/costs', (req, res) => {
  res.json({
    success: true,
    data: {
      totalCost: 2.55,
      costBreakdown: [
        {
          providerId: 'gemini-pro',
          providerName: 'Google Gemini Pro',
          cost: 0.09,
          percentage: 3.5,
          requests: 1250
        },
        {
          providerId: 'claude-3',
          providerName: 'Anthropic Claude 3',
          cost: 0.43,
          percentage: 16.9,
          requests: 980
        },
        {
          providerId: 'gpt-4',
          providerName: 'OpenAI GPT-4',
          cost: 2.03,
          percentage: 79.6,
          requests: 2100
        }
      ],
      optimization: {
        potentialSavings: 0.38,
        recommendations: [
          'Switch product descriptions from GPT-4 to Gemini Pro to save 15%',
          'Use Claude 3 for SEO titles to improve quality by 22%'
        ]
      }
    }
  });
});

app.get('/api/ai-providers/available', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 'gemini-pro',
        name: 'Google Gemini Pro',
        enabled: true,
        priority: 1,
        capabilities: ['text-generation', 'seo-optimization', 'content-creation'],
        config: {
          model: 'gemini-pro',
          maxTokens: 2048,
          temperature: 0.7
        }
      },
      {
        id: 'claude-3',
        name: 'Anthropic Claude 3',
        enabled: true,
        priority: 2,
        capabilities: ['text-generation', 'seo-optimization', 'content-review'],
        config: {
          model: 'claude-3-sonnet-20240229',
          maxTokens: 4096,
          temperature: 0.5
        }
      },
      {
        id: 'gpt-4',
        name: 'OpenAI GPT-4',
        enabled: true,
        priority: 3,
        capabilities: ['text-generation', 'seo-optimization', 'content-analysis'],
        config: {
          model: 'gpt-4',
          maxTokens: 8192,
          temperature: 0.6
        }
      }
    ]
  });
});

// Legacy analytics endpoints for frontend compatibility
app.get('/api/analytics/seo', (req, res) => {
  // Return data that matches the expected SeoMetrics interface
  const mockSeoMetrics = [
    {
      id: '1',
      productId: '1',
      keyword: '3d rose pendant necklace',
      position: 3,
      searchVolume: 8500,
      difficulty: 65,
      clickThroughRate: 7.9,
      impressions: 3600,
      clicks: 285,
      date: new Date().toISOString()
    },
    {
      id: '2',
      productId: '2',
      keyword: 'heart necklace gold',
      position: 5,
      searchVolume: 12200,
      difficulty: 72,
      clickThroughRate: 7.1,
      impressions: 6250,
      clicks: 445,
      date: new Date().toISOString()
    }
  ];
  res.json(mockSeoMetrics);
});

app.get('/api/analytics/competitors', (req, res) => {
  // Return data that matches the expected CompetitorAnalysis interface
  const mockCompetitors = [
    {
      id: '1',
      productId: '1',
      competitorDomain: 'brilliantearth.com',
      competitorPosition: 2,
      marketShare: 25,
      contentGap: ['ethical sourcing claims', 'custom design options', 'lifetime warranty'],
      priceComparison: 15,
      strengths: ['Brand reputation', 'Product quality', 'Ethical sourcing'],
      weaknesses: ['Higher prices', 'Limited customization'],
      lastAnalyzed: new Date().toISOString()
    },
    {
      id: '2',
      productId: '1',
      competitorDomain: 'bluenile.com',
      competitorPosition: 1,
      marketShare: 35,
      contentGap: ['Virtual try-on', 'Educational content', '24/7 customer service'],
      priceComparison: 10,
      strengths: ['Brand authority', 'Wide selection', 'Competitive pricing'],
      weaknesses: ['Less personal touch', 'Limited physical stores'],
      lastAnalyzed: new Date().toISOString()
    }
  ];
  res.json(mockCompetitors);
});

app.get('/api/analytics/quality-scores', (req, res) => {
  // Return data that matches the expected ContentQualityScore interface
  const mockQualityScores = [
    {
      id: '1',
      productId: '1',
      seoScore: 85,
      readabilityScore: 90,
      brandVoiceScore: 88,
      uniquenessScore: 82,
      keywordOptimization: 78,
      overallScore: 85,
      recommendations: [
        'Add more descriptive details about the product',
        'Include specific materials and craftsmanship information',
        'Add structured bullet points for better readability'
      ],
      lastCalculated: new Date().toISOString()
    },
    {
      id: '2',
      productId: '2',
      seoScore: 92,
      readabilityScore: 95,
      brandVoiceScore: 90,
      uniquenessScore: 88,
      keywordOptimization: 85,
      overallScore: 92,
      recommendations: [
        'Optimize meta description for better click-through rate',
        'Add more emotional appeal to the description',
        'Include customer testimonials or social proof'
      ],
      lastCalculated: new Date().toISOString()
    }
  ];
  res.json(mockQualityScores);
});

app.get('/api/analytics/trends', (req, res) => {
  // Return data that matches the expected TrendAnalysis interface
  const mockTrends = [
    {
      id: '1',
      productId: '1',
      metric: 'organic_traffic',
      timeframe: 'monthly',
      data: [
        { date: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], value: 12500, events: ['Product launch'] },
        { date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], value: 13200, events: ['SEO optimization'] },
        { date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], value: 14100, events: ['Content update'] },
        { date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], value: 15800, events: ['Marketing campaign'] },
        { date: new Date().toISOString().split('T')[0], value: 17200, events: ['Holiday promotion'] }
      ],
      trend: 'up',
      changePercentage: 37.6,
      correlation: 0.95,
      lastUpdated: new Date().toISOString()
    },
    {
      id: '2',
      productId: '1',
      metric: 'keyword_positions',
      timeframe: 'monthly',
      data: [
        { date: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], value: 45, events: ['Algorithm update'] },
        { date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], value: 42, events: ['Competitor analysis'] },
        { date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], value: 38, events: ['Keyword optimization'] },
        { date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], value: 35, events: ['Content refinement'] },
        { date: new Date().toISOString().split('T')[0], value: 32, events: ['SEO improvement'] }
      ],
      trend: 'up',
      changePercentage: -28.9,
      correlation: -0.89,
      lastUpdated: new Date().toISOString()
    }
  ];
  res.json(mockTrends);
});

// AI Provider POST endpoints
app.post('/api/ai-providers/select', (req, res) => {
  const { providerId, prompt } = req.body;
  res.json({
    success: true,
    data: {
      selectedProvider: providerId,
      response: `Mock response from ${providerId} for prompt: ${prompt}`,
      timestamp: new Date().toISOString(),
      tokensUsed: Math.floor(Math.random() * 1000) + 100,
      responseTime: Math.floor(Math.random() * 2000) + 100
    }
  });
});

app.post('/api/ai-providers/test', (req, res) => {
  const { providerId, testPrompt } = req.body;
  const delay = Math.floor(Math.random() * 3000) + 500;

  setTimeout(() => {
    res.json({
      success: true,
      data: {
        providerId,
        status: 'success',
        responseTime: delay,
        response: `Test response from ${providerId}`,
        timestamp: new Date().toISOString()
      }
    });
  }, delay);
});

app.post('/api/ai-providers/failover', (req, res) => {
  const { fromProvider, toProvider, reason } = req.body;
  res.json({
    success: true,
    data: {
      failoverTriggered: true,
      fromProvider,
      toProvider,
      reason,
      timestamp: new Date().toISOString(),
      requestsRerouted: Math.floor(Math.random() * 50) + 10
    }
  });
});

app.post('/api/ai-providers/optimize', (req, res) => {
  res.json({
    success: true,
    data: {
      optimizationApplied: true,
      recommendations: [
        'Switch product descriptions from GPT-4 to Gemini Pro to save 15%',
        'Use Claude 3 for SEO titles to improve quality by 22%',
        'Implement request batching to reduce API calls by 30%'
      ],
      estimatedSavings: 0.42,
      timestamp: new Date().toISOString()
    }
  });
});

app.post('/api/ai-providers/record-result', (req, res) => {
  const { providerId, success, responseTime, tokensUsed, error } = req.body;
  res.json({
    success: true,
    data: {
      recorded: true,
      providerId,
      timestamp: new Date().toISOString()
    }
  });
});

// Automation endpoints
app.get('/api/automation/rules', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: '1',
        name: 'SEO Title Optimization',
        description: 'Automatically optimize product titles for better SEO',
        type: 'seo_optimization',
        trigger: 'product_created',
        conditions: {
          field: 'title',
          operator: 'length_greater_than',
          value: 60
        },
        actions: [
          {
            type: 'optimize_title',
            provider: 'gemini-pro',
            parameters: {
              maxLength: 60,
              includeKeywords: true
            }
          }
        ],
        isActive: true,
        priority: 1,
        createdAt: new Date().toISOString(),
        lastRun: new Date().toISOString(),
        runCount: 45,
        successRate: 92.5
      },
      {
        id: '2',
        name: 'Description Enhancement',
        description: 'Enhance product descriptions using AI',
        type: 'content_enhancement',
        trigger: 'product_updated',
        conditions: {
          field: 'description',
          operator: 'length_less_than',
          value: 100
        },
        actions: [
          {
            type: 'enhance_description',
            provider: 'claude-3',
            parameters: {
              targetLength: 200,
              includeFeatures: true
            }
          }
        ],
        isActive: true,
        priority: 2,
        createdAt: new Date().toISOString(),
        lastRun: new Date(Date.now() - 3600000).toISOString(),
        runCount: 23,
        successRate: 87.8
      }
    ]
  });
});

app.get('/api/automation/rules/:id', (req, res) => {
  const { id } = req.params;
  res.json({
    success: true,
    data: {
      id,
      name: 'SEO Title Optimization',
      description: 'Automatically optimize product titles for better SEO',
      type: 'seo_optimization',
      trigger: 'product_created',
      conditions: {
        field: 'title',
        operator: 'length_greater_than',
        value: 60
      },
      actions: [
        {
          type: 'optimize_title',
          provider: 'gemini-pro',
          parameters: {
            maxLength: 60,
            includeKeywords: true
          }
        }
      ],
      isActive: true,
      priority: 1,
      createdAt: new Date().toISOString(),
      lastRun: new Date().toISOString(),
      runCount: 45,
      successRate: 92.5
    }
  });
});

app.get('/api/automation/performance', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        ruleId: '1',
        ruleName: 'SEO Title Optimization',
        executions: 45,
        successful: 42,
        failed: 3,
        averageExecutionTime: 1200,
        lastExecution: new Date().toISOString(),
        successRate: 93.3
      },
      {
        ruleId: '2',
        ruleName: 'Description Enhancement',
        executions: 23,
        successful: 20,
        failed: 3,
        averageExecutionTime: 2400,
        lastExecution: new Date(Date.now() - 3600000).toISOString(),
        successRate: 87.0
      }
    ]
  });
});

app.get('/api/automation/approval-queue', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: '1',
        productId: '1',
        productTitle: '3D Rose Pendant Necklace',
        ruleName: 'SEO Title Optimization',
        originalContent: '3D Rose Pendant Necklace',
        proposedContent: 'Elegant 3D Rose Pendant Necklace - Gold Plated',
        confidence: 0.92,
        reason: 'AI-generated title optimization improves SEO score',
        status: 'pending',
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        expiresAt: new Date(Date.now() + 7200000).toISOString()
      },
      {
        id: '2',
        productId: '2',
        productTitle: 'Heart Necklace Gold',
        ruleName: 'Description Enhancement',
        originalContent: 'Beautiful heart necklace in gold',
        proposedContent: 'Exquisite 14k Gold Heart Necklace - Perfect for Valentine\'s Day. Features a delicate heart pendant crafted from genuine 14k gold, suspended from an elegant chain. This timeless piece symbolizes love and makes the perfect gift for anniversaries, birthdays, or special occasions.',
        confidence: 0.88,
        reason: 'Enhanced description with better SEO keywords and emotional appeal',
        status: 'pending',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        expiresAt: new Date(Date.now() + 10800000).toISOString()
      }
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Test API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API Base: http://localhost:${PORT}/api/v1`);
});

export default app;