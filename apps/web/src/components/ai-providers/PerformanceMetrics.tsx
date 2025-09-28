import React from 'react';
import { ProviderPerformance } from '@jewelry-seo/shared/types/aiProvider';

interface PerformanceMetricsProps {
  performance: ProviderPerformance[];
}

export const PerformanceMetricsComponent: React.FC<PerformanceMetricsProps> = ({ performance }) => {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatResponseTime = (time: number) => {
    if (time < 1000) {
      return `${Math.round(time)}ms`;
    }
    return `${(time / 1000).toFixed(1)}s`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getPerformanceBg = (score: number) => {
    if (score >= 90) return 'bg-green-50 border-green-200';
    if (score >= 70) return 'bg-yellow-50 border-yellow-200';
    if (score >= 50) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  const getUptimeColor = (uptime: number) => {
    if (uptime >= 99) return 'text-green-600';
    if (uptime >= 95) return 'text-yellow-600';
    if (uptime >= 90) return 'text-orange-600';
    return 'text-red-600';
  };

  if (performance.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Performance Metrics</h2>
          <p className="text-sm text-gray-600 mt-1">Detailed performance analysis for all providers</p>
        </div>
        <div className="p-6">
          <div className="text-center py-8">
            <p className="text-gray-500">No performance data available</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate aggregate metrics
  const totalRequests = performance.reduce((sum, p) => sum + p.totalRequests, 0);
  const totalSuccessful = performance.reduce((sum, p) => sum + p.successfulRequests, 0);
  const totalFailed = performance.reduce((sum, p) => sum + p.failedRequests, 0);
  const averageResponseTime = performance.reduce((sum, p) => sum + p.averageResponseTime, 0) / performance.length;
  const overallSuccessRate = totalRequests > 0 ? (totalSuccessful / totalRequests) * 100 : 0;

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Performance Metrics</h2>
        <p className="text-sm text-gray-600 mt-1">Detailed performance analysis for all providers</p>
      </div>

      <div className="p-6">
        {/* Aggregate Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-center">
              <p className="text-sm text-blue-600 font-medium">Total Requests</p>
              <p className="text-2xl font-bold text-blue-800">{formatNumber(totalRequests)}</p>
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-center">
              <p className="text-sm text-green-600 font-medium">Success Rate</p>
              <p className="text-2xl font-bold text-green-800">{overallSuccessRate.toFixed(1)}%</p>
            </div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="text-center">
              <p className="text-sm text-purple-600 font-medium">Avg Response Time</p>
              <p className="text-2xl font-bold text-purple-800">{formatResponseTime(averageResponseTime)}</p>
            </div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="text-center">
              <p className="text-sm text-orange-600 font-medium">Failed Requests</p>
              <p className="text-2xl font-bold text-orange-800">{formatNumber(totalFailed)}</p>
            </div>
          </div>
        </div>

        {/* Provider Performance Details */}
        <div className="space-y-4">
          {performance.map((provider) => (
            <div
              key={provider.providerId}
              className={`border rounded-lg p-4 ${getPerformanceBg(provider.performanceScore)}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{provider.providerId}</h3>
                  <p className="text-sm text-gray-600">
                    Last updated: {new Date(provider.lastUpdated).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Performance Score</p>
                  <p className={`text-2xl font-bold ${getPerformanceColor(provider.performanceScore)}`}>
                    {provider.performanceScore}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Total Requests</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatNumber(provider.totalRequests)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Successful</p>
                  <p className="text-lg font-semibold text-green-600">
                    {formatNumber(provider.successfulRequests)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Failed</p>
                  <p className="text-lg font-semibold text-red-600">
                    {formatNumber(provider.failedRequests)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Uptime</p>
                  <p className={`text-lg font-semibold ${getUptimeColor(provider.uptime)}`}>
                    {provider.uptime.toFixed(1)}%
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Average Response Time</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatResponseTime(provider.averageResponseTime)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Average Cost</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency(provider.averageCost)}
                  </p>
                </div>
              </div>

              {/* Performance Indicators */}
              <div className="mt-4 flex flex-wrap gap-2">
                {provider.performanceScore >= 90 && (
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                    Excellent Performance
                  </span>
                )}
                {provider.performanceScore >= 70 && provider.performanceScore < 90 && (
                  <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                    Good Performance
                  </span>
                )}
                {provider.performanceScore >= 50 && provider.performanceScore < 70 && (
                  <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">
                    Average Performance
                  </span>
                )}
                {provider.performanceScore < 50 && (
                  <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                    Poor Performance
                  </span>
                )}
                {provider.uptime >= 99 && (
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                    High Reliability
                  </span>
                )}
                {provider.averageResponseTime < 500 && (
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                    Fast Response
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Performance Summary */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-3">Performance Summary</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Best Performing Provider</p>
              <p className="font-medium text-gray-900">
                {performance.reduce((best, current) =>
                  current.performanceScore > best.performanceScore ? current : best
                ).providerId}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Most Reliable Provider</p>
              <p className="font-medium text-gray-900">
                {performance.reduce((best, current) =>
                  current.uptime > best.uptime ? current : best
                ).providerId}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Fastest Provider</p>
              <p className="font-medium text-gray-900">
                {performance.reduce((best, current) =>
                  current.averageResponseTime < best.averageResponseTime ? current : best
                ).providerId}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Most Used Provider</p>
              <p className="font-medium text-gray-900">
                {performance.reduce((best, current) =>
                  current.totalRequests > best.totalRequests ? current : best
                ).providerId}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { PerformanceMetricsComponent as PerformanceMetrics };