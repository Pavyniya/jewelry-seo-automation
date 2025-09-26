require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database setup
let db;

function initDatabase() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database('./real_server.db', (err) => {
      if (err) {
        console.error('Database connection error:', err);
        reject(err);
        return;
      }

      console.log('✅ Database connected');

      // Create products table
      db.run(`CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        title TEXT,
        description TEXT,
        vendor TEXT,
        product_type TEXT,
        status TEXT DEFAULT 'active',
        variants TEXT,
        seo_score INTEGER DEFAULT 0,
        last_optimized TEXT,
        tags TEXT,
        seo_title TEXT,
        seo_description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err) {
          console.error('Table creation error:', err);
          reject(err);
          return;
        }
        console.log('✅ Database tables ready');
        resolve();
      });
    });
  });
}

// Check if we have real Shopify credentials
function hasRealCredentials() {
  const shopifyStore = process.env.SHOPIFY_STORE_NAME;
  const shopifyApiKey = process.env.SHOPIFY_API_KEY;
  const shopifyToken = process.env.SHOPIFY_ACCESS_TOKEN;

  return shopifyStore && shopifyApiKey && shopifyToken &&
         !shopifyStore.includes('your-store') &&
         !shopifyApiKey.includes('your_') &&
         !shopifyToken.includes('your_');
}

// Function to fetch ALL products from Shopify with pagination
async function fetchShopifyProducts() {
  const storeName = process.env.SHOPIFY_STORE_NAME;
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

  let allProducts = [];
  let pageInfo = null;

  console.log('🔄 Starting to fetch all products from Shopify...');

  do {
    // Build URL with page info if available
    let url = `https://${storeName}/admin/api/2024-01/products.json?limit=250`;

    if (pageInfo) {
      url += `&page_info=${pageInfo}`;
    }

    const response = await fetch(url, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const pageProducts = data.products || [];

    allProducts = allProducts.concat(pageProducts);

    // Extract pagination info from headers
    const linkHeader = response.headers.get('link');
    pageInfo = null;

    if (linkHeader) {
      const nextLink = linkHeader.split(',').find(link => link.includes('rel="next"'));
      if (nextLink) {
        const match = nextLink.match(/page_info=([^&>]+)/);
        if (match) {
          pageInfo = match[1];
        }
      }
    }

    console.log(`📦 Fetched ${pageProducts.length} products, total: ${allProducts.length}`);

  } while (pageInfo);

  console.log(`✅ Total products fetched: ${allProducts.length}`);
  return allProducts;
}

// Routes
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: db ? 'connected' : 'disconnected',
    shopify: hasRealCredentials() ? 'configured' : 'demo'
  });
});

// Products endpoint
app.get('/api/v1/products', (req, res) => {
  const limit = parseInt(req.query.limit) || 12;
  const offset = parseInt(req.query.offset) || 0;

  // First get total count
  db.get('SELECT COUNT(*) as total FROM products', (err, countRow) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    const total = countRow.total || 0;

    // Then get paginated products
    db.all('SELECT * FROM products ORDER BY created_at DESC LIMIT ? OFFSET ?', [limit, offset], (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      // Transform rows to match Product interface
      const products = (rows || []).map(row => ({
        id: row.id,
        title: row.title || '',
        vendor: row.vendor,
        product_type: row.product_type,
        status: row.status || 'active',
        variants: row.variants ? JSON.parse(row.variants) : undefined,
        seoScore: row.seo_score,
        lastOptimized: row.last_optimized,
        tags: row.tags ? JSON.parse(row.tags) : undefined,
        seoTitle: row.seo_title,
        seoDescription: row.seo_description,
        description: row.description
      }));

      // Return in expected format
      res.json({
        success: true,
        data: {
          products: products,
          stats: {
            total: total,
            pending: 0,
            processing: 0,
            completed: total,
            failed: 0,
            needs_review: 0
          },
          pagination: {
            limit: limit,
            offset: offset,
            total: total
          }
        }
      });
    });
  });
});

// Dashboard stats endpoint
app.get('/api/v1/products/stats/overview', (req, res) => {
  db.get('SELECT COUNT(*) as total FROM products', (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    const stats = {
      total: row.total || 0,
      pending: 0,
      processing: 0,
      completed: row.total || 0,
      failed: 0,
      needs_review: 0
    };

    res.json({
      success: true,
      data: stats
    });
  });
});

// Real Shopify sync endpoint
app.post('/api/v1/products/sync', async (req, res) => {
  console.log('🔄 Sync products endpoint called');

  if (!hasRealCredentials()) {
    return res.status(400).json({
      success: false,
      message: 'Shopify credentials not configured'
    });
  }

  try {
    console.log('🛍️  Fetching real products from Shopify...');
    console.log('🏪 Store:', process.env.SHOPIFY_STORE_NAME);

    // Fetch products from Shopify
    const shopifyProducts = await fetchShopifyProducts();
    console.log(`📦 Found ${shopifyProducts.length} products in Shopify store`);

    if (!shopifyProducts || shopifyProducts.length === 0) {
      return res.json({
        success: true,
        message: 'No products found in Shopify store',
        data: {
          synced: 0,
          updated: 0,
          created: 0
        }
      });
    }

    // Clear existing products
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM products', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Insert new products
    let inserted = 0;
    for (const product of shopifyProducts) {
      try {
        await new Promise((resolve, reject) => {
          const insertQuery = `INSERT INTO products (
            id, title, description, vendor, product_type, status,
            tags, seo_title, seo_description
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

          db.run(insertQuery, [
            product.id.toString(),
            product.title,
            product.body_html,
            product.vendor,
            product.product_type,
            product.status,
            JSON.stringify(product.tags || []),
            product.seo_title,
            product.seo_description
          ], function(err) {
            if (err) {
              console.error('Error inserting product:', err);
              reject(err);
            } else {
              inserted++;
              resolve();
            }
          });
        });
      } catch (error) {
        console.error('Error processing product:', product.id, error);
      }
    }

    console.log(`✅ Successfully synced ${inserted} products`);

    res.json({
      success: true,
      message: 'Real Shopify products synced successfully',
      data: {
        synced: inserted,
        updated: 0,
        created: inserted,
        store: process.env.SHOPIFY_STORE_NAME
      }
    });

  } catch (error) {
    console.error('❌ Shopify sync error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to sync products from Shopify',
      error: error.message
    });
  }
});

// Start server
async function startServer() {
  try {
    await initDatabase();

    app.listen(PORT, () => {
      console.log(`🚀 Real Shopify API server running on port ${PORT}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/health`);
      console.log(`📦 Products API: http://localhost:${PORT}/api/v1/products`);
      console.log(`📊 Stats API: http://localhost:${PORT}/api/v1/products/stats/overview`);
      console.log(`🔄 Sync API: POST http://localhost:${PORT}/api/v1/products/sync`);
      console.log(`🛍️  Shopify: ${hasRealCredentials() ? '✅ Real credentials configured' : '⚠️  Demo mode'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();