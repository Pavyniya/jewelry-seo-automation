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
    db = new sqlite3.Database('./test_server_fixed.db', (err) => {
      if (err) {
        console.error('Database connection error:', err);
        reject(err);
        return;
      }

      console.log('✅ Database connected');

      // Create basic tables
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

// Routes
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: db ? 'connected' : 'disconnected'
  });
});

// Fixed products endpoint to match frontend expectations
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
          completed: 0,
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
      console.error('Stats query error:', err);
      res.status(500).json({ error: err.message });
      return;
    }

    const stats = {
      total: row.total || 2, // Use our sample data count
      pending: 0,
      processing: 0,
      completed: 2,
      failed: 0,
      needs_review: 0
    };

    console.log('📊 Returning stats:', stats);
    res.json({
      success: true,
      data: stats
    });
  });
});

// Sync products endpoint (check for real Shopify credentials or use demo)
app.post('/api/v1/products/sync', (req, res) => {
  console.log('🔄 Sync products endpoint called');

  // Check if we have real Shopify credentials configured
  const shopifyStore = process.env.SHOPIFY_STORE_NAME;
  const shopifyApiKey = process.env.SHOPIFY_API_KEY;
  const shopifyToken = process.env.SHOPIFY_ACCESS_TOKEN;

  if (shopifyStore && shopifyApiKey && shopifyToken &&
      !shopifyStore.includes('your-store') &&
      !shopifyApiKey.includes('your_') &&
      !shopifyToken.includes('your_')) {

    console.log('🛍️  Real Shopify credentials detected, redirecting to real sync');

    // For now, show instructions to switch to real server
    res.json({
      success: false,
      message: 'Real Shopify credentials detected! Please switch to the real API server:',
      instructions: [
        '1. Stop this test server: pkill -f test-server-fixed.js',
        '2. Start real server: cd apps/api && pnpm dev',
        '3. Your real products will be synced!'
      ]
    });
  } else {
    console.log('🧪 Using demo sync (no real Shopify credentials)');

    // Demo sync - return current sample data
    setTimeout(() => {
      res.json({
        success: true,
        message: 'Demo products synced successfully',
        data: {
          synced: 2,
          updated: 0,
          created: 0,
          note: 'This is demo data. Configure real Shopify credentials to sync your actual store products.'
        }
      });
    }, 1000);
  }
});

// Add some sample products for testing
app.post('/api/v1/products/sample', (req, res) => {
  const sampleProducts = [
    {
      id: '1',
      title: 'Diamond Engagement Ring',
      description: 'Beautiful diamond engagement ring with platinum setting',
      vendor: 'Jewelry Co',
      product_type: 'Rings',
      status: 'active',
      seo_score: 85,
      tags: JSON.stringify(['diamond', 'engagement', 'platinum']),
      seo_title: 'Diamond Engagement Ring - Platinum Setting',
      seo_description: 'Beautiful diamond engagement ring with platinum setting'
    },
    {
      id: '2',
      title: 'Gold Tennis Bracelet',
      description: 'Elegant gold tennis bracelet with diamonds',
      vendor: 'Jewelry Co',
      product_type: 'Bracelets',
      status: 'active',
      seo_score: 72,
      tags: JSON.stringify(['gold', 'tennis', 'bracelet', 'diamonds']),
      seo_title: 'Gold Tennis Bracelet with Diamonds',
      seo_description: 'Elegant gold tennis bracelet with diamonds'
    }
  ];

  const insertQuery = `INSERT INTO products (
    id, title, description, vendor, product_type, status,
    seo_score, tags, seo_title, seo_description
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  db.serialize(() => {
    sampleProducts.forEach(product => {
      db.run(insertQuery, [
        product.id, product.title, product.description, product.vendor,
        product.product_type, product.status, product.seo_score,
        product.tags, product.seo_title, product.seo_description
      ]);
    });

    res.json({ success: true, message: 'Sample products added' });
  });
});

// Start server
async function startServer() {
  try {
    await initDatabase();

    app.listen(PORT, () => {
      console.log(`🚀 Fixed API server running on port ${PORT}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/health`);
      console.log(`📦 Products API: http://localhost:${PORT}/api/v1/products`);
      console.log(`🧪 Add sample data: POST http://localhost:${PORT}/api/v1/products/sample`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();