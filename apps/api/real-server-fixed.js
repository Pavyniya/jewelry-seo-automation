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
        seo_score INTEGER,
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

  db.all('SELECT * FROM products LIMIT ? OFFSET ?', [limit, offset], (err, rows) => {
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
          total: products.length,
          pending: 0,
          processing: 0,
          completed: products.length,
          failed: 0,
          needs_review: 0
        },
        pagination: {
          limit: limit,
          offset: offset,
          total: products.length
        }
      }
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

// Real or demo sync endpoint
app.post('/api/v1/products/sync', (req, res) => {
  console.log('🔄 Sync products endpoint called');

  if (hasRealCredentials()) {
    console.log('🛍️  Real Shopify credentials detected!');
    console.log('🏪 Store:', process.env.SHOPIFY_STORE_NAME);

    // Simulate real sync with placeholder data
    setTimeout(() => {
      res.json({
        success: true,
        message: 'Real Shopify sync simulated successfully',
        data: {
          synced: 5,
          updated: 3,
          created: 2,
          note: 'This is a simulation. Real Shopify integration would sync your actual products from ' + process.env.SHOPIFY_STORE_NAME
        }
      });
    }, 2000);
  } else {
    // Demo sync
    setTimeout(() => {
      res.json({
        success: true,
        message: 'Demo products synced successfully',
        data: {
          synced: 2,
          updated: 0,
          created: 0,
          note: 'Configure real Shopify credentials to sync your actual store products.'
        }
      });
    }, 1000);
  }
});

// Start server
async function startServer() {
  try {
    await initDatabase();

    app.listen(PORT, () => {
      console.log(`🚀 Real API server running on port ${PORT}`);
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