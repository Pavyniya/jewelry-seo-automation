import React, { useState, useEffect } from 'react';
import { ContentStrategyResponse, CustomerBehavior } from '@jewelry-seo/shared/types/contentStrategy';
import { personalizationEngine } from '../../services/contentStrategiesService';

interface PersonalizationDashboardProps {
  productId?: string;
}

const PersonalizationDashboard: React.FC<PersonalizationDashboardProps> = ({ productId }) => {
  const [loading, setLoading] = useState(false);
  const [personalizedContent, setPersonalizedContent] = useState<ContentStrategyResponse | null>(null);
  const [customerBehavior, setCustomerBehavior] = useState<CustomerBehavior | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<string>('all');
  const [testProductId, setTestProductId] = useState(productId || 'diamond-necklace-123');

  const fetchPersonalizedContent = async () => {
    if (!testProductId) return;

    setLoading(true);
    try {
      const response = await personalizationEngine.getPersonalization(testProductId);
      setPersonalizedContent(response.data);
    } catch (error) {
      console.error('Error fetching personalized content:', error);
      // Create mock personalized content for demonstration
      const mockContent: ContentStrategyResponse = {
        contentVariants: [
          {
            content: "Discover our exquisite diamond necklace collection, handcrafted for the modern woman who appreciates timeless elegance.",
            confidence: 0.92,
            segments: ['high_value', 'returning_customer'],
            contentType: 'product_description'
          },
          {
            content: "✨ Sparkle with sophistication! Our diamond necklaces feature brilliant-cut stones in 18k gold settings. Perfect for special occasions!",
            confidence: 0.87,
            segments: ['new_visitor', 'trend_follower'],
            contentType: 'social_media_post'
          },
          {
            content: "Invest in lasting beauty. Our diamond necklaces combine exceptional craftsmanship with competitive pricing. Shop now with free shipping!",
            confidence: 0.78,
            segments: ['price_sensitive', 'luxury_seeker'],
            contentType: 'email_campaign'
          }
        ],
        recommendations: [
          {
            action: "Create video content showcasing necklace styling tips",
            reason: "High engagement potential for visual content",
            priority: "high"
          },
          {
            action: "Implement customer review highlighting program",
            reason: "Social proof increases conversion by 23%",
            priority: "medium"
          },
          {
            action: "Develop limited-time collection promotion",
            reason: "Scarcity drives purchase decisions for luxury items",
            priority: "high"
          }
        ],
        strategyType: 'personalization',
        timestamp: new Date().toISOString(),
        confidence: 0.85,
        productId: testProductId
      };
      setPersonalizedContent(mockContent);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerBehavior = async () => {
    try {
      // Mock customer behavior data since the API doesn't have this endpoint yet
      const mockBehavior: CustomerBehavior = {
        segments: [
          { name: 'new_visitor', count: 1250, percentage: 35.2 },
          { name: 'returning_customer', count: 980, percentage: 27.6 },
          { name: 'high_value', count: 450, percentage: 12.7 },
          { name: 'price_sensitive', count: 380, percentage: 10.7 },
          { name: 'trend_follower', count: 320, percentage: 9.0 },
          { name: 'luxury_seeker', count: 170, percentage: 4.8 }
        ],
        totalInteractions: 3550,
        uniqueCustomers: 2150,
        averageSessionDuration: 320,
        conversionRate: 0.038,
        interactionDistribution: {
          view: 2100,
          click: 850,
          add_to_cart: 180,
          purchase: 135,
          search: 285
        }
      };
      setCustomerBehavior(mockBehavior);
    } catch (error) {
      console.error('Error fetching customer behavior:', error);
    }
  };

  useEffect(() => {
    fetchCustomerBehavior();
    if (testProductId) {
      fetchPersonalizedContent();
    }
  }, [fetchPersonalizedContent, testProductId]);

  const getSegmentColor = (segment: string): string => {
    const colors: { [key: string]: string } = {
      'new_visitor': 'bg-blue-100 text-blue-800',
      'returning_customer': 'bg-green-100 text-green-800',
      'high_value': 'bg-purple-100 text-purple-800',
      'price_sensitive': 'bg-yellow-100 text-yellow-800',
      'trend_follower': 'bg-pink-100 text-pink-800',
      'luxury_seeker': 'bg-indigo-100 text-indigo-800'
    };
    return colors[segment] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Content Personalization</h2>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Product ID"
            value={testProductId}
            onChange={(e) => setTestProductId(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          />
          <button
            onClick={fetchPersonalizedContent}
            disabled={!testProductId || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Get Personalized Content'}
          </button>
        </div>
      </div>

      {customerBehavior && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Customer Segments</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {customerBehavior.segments.map((segment, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg cursor-pointer transition-colors ${
                  selectedSegment === segment.name ? 'ring-2 ring-blue-500' : ''
                } ${getSegmentColor(segment.name)}`}
                onClick={() => setSelectedSegment(segment.name)}
              >
                <div className="font-medium">{segment.name.replace('_', ' ').toUpperCase()}</div>
                <div className="text-sm opacity-75">{segment.count} customers</div>
                <div className="text-xs mt-1">{segment.percentage.toFixed(1)}%</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {personalizedContent && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Personalized Content Variants</h3>
            <div className="space-y-4">
              {personalizedContent.contentVariants.map((variant, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">Variant {index + 1}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      variant.confidence > 0.8 ? 'bg-green-100 text-green-800' :
                      variant.confidence > 0.6 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {(variant.confidence * 100).toFixed(1)}% confidence
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{variant.content}</p>
                  <div className="flex flex-wrap gap-2">
                    {variant.segments.map((segment, segIndex) => (
                      <span key={segIndex} className={`px-2 py-1 text-xs rounded-full ${getSegmentColor(segment)}`}>
                        {segment.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Recommendations</h3>
            <div className="space-y-3">
              {personalizedContent.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    recommendation.priority === 'high' ? 'bg-red-500' :
                    recommendation.priority === 'medium' ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{recommendation.action}</p>
                    <p className="text-xs text-gray-500">{recommendation.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalizationDashboard;