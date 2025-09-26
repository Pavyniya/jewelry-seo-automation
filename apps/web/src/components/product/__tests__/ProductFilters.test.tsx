import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ProductFilters from '../ProductFilters';

describe('ProductFilters', () => {
  it('calls setSearchTerm when the search input changes', () => {
    const setSearchTerm = jest.fn();
    render(
      <ProductFilters
        searchTerm=""
        setSearchTerm={setSearchTerm}
        selectedCategory="all"
        setSelectedCategory={() => {}}
        categories={['all', 'test']}
        sortBy="title"
        sortOrder="asc"
        setSortBy={() => {}}
        setSortOrder={() => {}}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search products...');
    fireEvent.change(searchInput, { target: { value: 'test' } });

    expect(setSearchTerm).toHaveBeenCalledWith('test');
  });
});
