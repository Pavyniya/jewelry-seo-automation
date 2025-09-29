import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Skeleton, CardSkeleton, DashboardGridSkeleton } from './ui/Skeleton';
import { ErrorBoundary } from './ui/ErrorBoundary';
import toast from 'react-hot-toast';
import { useMemoWithInvalidation, useMemoizedCallback } from '@/hooks/useMemoizedCallback';
import { useProductStore } from '@/stores/productStore';
import {
  TrendingUp,
  Settings,
  Users,
  ShoppingCart,
  AlertCircle,
  RefreshCw,
  Plus,
  Search,
  Filter,
  Download
} from 'lucide-react';

interface DashboardProps {
  title?: string;
  loading?: boolean;
  error?: Error | null;
  data?: any;
  onRefresh?: () => void;
  onAction?: (action: string) => void;
}

interface DashboardStats {
  totalProducts: number;
  activeOptimizations: number;
  completedTasks: number;
  pendingReviews: number;
}

interface EmptyStateProps {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
}

const EmptyState: React.FC<EmptyStateProps> = React.memo(({ title, description, action }) => (
  <div className="text-center py-12">
    <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
      <AlertCircle className="w-12 h-12 text-gray-400" />
    </div>
    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
      {title}
    </h3>
    <p className="text-gray-600 dark:text-gray-400 mb-6">
      {description}
    </p>
    {action && (
      <Button onClick={action.onClick} className="flex items-center gap-2">
        {action.icon}
        {action.label}
      </Button>
    )}
  </div>
));

const ErrorState: React.FC<{ error: Error; onRetry?: () => void }> = React.memo(({ error, onRetry }) => (
  <div className="text-center py-12">
    <div className="mx-auto w-24 h-24 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
      <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
    </div>
    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
      Something went wrong
    </h3>
    <p className="text-gray-600 dark:text-gray-400 mb-6">
      {error.message}
    </p>
    {onRetry && (
      <Button onClick={onRetry} variant="outline" className="flex items-center gap-2">
        <RefreshCw className="w-4 h-4" />
        Try Again
      </Button>
    )}
  </div>
));

const StatCard: React.FC<{
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative';
  icon: React.ReactNode;
  loading?: boolean;
}> = React.memo(({ title, value, change, changeType, icon, loading }) => {
  if (loading) {
    return <CardSkeleton header={false} lines={2} />;
  }

  const changeColor = useMemo(() =>
    changeType === 'positive'
      ? 'text-emerald-600 dark:text-emerald-400'
      : 'text-red-600 dark:text-red-400',
    [changeType]
  );

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
          {icon}
        </div>
        {change && (
          <span className={`text-sm font-medium ${changeColor}`}>
            {change}
          </span>
        )}
      </div>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
        {value}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {title}
      </p>
    </Card>
  );
});

const Dashboard: React.FC<DashboardProps> = ({
  title = "Jewelry SEO Automation",
  loading = false,
  error = null,
  data,
  onRefresh,
  onAction,
}) => {
  // Using react-hot-toast instead of custom toast
  const [mounted, setMounted] = useState(false);
  
  // Get real data from stores
  const { allProducts, loading: productsLoading, fetchProducts } = useProductStore();

  // Calculate real stats from actual data
  const stats = useMemo(() => {
    if (!allProducts || allProducts.length === 0) return null;
    
    const activeOptimizations = allProducts.filter(p => p.status === 'active').length;
    const pendingReviews = allProducts.filter(p => p.status === 'pending').length;
    const completedTasks = allProducts.filter(p => p.seoScore && p.seoScore > 80).length;
    
    return {
      totalProducts: allProducts.length,
      activeOptimizations,
      completedTasks,
      pendingReviews,
    };
  }, [allProducts]);

  useEffect(() => {
    setMounted(true);
    // Load real data on mount
    fetchProducts();
  }, [fetchProducts]);

  const handleRefresh = useMemoizedCallback(
    () => {
      toast.loading('Refreshing dashboard...');
      fetchProducts();
      onRefresh?.();
    },
    [fetchProducts, onRefresh],
    { maxCacheSize: 5 }
  );

  const handleAction = useMemoizedCallback(
    (action: string) => {
      onAction?.(action);
      toast.success(`${action} started successfully`);
    },
    [onAction],
    { maxCacheSize: 10 }
  );

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <DashboardGridSkeleton cards={4} />
      </div>
    );
  }

  return (
    <ErrorBoundary level="page" showToast={true}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {title}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Monitor and manage your SEO automation
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  loading={loading}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </Button>
                <Button
                  onClick={() => handleAction('export')}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error ? (
            <ErrorState error={error} onRetry={handleRefresh} />
          ) : (loading || productsLoading) ? (
            <DashboardGridSkeleton cards={4} />
          ) : !stats ? (
            <Card>
              <EmptyState
                title="No data available"
                description="Get started by setting up your first SEO optimization."
                action={{
                  label: 'Create Optimization',
                  onClick: () => handleAction('create'),
                  icon: <Plus className="w-4 h-4" />,
                }}
              />
            </Card>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                  title="Total Products"
                  value={stats.totalProducts.toLocaleString()}
                  change="+12.5%"
                  changeType="positive"
                  icon={<ShoppingCart className="w-6 h-6 text-primary-600" />}
                  loading={productsLoading}
                />
                <StatCard
                  title="Active Optimizations"
                  value={stats.activeOptimizations}
                  change="+8.2%"
                  changeType="positive"
                  icon={<TrendingUp className="w-6 h-6 text-emerald-600" />}
                  loading={productsLoading}
                />
                <StatCard
                  title="Completed Tasks"
                  value={stats.completedTasks.toLocaleString()}
                  change="+23.1%"
                  changeType="positive"
                  icon={<Settings className="w-6 h-6 text-blue-600" />}
                  loading={productsLoading}
                />
                <StatCard
                  title="Pending Reviews"
                  value={stats.pendingReviews}
                  change="-5.4%"
                  changeType="negative"
                  icon={<Users className="w-6 h-6 text-amber-600" />}
                  loading={productsLoading}
                />
              </div>

              {/* Quick Actions */}
              <Card className="p-6 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Quick Actions
                  </h2>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                      Filter
                    </Button>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <Search className="w-4 h-4" />
                      Search
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button
                    variant="outline"
                    className="h-auto p-6 flex-col gap-3"
                    onClick={() => handleAction('products')}
                  >
                    <ShoppingCart className="w-8 h-8" />
                    <span>Manage Products</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto p-6 flex-col gap-3"
                    onClick={() => handleAction('optimizations')}
                  >
                    <TrendingUp className="w-8 h-8" />
                    <span>Optimizations</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto p-6 flex-col gap-3"
                    onClick={() => handleAction('analytics')}
                  >
                    <Settings className="w-8 h-8" />
                    <span>Analytics</span>
                  </Button>
                </div>
              </Card>

              {/* Recent Activity */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Recent Activity
                </h2>
                <div className="space-y-4">
                  {productsLoading ? (
                    <Skeleton lines={5} />
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-600 dark:text-gray-400">
                        No recent activity
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Dashboard;