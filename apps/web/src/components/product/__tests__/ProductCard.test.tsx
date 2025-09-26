import React from 'react';
import { render, screen } from '@testing-library/react';
import ProductCard from '../ProductCard';
import { Product } from '@/types/product';

const mockProduct: Product = {
  id: '1',
  title: 'Test Product',
  vendor: 'Test Vendor',
  product_type: 'Test Type',
  status: 'active',
};

describe('ProductCard', () => {
  it('renders product information correctly', () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('by Test Vendor')).toBeInTheDocument();
    expect(screen.getByText('Test Type')).toBeInTheDocument();
  });
});
