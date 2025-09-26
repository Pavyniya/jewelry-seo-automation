import { ShopifyService } from '../shopifyService';
import axios from 'axios';

jest.mock('axios');

describe('ShopifyService', () => {
  let shopifyService: ShopifyService;
  const mockAxios = axios as jest.Mocked<typeof axios>;

  beforeEach(() => {
    const mockAxiosInstance = {
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
      get: jest.fn(),
    };
    mockAxios.create.mockReturnValue(mockAxiosInstance as any);
    shopifyService = new ShopifyService();
  });

  it('should fetch shop info successfully', async () => {
    const mockShop = { name: 'Test Shop' };
    (mockAxios.create().get as jest.Mock).mockResolvedValue({ data: { shop: mockShop } });

    const shopInfo = await shopifyService.getShopInfo();

    expect(shopInfo.name).toBe('Test Shop');
    expect(mockAxios.create().get).toHaveBeenCalledWith('/shop.json');
  });

  it('should fetch products successfully', async () => {
    const mockProducts = [{ id: 1, title: 'Test Product' }];
    (mockAxios.create().get as jest.Mock).mockResolvedValue({ 
      data: { products: mockProducts },
      headers: { link: '' }
    });

    const products = await shopifyService.fetchAllProducts();

    expect(products).toHaveLength(1);
    expect(products[0].title).toBe('Test Product');
  });
});