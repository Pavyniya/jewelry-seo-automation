import { useProductStore } from '../../stores/productStore';

describe('productStore', () => {
  it('should fetch products', async () => {
    // This is a basic test to ensure the store can be initialized.
    // More complex testing would require mocking fetch.
    const { fetchProducts } = useProductStore.getState();
    expect(fetchProducts).toBeDefined();
  });
});
