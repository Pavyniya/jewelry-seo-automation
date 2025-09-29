import React, { useState, useEffect } from 'react';
import {
  CustomerBehavior,
  BehaviorPattern,
  InteractionType
} from '@jewelry-seo/shared/types/contentStrategy';
import { behaviorAnalytics } from '../../services/contentStrategiesService';

const BehaviorAnalytics: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [behaviorData, setBehaviorData] = useState<CustomerBehavior | null>(null);
  const [patterns, setPatterns] = useState<BehaviorPattern[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('7d');
  const [selectedCategory] = useState<string>('all');

  const fetchBehaviorData = async () => {
    setLoading(true);
    try {
      const [behaviorResponse, patternsResponse] = await Promise.all([
        behaviorAnalytics.getCustomerBehavior(),
        behaviorAnalytics.getBehaviorPatterns(selectedTimeframe)
      ]);

      setBehaviorData(behaviorResponse.data);
      setPatterns(patternsResponse.data);
    } catch (error) {
      console.error('Error fetching behavior data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBehaviorData();
  }, [selectedTimeframe, selectedCategory, fetchBehaviorData]);

  const getInteractionIcon = (type: InteractionType): string => {
    const icons: Record<InteractionType, string> = {
      'view': '👁️',
      'click': '🖱️',
      'add_to_cart': '🛒',
      'purchase': '💳',
      'search': '🔍',
      'filter': '🔽',
      'compare': '⚖️',
      'wishlist': '❤️'
    };
    return icons[type] || '📄';
  };

  const getPatternColor = (pattern: BehaviorPattern): string => {
    if (pattern.confidence > 0.8) return 'bg-green-100 text-green-800';
    if (pattern.confidence > 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Behavior Analytics</h2>
        <div className="flex gap-4">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <button
            onClick={fetchBehaviorData}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {behaviorData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-2xl font-bold text-blue-600">{behaviorData.totalInteractions || 0}</div>
              <div className="text-sm text-gray-500">Total Interactions</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-2xl font-bold text-green-600">{behaviorData.uniqueCustomers || 0}</div>
              <div className="text-sm text-gray-500">Unique Customers</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-2xl font-bold text-purple-600">
                {behaviorData.averageSessionDuration ? (behaviorData.averageSessionDuration / 60).toFixed(1) + 'm' : '0m'}
              </div>
              <div className="text-sm text-gray-500">Avg Session Duration</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-2xl font-bold text-orange-600">
                {behaviorData.conversionRate ? (behaviorData.conversionRate * 100).toFixed(1) + '%' : '0%'}
              </div>
              <div className="text-sm text-gray-500">Conversion Rate</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Interaction Distribution</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {behaviorData.interactionDistribution && Object.entries(behaviorData.interactionDistribution).map(([type, count]) => (
                <div key={type} className="text-center p-4 border rounded-lg">
                  <div className="text-2xl mb-2">{getInteractionIcon(type as InteractionType)}</div>
                  <div className="font-medium">{count}</div>
                  <div className="text-sm text-gray-500">{type.replace('_', ' ')}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Behavior Patterns</h3>
        <div className="space-y-4">
          {patterns.map((pattern, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium">{pattern.name}</h4>
                <span className={`px-2 py-1 text-xs rounded-full ${getPatternColor(pattern)}`}>
                  {(pattern.confidence * 100).toFixed(1)}% confidence
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3">{pattern.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Common Actions</h5>
                  <div className="flex flex-wrap gap-2">
                    {pattern.actions.map((action, actionIndex) => (
                      <span key={actionIndex} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                        {getInteractionIcon(action)} {action}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Customer Segments</h5>
                  <div className="flex flex-wrap gap-2">
                    {pattern.segments.map((segment, segmentIndex) => (
                      <span key={segmentIndex} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                        {segment}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  Frequency: {pattern.frequency} times
                </span>
                <span className="text-sm text-gray-500">
                  Impact: {pattern.impact.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BehaviorAnalytics;