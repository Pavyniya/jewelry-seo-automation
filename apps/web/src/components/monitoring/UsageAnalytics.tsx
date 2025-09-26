import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { UsageAnalytics } from '@jewelry-seo/shared/types/monitoring';
import { TrendingUp, DollarSign, Zap, BarChart3, Calendar } from 'lucide-react';

interface UsageAnalyticsProps {
  analytics?: UsageAnalytics;
  loading?: boolean;
}

export const UsageAnalyticsComponent: React.FC<UsageAnalyticsProps> = ({
  analytics,
  loading = false,
}) => {
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');

  const getCostColor = (cost: number) => {
    if (cost > 5) return 'text-red-600';
    if (cost > 2) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getUsagePercentage = (tokens: number, limit: number = 100000) => {
    return Math.min((tokens / limit) * 100, 100);
  };

  const getProviderColor = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'gemini':
        return 'bg-blue-100 text-blue-800';
      case 'claude':
        return 'bg-green-100 text-green-800';
      case 'gpt':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card title="AI Usage Analytics">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card title="AI Usage Analytics">
        <div className="text-center text-gray-500 py-8">
          No usage analytics data available
        </div>
      </Card>
    );
  }

  const totalUsagePercentage = getUsagePercentage(analytics.totalTokens);

  return (
    <Card title="AI Usage Analytics">
      <div className="space-y-6">
        {/* Time Range Selector */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            {(['today', 'week', 'month'] as const).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange(range)}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="sm">
            <BarChart3 className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>

        {/* Overall Usage Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Zap className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">Total Tokens</span>
            </div>
            <div className="text-2xl font-bold text-blue-900">
              {analytics.totalTokens.toLocaleString()}
            </div>
            <div className="text-xs text-blue-600">
              {totalUsagePercentage.toFixed(1)}% of daily limit
            </div>
          </div>

          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-600">Total Cost</span>
            </div>
            <div className={`text-2xl font-bold ${getCostColor(analytics.totalCost)}`}>
              ${analytics.totalCost.toFixed(2)}
            </div>
            <div className="text-xs text-green-600">
              Estimated monthly: ${(analytics.totalCost * 30).toFixed(2)}
            </div>
          </div>

          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-600">Avg Cost/Request</span>
            </div>
            <div className="text-2xl font-bold text-purple-900">
              ${(analytics.totalCost / Object.values(analytics.providerBreakdown).reduce((sum, p) => sum + p.requests, 0) || 1).toFixed(3)}
            </div>
            <div className="text-xs text-purple-600">
              Per 1K tokens: ${(analytics.totalCost / analytics.totalTokens * 1000).toFixed(2)}
            </div>
          </div>
        </div>

        {/* Provider Breakdown */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Provider Breakdown</h4>
          <div className="space-y-3">
            {Object.entries(analytics.providerBreakdown).map(([provider, data]) => (
              <div key={provider} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Badge className={getProviderColor(provider)}>
                    {provider}
                  </Badge>
                  <div>
                    <div className="font-medium text-sm">{data.requests} requests</div>
                    <div className="text-xs text-gray-600">{data.usage.toLocaleString()} tokens</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-sm">${data.cost.toFixed(2)}</div>
                  <div className="text-xs text-gray-600">
                    ${(data.cost / data.usage * 1000).toFixed(2)}/1K tokens
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Usage Trend */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">Daily Usage Trend</h4>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>Last 7 days</span>
            </div>
          </div>

          <div className="space-y-2">
            {Object.entries(analytics.dailyUsage).map(([date, data]) => {
              const dayPercentage = getUsagePercentage(data.tokens, 50000); // Daily limit
              const dayName = new Date(date).toLocaleDateString('en', { weekday: 'short' });

              return (
                <div key={date} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 w-24">
                    <span className="text-sm font-medium">{dayName}</span>
                    <span className="text-xs text-gray-600">
                      {data.tokens.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex-1 mx-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          dayPercentage > 80 ? 'bg-red-500' : dayPercentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${dayPercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="text-right w-16">
                    <div className="text-sm font-medium">${data.cost.toFixed(2)}</div>
                    <div className="text-xs text-gray-600">{dayPercentage.toFixed(0)}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Usage Warnings */}
        {totalUsagePercentage > 80 && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-yellow-600" />
              <span className="font-medium text-yellow-800">Usage Alert</span>
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              You've used {totalUsagePercentage.toFixed(1)}% of your daily AI token limit.
              Consider upgrading your plan or optimizing your usage.
            </p>
          </div>
        )}

        {/* Cost Projection */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Monthly Cost Projection</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Current daily average:</span>
              <span className="font-medium ml-2">${analytics.totalCost.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-gray-600">Projected monthly:</span>
              <span className={`font-medium ml-2 ${getCostColor(analytics.totalCost * 30)}`}>
                ${(analytics.totalCost * 30).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};