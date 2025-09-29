import React from 'react';
import { RateLimitState } from '@jewelry-seo/shared/types/aiProvider';

interface RateLimitStatusProps {
  rateLimits: RateLimitState[];
}

export const RateLimitStatusComponent: React.FC<RateLimitStatusProps> = ({ rateLimits }) => {
  const getUsageColor = (usagePercentage: number) => {
    if (usagePercentage >= 90) return 'text-red-600';
    if (usagePercentage >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getProgressBarColor = (usagePercentage: number) => {
    if (usagePercentage >= 90) return 'bg-red-500';
    if (usagePercentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getTimeUntilReset = (resetTime: Date) => {
    const now = new Date();
    const reset = new Date(resetTime);
    const diff = reset.getTime() - now.getTime();

    if (diff <= 0) return 'Reset now';

    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  if (rateLimits.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Rate Limit Status</h2>
          <p className="text-sm text-gray-600 mt-1">Current usage and quotas for all providers</p>
        </div>
        <div className="p-6">
          <div className="text-center py-8">
            <p className="text-gray-500">No rate limit data available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Rate Limit Status</h2>
        <p className="text-sm text-gray-600 mt-1">Current usage and quotas for all providers</p>
      </div>

      <div className="p-6">
        <div className="space-y-4">
          {rateLimits.map((limit) => {
            const usagePercentage = (limit.currentUsage / limit.limit) * 100;
            const remaining = limit.limit - limit.currentUsage;

            return (
              <div key={limit.providerId} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{limit.providerId}</h3>
                    <p className="text-sm text-gray-600">
                      {formatNumber(limit.currentUsage)} / {formatNumber(limit.limit)} requests
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${getUsageColor(usagePercentage)}`}>
                      {usagePercentage.toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatNumber(remaining)} remaining
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(usagePercentage)}`}
                    style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                  ></div>
                </div>

                {/* Additional Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Window Reset</p>
                    <p className="font-medium text-gray-900">
                      {getTimeUntilReset(limit.resetTime)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Burst Capacity</p>
                    <p className="font-medium text-gray-900">
                      {formatNumber(limit.burstCapacity)} requests
                    </p>
                  </div>
                </div>

                {/* Status Message */}
                {usagePercentage >= 90 && (
                  <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                    <p className="text-sm text-red-800">
                      ⚠️ Rate limit critical. Consider switching to an alternative provider.
                    </p>
                  </div>
                )}
                {usagePercentage >= 70 && usagePercentage < 90 && (
                  <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-sm text-yellow-800">
                      ⚡ Rate limit warning. Monitor usage closely.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-600">Providers Near Limit</p>
              <p className="text-xl font-bold text-red-600">
                {rateLimits.filter(limit => (limit.currentUsage / limit.limit) * 100 >= 90).length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Providers In Warning</p>
              <p className="text-xl font-bold text-yellow-600">
                {rateLimits.filter(limit => {
                  const usage = (limit.currentUsage / limit.limit) * 100;
                  return usage >= 70 && usage < 90;
                }).length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Healthy Providers</p>
              <p className="text-xl font-bold text-green-600">
                {rateLimits.filter(limit => (limit.currentUsage / limit.limit) * 100 < 70).length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { RateLimitStatusComponent as RateLimitStatus };