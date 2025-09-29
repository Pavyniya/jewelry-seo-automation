import { render, screen, fireEvent } from '@/test/utils';
import { ProductCard } from '@/components/product/ProductCard';
import { Product } from '@jewelry-seo/shared/types/product';

// Mock product data
const mockProduct: Product = {
  id: '1',
  title: 'Gold Ring',
  vendor: 'Test Vendor',
  product_type: 'Ring',
  price: 299.99,
  status: 'active',
  images: ['test-image.jpg'],
  tags: ['ring', 'gold', 'diamond'],
  seoTitle: 'Gold Ring - Beautiful Jewelry',
  seoDescription: 'Discover our beautiful gold ring',
  optimizedDescription: 'Optimized description for gold ring',
  optimizationStatus: 'completed',
  lastOptimized: new Date(),
  createdAt: new Date(),
  updatedAt: new Date()
};

describe('ProductCard Component', () => {
  it('renders product information correctly', () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText(mockProduct.title)).toBeInTheDocument();
    expect(screen.getByText(mockProduct.vendor)).toBeInTheDocument();
    expect(screen.getByText(`$${mockProduct.price}`)).toBeInTheDocument();
    expect(screen.getByText(mockProduct.product_type)).toBeInTheDocument();
  });

  it('displays product image', () => {
    render(<ProductCard product={mockProduct} />);

    const image = screen.getByAltText(mockProduct.title);
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', mockProduct.images[0]);
  });

  it('shows optimization status badge', () => {
    render(<ProductCard product={mockProduct} />);

    const statusBadge = screen.getByTestId('optimization-status');
    expect(statusBadge).toBeInTheDocument();
    expect(statusBadge).toHaveTextContent('Completed');
  });

  it('shows loading state when isLoading is true', () => {
    render(<ProductCard product={mockProduct} isLoading={true} />);

    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
    expect(screen.queryByText(mockProduct.title)).not.toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<ProductCard product={mockProduct} onClick={handleClick} />);

    fireEvent.click(screen.getByTestId('product-card'));
    expect(handleClick).toHaveBeenCalledWith(mockProduct);
  });

  it('calls onOptimize when optimize button is clicked', () => {
    const handleOptimize = jest.fn();
    render(<ProductCard product={mockProduct} onOptimize={handleOptimize} />);

    fireEvent.click(screen.getByTestId('optimize-button'));
    expect(handleOptimize).toHaveBeenCalledWith(mockProduct);
  });

  it('disables optimize button when isOptimizing', () => {
    const handleOptimize = jest.fn();
    render(<ProductCard product={mockProduct} onOptimize={handleOptimize} isOptimizing={true} />);

    const optimizeButton = screen.getByTestId('optimize-button');
    expect(optimizeButton).toBeDisabled();
    expect(optimizeButton).toHaveTextContent('Optimizing...');
  });

  it('shows SEO score when available', () => {
    const productWithScore = { ...mockProduct, seoScore: 85 };
    render(<ProductCard product={productWithScore} />);

    expect(screen.getByText('SEO Score: 85')).toBeInTheDocument();
  });

  it('displays tags correctly', () => {
    render(<ProductCard product={mockProduct} />);

    mockProduct.tags.forEach(tag => {
      expect(screen.getByText(tag)).toBeInTheDocument();
    });
  });

  it('shows last optimized date', () => {
    render(<ProductCard product={mockProduct} />);

    const optimizedDate = screen.getByTestId('last-optimized');
    expect(optimizedDate).toBeInTheDocument();
  });

  it('applies different status styles', () => {
    const pendingProduct = { ...mockProduct, optimizationStatus: 'pending' as const };
    render(<ProductCard product={pendingProduct} />);

    const statusBadge = screen.getByTestId('optimization-status');
    expect(statusBadge).toHaveClass('status-pending');
  });

  it('shows error state when error prop is provided', () => {
    render(<ProductCard product={mockProduct} error="Optimization failed" />);

    expect(screen.getByText('Optimization failed')).toBeInTheDocument();
  });
});