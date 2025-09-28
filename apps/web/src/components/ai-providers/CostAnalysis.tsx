import React from 'react';
import { CostOptimization } from '@jewelry-seo/shared/types/aiProvider';

interface CostAnalysisProps {
  costData: CostOptimization | null;
}

export const CostAnalysisComponent: React.FC<CostAnalysisProps> = ({ costData }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatSavings = (amount: number) => {
    if (amount === 0) return 'No savings';
    return amount > 0 ? `Save ${formatCurrency(amount)}` : `Loss ${formatCurrency(Math.abs(amount))}`;
  };

  const getSavingsColor = (amount: number) => {
    if (amount > 0) return 'text-green-600';
    if (amount < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getStrategyLabel = (strategy: string) => {
    switch (strategy) {
      case 'cost_first':
        return 'Cost First';
      case 'performance_first':
        return 'Performance First';
      case 'balanced':
        return 'Balanced';
      case 'specialized':
        return 'Specialized';
      default:
        return strategy;
    }
  };

  if (!costData) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Cost Analysis</h2>
          <p className="text-sm text-gray-600 mt-1">Optimization insights and cost tracking</p>
        </div>
        <div className="p-6">
          <div className="text-center py-8">
            <p className="text-gray-500">No cost data available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Cost Analysis</h2>
        <p className="text-sm text-gray-600 mt-1">
          Strategy: {getStrategyLabel(costData.strategy)} •
          Last optimized: {new Date(costData.lastOptimized).toLocaleString()}
        </p>
      </div>

      <div className="p-6">
        {/* Savings Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Current Savings</p>
                <p className="text-2xl font-bold text-green-800">
                  {formatSavings(costData.currentSavings)}
                </p>
              </div>
              <div className="text-green-500">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Potential Savings</p>
                <p className="text-2xl font-bold text-blue-800">
                  {formatSavings(costData.potentialSavings)}
                </p>
              </div>
              <div className="text-blue-500">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {costData.providerRecommendations.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Optimization Recommendations</h3>
            <div className="space-y-3">
              {costData.providerRecommendations.map((recommendation, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{recommendation.provider}</h4>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      recommendation.confidence > 0.8 ? 'bg-green-100 text-green-800' :
                      recommendation.confidence > 0.6 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {Math.round(recommendation.confidence * 100)}% confidence
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{recommendation.reasoning}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-500">
                        For: {recommendation.recommendedFor.join(', ')}
                      </span>
                      <span className={`text-sm font-medium ${getSavingsColor(recommendation.expectedSavings)}`}>
                        {formatSavings(recommendation.expectedSavings)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Usage Patterns */}
        {costData.usagePatterns.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage Patterns</h3>
            <div className="space-y-3">
              {costData.usagePatterns.map((pattern, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 capitalize">
                      {pattern.contentType.replace('_', ' ')}
                    </h4>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-600">
                        {pattern.averageTokens.toFixed(0)} tokens avg
                      </span>
                      <span className={`text-sm font-medium ${
                        pattern.successRate > 90 ? 'text-green-600' :
                        pattern.successRate > 70 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {pattern.successRate.toFixed(1)}% success
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">Preferred providers:</span>
                      {pattern.preferredProviders.map((provider, idx) => (
                        <span key={idx} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                          {provider}
                        </span>
                      ))}
                    </div>
                    <span className={`text-sm font-medium ${
                      pattern.costEfficiency > 0.8 ? 'text-green-600' :
                      pattern.costEfficiency > 0.6 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {Math.round(pattern.costEfficiency * 100)}% efficient
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {costData.providerRecommendations.length === 0 && costData.usagePatterns.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No optimization recommendations available</p>
            <p className="text-sm text-gray-400 mt-2">System is operating optimally</p>
          </div>
        )}
      </div>
    </div>
  );
};

export { CostAnalysisComponent as CostAnalysis };