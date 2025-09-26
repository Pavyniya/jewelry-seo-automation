import { ProductRepository } from '../src/repositories/productRepository';
import { ShopifyService } from '../src/services/shopifyService';
import { database } from '../src/utils/database';
import { ProductModel } from '../src/models/Product';
import { ShopifyProductResponse, CreateProductDTO } from '@jewelry-seo/shared';

// Mock the services before any imports
jest.mock('../src/services/aiService', () => ({
  aiService: {
    generateContent: jest.fn(),
  },
}), { virtual: true });

jest.mock('../src/services/shopifyService');

describe('End-to-End Workflow', () => {
  beforeAll(async () => {
    await database.connect();
  });

  afterAll(async () => {
    await database.close();
  });

  beforeEach(async () => {
    // Ensure database is connected before each test
    if (!database.isConnected()) {
      await database.connect();
    }
  });

  it('should fetch a product, generate SEO content, and save it to the database', async () => {
    // 1. Mock Shopify product
    const mockShopifyProduct: ShopifyProductResponse = {
      id: 123,
      title: 'Test Product',
      body_html: 'Test Description',
      vendor: 'Test Vendor',
      product_type: 'Test Type',
      tags: 'test',
      variants: [{
        id: 456,
        title: 'Default Title',
        price: '99.99',
        sku: 'TEST-SKU',
        inventory_quantity: 10,
        available: true,
      }],
      images: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      published_at: new Date().toISOString(),
    };
    (ShopifyService.prototype.fetchAllProducts as jest.Mock).mockResolvedValue([mockShopifyProduct]);

    // 2. Mock AI service
    const mockAiService = (await import('../src/services/aiService')).aiService;
    const mockGeneratedContent = {
      content: 'Generated SEO Title',
      provider: 'gemini',
      tokensUsed: 10,
      cost: 0.01,
    };
    (mockAiService.generateContent as jest.Mock).mockResolvedValue(mockGeneratedContent);

    // 3. Fetch products from Shopify (mocked)
    const shopifyService = new ShopifyService();
    const shopifyProducts = await shopifyService.fetchAllProducts();
    const product = ProductModel.fromShopifyResponse(shopifyProducts[0]);

    // 4. Save product to database
    const createDto: CreateProductDTO = {
      title: product.title,
      description: product.description,
      vendor: product.vendor,
      productType: product.productType,
      tags: product.tags,
      variants: product.variants,
      images: product.images,
      price: product.price,
      sku: product.sku,
      seoTitle: product.seoTitle,
      seoDescription: product.seoDescription,
      optimizedDescription: product.optimizedDescription,
      optimizationStatus: 'pending',
    };
    const createdProduct = await ProductRepository.create(createDto);

    // 5. Generate SEO content
    const generatedContent = await mockAiService.generateContent('test prompt');

    // 6. Update product with SEO content
    await ProductRepository.update(createdProduct.id, {
      seoTitle: generatedContent.content,
      optimizationStatus: 'needs_review',
    });

    // 7. Verify the updated product
    const foundProduct = await ProductRepository.findById(createdProduct.id);
    expect(foundProduct).toBeDefined();
    expect(foundProduct?.seoTitle).toBe('Generated SEO Title');
    expect(foundProduct?.optimizationStatus).toBe('needs_review');
  });
});
