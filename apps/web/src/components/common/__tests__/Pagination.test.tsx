import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Pagination from '../../common/Pagination';

describe('Pagination', () => {
  it('calls onPageChange with the correct page number', () => {
    const onPageChange = jest.fn();
    render(
      <Pagination 
        currentPage={1} 
        totalPages={3} 
        onPageChange={onPageChange} 
      />
    );

    const page2Button = screen.getByText('2');
    fireEvent.click(page2Button);

    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});
