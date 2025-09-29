import request from 'supertest';
import express from 'express';
import { productRoutes } from '../products';

// Mock dependencies
jest.mock('../../services/productService');
const productService = require('../../services/productService');

describe('Product API Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/products', productRoutes);
    jest.clearAllMocks();
  });

  describe('GET /api/products', () => {
    it('should return all products', async () => {
      const mockProducts = [
        {
          id: '1',
          title: 'Gold Ring',
          price: 299.99,
          vendor: 'Test Vendor',
          status: 'active'
        },
        {
          id: '2',
          title: 'Silver Necklace',
          price: 199.99,
          vendor: 'Test Vendor',
          status: 'active'
        }
      ];

      productService.getProducts.mockResolvedValue(mockProducts);

      const response = await request(app)
        .get('/api/products')
        .expect(200);

      expect(response.body).toEqual({ products: mockProducts });
      expect(productService.getProducts).toHaveBeenCalledWith({});
    });

    it('should handle query parameters', async () => {
      const mockProducts = [
        {
          id: '1',
          title: 'Gold Ring',
          price: 299.99,
          vendor: 'Test Vendor',
          status: 'active'
        }
      ];

      productService.getProducts.mockResolvedValue(mockProducts);

      const response = await request(app)
        .get('/api/products?status=active&vendor=Test Vendor')
        .expect(200);

      expect(productService.getProducts).toHaveBeenCalledWith({
        status: 'active',
        vendor: 'Test Vendor'
      });
    });

    it('should handle service errors', async () => {
      productService.getProducts.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/products')
        .expect(500);

      expect(response.body).toEqual({ error: 'Database error' });
    });
  });

  describe('GET /api/products/:id', () => {
    it('should return product by ID', async () => {
      const mockProduct = {
        id: '1',
        title: 'Gold Ring',
        price: 299.99,
        vendor: 'Test Vendor',
        status: 'active'
      };

      productService.getProductById.mockResolvedValue(mockProduct);

      const response = await request(app)
        .get('/api/products/1')
        .expect(200);

      expect(response.body).toEqual(mockProduct);
      expect(productService.getProductById).toHaveBeenCalledWith('1');
    });

    it('should return 404 if product not found', async () => {
      productService.getProductById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/products/nonexistent')
        .expect(404);

      expect(response.body).toEqual({ error: 'Product not found' });
    });
  });

  describe('POST /api/products', () => {
    it('should create new product', async () => {
      const productData = {
        title: 'New Gold Ring',
        price: 299.99,
        vendor: 'Test Vendor',
        productType: 'Ring'
      };

      const createdProduct = {
        id: '3',
        ...productData,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      productService.createProduct.mockResolvedValue(createdProduct);

      const response = await request(app)
        .post('/api/products')
        .send(productData)
        .expect(201);

      expect(response.body).toEqual(createdProduct);
      expect(productService.createProduct).toHaveBeenCalledWith(productData);
    });

    it('should validate required fields', async () => {
      const invalidProduct = {
        price: 299.99
        // Missing required title
      };

      const response = await request(app)
        .post('/api/products')
        .send(invalidProduct)
        .expect(400);

      expect(response.body).toEqual({ error: 'Title is required' });
    });

    it('should validate price format', async () => {
      const invalidProduct = {
        title: 'Test Product',
        price: 'invalid'
      };

      const response = await request(app)
        .post('/api/products')
        .send(invalidProduct)
        .expect(400);

      expect(response.body).toEqual({ error: 'Price must be a valid number' });
    });
  });

  describe('PUT /api/products/:id', () => {
    it('should update product', async () => {
      const updateData = {
        title: 'Updated Gold Ring',
        price: 399.99
      };

      const updatedProduct = {
        id: '1',
        title: 'Updated Gold Ring',
        price: 399.99,
        vendor: 'Test Vendor',
        status: 'active',
        updatedAt: new Date()
      };

      productService.updateProduct.mockResolvedValue(updatedProduct);

      const response = await request(app)
        .put('/api/products/1')
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual(updatedProduct);
      expect(productService.updateProduct).toHaveBeenCalledWith('1', updateData);
    });

    it('should return 404 if product not found', async () => {
      productService.updateProduct.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/products/nonexistent')
        .send({ title: 'Updated' })
        .expect(404);

      expect(response.body).toEqual({ error: 'Product not found' });
    });
  });

  describe('DELETE /api/products/:id', () => {
    it('should delete product', async () => {
      productService.deleteProduct.mockResolvedValue(true);

      const response = await request(app)
        .delete('/api/products/1')
        .expect(200);

      expect(response.body).toEqual({ message: 'Product deleted successfully' });
      expect(productService.deleteProduct).toHaveBeenCalledWith('1');
    });

    it('should return 404 if product not found', async () => {
      productService.deleteProduct.mockResolvedValue(false);

      const response = await request(app)
        .delete('/api/products/nonexistent')
        .expect(404);

      expect(response.body).toEqual({ error: 'Product not found' });
    });
  });

  describe('POST /api/products/:id/generate-seo', () => {
    it('should generate SEO content for product', async () => {
      const seoContent = {
        seoTitle: 'Beautiful Gold Ring - Handcrafted Jewelry',
        seoDescription: 'Discover our stunning gold ring...',
        keywords: ['gold ring', 'handcrafted', 'jewelry']
      };

      productService.generateSEOContent.mockResolvedValue(seoContent);

      const response = await request(app)
        .post('/api/products/1/generate-seo')
        .send({ provider: 'openai' })
        .expect(200);

      expect(response.body).toEqual(seoContent);
      expect(productService.generateSEOContent).toHaveBeenCalledWith('1', 'openai');
    });

    it('should validate provider parameter', async () => {
      const response = await request(app)
        .post('/api/products/1/generate-seo')
        .send({}) // Missing provider
        .expect(400);

      expect(response.body).toEqual({ error: 'Provider is required' });
    });
  });
});