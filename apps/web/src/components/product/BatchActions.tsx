import React from 'react';
import { Button } from '@/components/ui/Button';
import { useProductStore } from '@/stores/productStore';

const BatchActions: React.FC = () => {
  const { selectedProducts, clearProductSelection } = useProductStore();

  if (selectedProducts.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {selectedProducts.length} selected
      </p>
      <Button variant="outline" size="sm" onClick={clearProductSelection}>
        Clear selection
      </Button>
      <Button size="sm">
        Optimize selected
      </Button>
    </div>
  );
};

export default BatchActions;
