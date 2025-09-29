import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { clsx } from 'clsx';

interface VirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight: number | ((index: number) => number);
  estimatedItemHeight?: number;
  className?: string;
  overscan?: number;
  onEndReached?: () => void;
  endReachedThreshold?: number;
  loading?: boolean;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
}

export function VirtualList<T>({
  items,
  renderItem,
  itemHeight,
  estimatedItemHeight = 50,
  className,
  overscan = 3,
  onEndReached,
  endReachedThreshold = 200,
  loading = false,
  loadingComponent,
  emptyComponent,
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  // Calculate item heights
  const getItemHeight = useCallback(
    (index: number) => {
      return typeof itemHeight === 'function' ? itemHeight(index) : itemHeight;
    },
    [itemHeight]
  );

  // Calculate item positions
  const itemPositions = useMemo(() => {
    const positions: number[] = [];
    let currentOffset = 0;

    for (let i = 0; i < items.length; i++) {
      positions.push(currentOffset);
      currentOffset += getItemHeight(i);
    }

    return { positions, totalHeight: currentOffset };
  }, [items, getItemHeight]);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    if (!containerHeight) return { start: 0, end: 0 };

    const start = Math.max(
      0,
      itemPositions.positions.findIndex((offset) => offset + getItemHeight(0) > scrollTop) - overscan
    );

    let end = start;
    let currentHeight = 0;

    while (end < items.length && currentHeight < containerHeight + overscan * estimatedItemHeight) {
      currentHeight += getItemHeight(end);
      end++;
    }

    return { start, end: Math.min(end, items.length) };
  }, [scrollTop, containerHeight, itemPositions, items, overscan, estimatedItemHeight, getItemHeight]);

  // Handle scroll
  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      const newScrollTop = containerRef.current.scrollTop;
      setScrollTop(newScrollTop);

      // Check if we've reached the end
      if (onEndReached) {
        const scrollHeight = itemPositions.totalHeight;
        const clientHeight = containerHeight;
        const scrollBottom = newScrollTop + clientHeight;

        if (scrollBottom >= scrollHeight - endReachedThreshold && !loading) {
          onEndReached();
        }
      }
    }
  }, [onEndReached, itemPositions.totalHeight, containerHeight, endReachedThreshold, loading]);

  // Update container height
  useEffect(() => {
    if (containerRef.current) {
      const updateHeight = () => {
        setContainerHeight(containerRef.current?.clientHeight || 0);
      };

      updateHeight();
      const resizeObserver = new ResizeObserver(updateHeight);
      resizeObserver.observe(containerRef.current);

      return () => resizeObserver.disconnect();
    }
  }, []);

  // Add scroll listener
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Render visible items
  const visibleItems = useMemo(() => {
    const itemsToRender = [];
    for (let i = visibleRange.start; i < visibleRange.end; i++) {
      itemsToRender.push(
        <div
          key={i}
          className="absolute left-0 right-0 will-change-transform"
          style={{
            top: itemPositions.positions[i],
            height: getItemHeight(i),
          }}
        >
          {renderItem(items[i], i)}
        </div>
      );
    }
    return itemsToRender;
  }, [visibleRange, items, renderItem, itemPositions, getItemHeight]);

  if (items.length === 0 && !loading) {
    return (
      <div className={clsx('flex items-center justify-center', className)}>
        {emptyComponent || <p className="text-gray-500">No items found</p>}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={clsx('relative overflow-auto', className)}
      style={{ height: containerHeight || '100%' }}
    >
      {/* Total height container */}
      <div style={{ height: itemPositions.totalHeight }}>
        {/* Visible items */}
        {visibleItems}
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="absolute bottom-0 left-0 right-0 flex justify-center p-4 bg-white bg-opacity-90">
          {loadingComponent || (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span className="text-gray-600">Loading more...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Hook for virtual list
export function useVirtualList<T>(
  items: T[],
  options: {
    itemHeight: number | ((index: number) => number);
    estimatedItemHeight?: number;
    overscan?: number;
  }
) {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 10 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateVisibleRange = () => {
      if (!containerRef.current) return;

      const { scrollTop, clientHeight } = containerRef.current;
      const estimatedItemHeight = options.estimatedItemHeight || 50;
      const overscan = options.overscan || 3;

      const start = Math.max(
        0,
        Math.floor(scrollTop / estimatedItemHeight) - overscan
      );
      const end = Math.min(
        items.length,
        Math.ceil((scrollTop + clientHeight) / estimatedItemHeight) + overscan
      );

      setVisibleRange({ start, end });
    };

    const container = containerRef.current;
    container.addEventListener('scroll', updateVisibleRange, { passive: true });
    updateVisibleRange();

    return () => container.removeEventListener('scroll', updateVisibleRange);
  }, [items.length, options]);

  return {
    containerRef,
    visibleRange,
    visibleItems: items.slice(visibleRange.start, visibleRange.end),
  };
}