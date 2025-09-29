import React, { useEffect } from 'react';
import { useAiProviderStore } from '@/stores/aiProviderStore';
import { ProviderHealth } from '@/components/ai-providers/ProviderHealth';
import { CostAnalysis } from '@/components/ai-providers/CostAnalysis';
import { RateLimitStatus } from '@/components/ai-providers/RateLimitStatus';
import { PerformanceMetrics } from '@/components/ai-providers/PerformanceMetrics';
import { Button } from '@/components/ui/Button';

export const AiProviderDashboard: React.FC = () => {
  const {
    providers,
    performance,
    costOptimization,
    rateLimits,
    loading,
    errors,
    optimizeProviders,
    refreshData,
    availableProviders
  } = useAiProviderStore();

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handleOptimize = async () => {
    try {
      await optimizeProviders();
    } catch (error) {
      console.error('Error optimizing providers:', error);
    }
  };

  const getHealthSummary = () => {
    const healthy = providers.filter(p => p.status === 'healthy').length;
    const degraded = providers.filter(p => p.status === 'degraded').length;
    const down = providers.filter(p => p.status === 'down').length;
    return { healthy, degraded, down };
  };

  const healthSummary = getHealthSummary();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Provider Management</h1>
          <p className="text-gray-600 mt-2">
            Monitor and optimize AI service providers for reliable content generation
          </p>
        </div>
        <div className="flex space-x-4">
          <Button
            onClick={refreshData}
            disabled={loading.health}
            variant="outline"
          >
            {loading.health ? 'Refreshing...' : 'Refresh Data'}
          </Button>
          <Button
            onClick={handleOptimize}
            disabled={loading.optimization}
          >
            {loading.optimization ? 'Optimizing...' : 'Optimize Providers'}
          </Button>
        </div>
      </div>

      {/* Health Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <div>
              <p className="text-sm text-gray-600">Healthy</p>
              <p className="text-2xl font-bold text-gray-900">{healthSummary.healthy}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
            <div>
              <p className="text-sm text-gray-600">Degraded</p>
              <p className="text-2xl font-bold text-gray-900">{healthSummary.degraded}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <div>
              <p className="text-sm text-gray-600">Down</p>
              <p className="text-2xl font-bold text-gray-900">{healthSummary.down}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            <div>
              <p className="text-sm text-gray-600">Available</p>
              <p className="text-2xl font-bold text-gray-900">{availableProviders.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {errors.health && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{errors.health}</p>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ProviderHealth providers={providers} />
        </div>
        <div className="space-y-6">
          <RateLimitStatus rateLimits={rateLimits} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CostAnalysis costData={costOptimization} />
        <PerformanceMetrics performance={performance} />
      </div>
    </div>
  );
};