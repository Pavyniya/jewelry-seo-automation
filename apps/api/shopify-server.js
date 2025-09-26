const express = require('express');
const app = express();
const PORT = 3001;

const SHOPIFY_STORE = process.env.SHOPIFY_STORE || 'vqgsa5-kc.myshopify.com';
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

async function fetchFromShopify(endpoint) {
  const url = `https://${SHOPIFY_STORE}/admin/api/2024-01/${endpoint}`;
  console.log('Fetching from Shopify:', url);

  const response = await fetch(url, {
    headers: {
      'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN
    }
  });

  console.log('Shopify response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.log('Shopify error response:', errorText);
    throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

function transformShopifyProduct(shopifyProduct) {
  return {
    id: shopifyProduct.id.toString(),
    title: shopifyProduct.title,
    description: shopifyProduct.body_html.replace(/<[^>]*>/g, ''),
    vendor: shopifyProduct.vendor,
    productType: shopifyProduct.product_type,
    tags: shopifyProduct.tags,
    variants: JSON.stringify(shopifyProduct.variants),
    images: JSON.stringify(shopifyProduct.images),
    price: shopifyProduct.variants[0]?.price || 0,
    sku: shopifyProduct.variants[0]?.sku || '',
    seoTitle: shopifyProduct.title,
    seoDescription: shopifyProduct.body_html.replace(/<[^>]*>/g, '').substring(0, 160),
    optimizedDescription: null,
    optimizationStatus: 'pending',
    lastOptimized: null,
    createdAt: shopifyProduct.created_at,
    updatedAt: shopifyProduct.updated_at,
    shopifyData: JSON.stringify(shopifyProduct),
    syncVersion: 1
  };
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Shopify integration server running' });
});

app.get('/api/v1/products', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const shopifyResponse = await fetchFromShopify(`products.json?limit=${limit}`);
    const shopifyProducts = shopifyResponse.products;

    const products = shopifyProducts.map(transformShopifyProduct);

    const countResponse = await fetchFromShopify('products/count.json');
    const totalCount = countResponse.count;

    res.json({
      success: true,
      data: {
        products,
        stats: {
          total: totalCount,
          pending: totalCount,
          processing: 0,
          completed: 0,
          failed: 0,
          needs_review: 0
        },
        pagination: {
          limit: parseInt(limit),
          offset: 0,
          total: totalCount
        }
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products from Shopify'
    });
  }
});

app.get('/api/v1/products/stats/overview', async (req, res) => {
  try {
    const countResponse = await fetchFromShopify('products/count.json');
    const totalCount = countResponse.count;

    res.json({
      success: true,
      data: {
        total: totalCount,
        pending: totalCount,
        processing: 0,
        completed: 0,
        failed: 0,
        needs_review: 0,
        avgOptimizationTime: 0,
        lastSyncTime: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stats from Shopify'
    });
  }
});

app.listen(PORT, () => {
  console.log('✅ Shopify integration server running on port', PORT);
});