import React, { useState, useEffect } from 'react';
import {
  TrendAnalysis,
  SeasonalTrend,
  TrendCategory
} from '@jewelry-seo/shared/types/contentStrategy';
import { trendAnalysis } from '../../services/contentStrategiesService';

const TrendAnalysisComponent: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [currentTrends, setCurrentTrends] = useState<TrendAnalysis[]>([]);
  const [seasonalTrends, setSeasonalTrends] = useState<SeasonalTrend[]>([]);
  const [forecast, setForecast] = useState<TrendAnalysis[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTimeframe] = useState<string>('current');

  const fetchTrendData = async () => {
    setLoading(true);
    try {
      const [currentResponse, seasonalResponse, forecastResponse] = await Promise.all([
        trendAnalysis.getCurrentTrends(selectedCategory === 'all' ? undefined : selectedCategory),
        trendAnalysis.getSeasonalTrends(),
        trendAnalysis.getTrendForecast('30d')
      ]);

      setCurrentTrends(currentResponse.data);
      setSeasonalTrends(seasonalResponse.data);
      setForecast(forecastResponse.data);
    } catch (error) {
      console.error('Error fetching trend data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrendData();
  }, [selectedCategory, selectedTimeframe, fetchTrendData]);

  const getTrendIcon = (category: TrendCategory): string => {
    const icons: Record<TrendCategory, string> = {
      'style': '👗',
      'material': '💎',
      'color': '🎨',
      'occasion': '🎉',
      'price_point': '💰',
      'brand': '🏷️',
      'seasonal': '🌸',
      'geographic': '🌍'
    };
    return icons[category] || '📊';
  };

  const getTrendColor = (trend: TrendAnalysis): string => {
    if (trend.growthRate > 0.5) return 'bg-green-100 text-green-800';
    if (trend.growthRate > 0.2) return 'bg-yellow-100 text-yellow-800';
    if (trend.growthRate > -0.2) return 'bg-gray-100 text-gray-800';
    return 'bg-red-100 text-red-800';
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence > 0.8) return 'bg-green-500';
    if (confidence > 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Trend Analysis</h2>
        <div className="flex gap-4">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="all">All Categories</option>
            <option value="style">Style</option>
            <option value="material">Material</option>
            <option value="color">Color</option>
            <option value="occasion">Occasion</option>
            <option value="price_point">Price Point</option>
          </select>
          <button
            onClick={fetchTrendData}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Current Trends</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentTrends && currentTrends.map((trend, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{getTrendIcon(trend.category)}</span>
                  <h4 className="font-medium">{trend.name}</h4>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${getTrendColor(trend)}`}>
                  {(trend.growthRate * 100).toFixed(1)}%
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-3">{trend.description}</p>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Search Volume:</span>
                  <span>{trend.searchVolume ? trend.searchVolume.toLocaleString() : 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Competition:</span>
                  <span>{trend.competition !== undefined ? trend.competition.toFixed(2) : 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Confidence:</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getConfidenceColor(trend.confidence || 0)}`}
                        style={{ width: `${(trend.confidence || 0) * 100}%` }}
                      ></div>
                    </div>
                    <span>{trend.confidence !== undefined ? (trend.confidence * 100).toFixed(0) + '%' : 'N/A'}</span>
                  </div>
                </div>
              </div>

              {trend.keywords && trend.keywords.length > 0 && (
              <div className="mt-3">
                <h5 className="text-xs font-medium text-gray-700 mb-1">Keywords</h5>
                <div className="flex flex-wrap gap-1">
                  {trend.keywords.slice(0, 3).map((keyword, keywordIndex) => (
                    <span key={keywordIndex} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                      {keyword}
                    </span>
                  ))}
                  {trend.keywords.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                      +{trend.keywords.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Seasonal Trends</h3>
          <div className="space-y-4">
            {seasonalTrends && seasonalTrends.map((trend, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium">{trend.season}</h4>
                  <span className="text-sm text-gray-500">{trend.year}</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{trend.description}</p>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-xs font-medium text-gray-700 mb-2">Trending Items</h5>
                    <ul className="text-sm space-y-1">
                      {trend.trendingItems && trend.trendingItems.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex items-center space-x-2">
                          <span className="text-green-500">↗</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-xs font-medium text-gray-700 mb-2">Peak Period</h5>
                    <p className="text-sm text-gray-600">
                      {trend.peakStart} to {trend.peakEnd}
                    </p>
                    <div className="mt-2">
                      <div className="text-xs text-gray-500">Expected Growth</div>
                      <div className="font-medium text-green-600">
                        {(trend.expectedGrowth * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Trend Forecast</h3>
          <div className="space-y-4">
            {forecast && forecast.map((trend, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium">{trend.name}</h4>
                  <span className="text-xs text-gray-500">
                    {new Date(trend.predictedPeak).toLocaleDateString()}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Predicted Growth:</span>
                    <span className="font-medium text-green-600">
                      {(trend.growthRate * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Confidence:</span>
                    <span>{(trend.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>

                <div className="mt-3">
                  <h5 className="text-xs font-medium text-gray-700 mb-1">Recommended Actions</h5>
                  <ul className="text-xs space-y-1">
                    <li>• Create content around {trend.name.toLowerCase()}</li>
                    <li>• Optimize product listings for related keywords</li>
                    <li>• Plan inventory for peak demand period</li>
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrendAnalysisComponent;