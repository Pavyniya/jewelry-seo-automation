import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import BatchActions from '../BatchActions';
import { useProductStore } from '@/stores/productStore';

const mockUseProductStore = useProductStore as jest.Mock;

jest.mock('@/stores/productStore');

describe('BatchActions', () => {
  it('renders nothing when no products are selected', () => {
    mockUseProductStore.mockReturnValue({ selectedProducts: [] });
    const { container } = render(<BatchActions />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders actions when products are selected', () => {
    mockUseProductStore.mockReturnValue({ selectedProducts: ['1', '2'] });
    render(<BatchActions />);

    expect(screen.getByText('2 selected')).toBeInTheDocument();
    expect(screen.getByText('Clear selection')).toBeInTheDocument();
    expect(screen.getByText('Optimize selected')).toBeInTheDocument();
  });

  it('calls clearProductSelection when the clear button is clicked', () => {
    const clearProductSelection = jest.fn();
    mockUseProductStore.mockReturnValue({ selectedProducts: ['1', '2'], clearProductSelection });
    render(<BatchActions />);

    const clearButton = screen.getByText('Clear selection');
    fireEvent.click(clearButton);

    expect(clearProductSelection).toHaveBeenCalled();
  });
});
