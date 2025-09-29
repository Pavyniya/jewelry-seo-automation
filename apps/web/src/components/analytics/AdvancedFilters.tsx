
import React from 'react';
import useAnalyticsStore from '../../stores/analyticsStore';

const AdvancedFilters: React.FC = () => {
  const { filters, setFilters } = useAnalyticsStore();

  const handleDateRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters({ dateRange: e.target.value });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Advanced Filters</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="product-attribute" className="block text-sm font-medium text-gray-700">Product Attribute</label>
          <select id="product-attribute" className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
            <option>Category</option>
            <option>Vendor</option>
            <option>Price</option>
          </select>
        </div>
        <div>
          <label htmlFor="date-range" className="block text-sm font-medium text-gray-700">Date Range</label>
          <select
            id="date-range"
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
            value={filters.dateRange}
            onChange={handleDateRangeChange}
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
        <div>
          <label htmlFor="segment" className="block text-sm font-medium text-gray-700">Customer Segment</label>
          <select id="segment" className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
            <option>New Visitors</option>
            <option>Returning Customers</option>
            <option>VIP</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default AdvancedFilters;
