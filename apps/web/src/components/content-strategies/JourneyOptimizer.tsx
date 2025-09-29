import React, { useState, useEffect } from 'react';
import {
  JourneyStage,
  JourneyPath,
  JourneyFunnel,
  JourneyStageContent
} from '@jewelry-seo/shared/types/contentStrategy';
import { journeyOptimizer } from '../../services/contentStrategiesService';

const JourneyOptimizer: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [journeys, setJourneys] = useState<JourneyPath[]>([]);
  const [funnel, setFunnel] = useState<JourneyFunnel | null>(null);
  const [stageContent, setStageContent] = useState<JourneyStageContent[]>([]);
  const [selectedJourney, setSelectedJourney] = useState<string>('');

  const fetchJourneyData = async () => {
    setLoading(true);
    try {
      const journeysResponse = await journeyOptimizer.getCustomerJourneys();
      setJourneys(journeysResponse.data || []);

      try {
        const funnelResponse = await journeyOptimizer.getJourneyFunnel();
        setFunnel(funnelResponse.data);
      } catch (funnelError) {
        console.warn('Could not fetch journey funnel:', funnelError);
        setFunnel(null);
      }

      try {
        const stageContentResponse = await journeyOptimizer.getJourneyStageContent();
        setStageContent(stageContentResponse.data || []);
      } catch (contentError) {
        console.warn('Could not fetch journey stage content:', contentError);
        setStageContent([]);
      }
    } catch (error) {
      console.error('Error fetching journey data:', error);
      setJourneys([]);
      setFunnel(null);
      setStageContent([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJourneyData();
  }, []);

  const getStageColor = (stage: JourneyStage): string => {
    const colors: Record<JourneyStage, string> = {
      'awareness': 'bg-blue-100 text-blue-800',
      'consideration': 'bg-purple-100 text-purple-800',
      'decision': 'bg-orange-100 text-orange-800',
      'purchase': 'bg-green-100 text-green-800',
      'retention': 'bg-indigo-100 text-indigo-800',
      'advocacy': 'bg-pink-100 text-pink-800'
    };
    return colors[stage] || 'bg-gray-100 text-gray-800';
  };

  const getStageIcon = (stage: JourneyStage): string => {
    const icons: Record<JourneyStage, string> = {
      'awareness': '👁️',
      'consideration': '🤔',
      'decision': '⚖️',
      'purchase': '💳',
      'retention': '💝',
      'advocacy': '📣'
    };
    return icons[stage] || '📍';
  };

  const getConversionRateColor = (rate: number): string => {
    if (rate > 0.7) return 'text-green-600';
    if (rate > 0.4) return 'text-yellow-600';
    return 'text-red-600';
  };

  const selectedJourneyData = journeys.find(j => j.id === selectedJourney);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Customer Journey Optimizer</h2>
        <button
          onClick={fetchJourneyData}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {funnel && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Journey Funnel Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {funnel.stages.map((stage, index) => (
              <div key={index} className="text-center">
                <div className={`p-4 rounded-lg ${getStageColor(stage.stage)}`}>
                  <div className="text-2xl mb-2">{getStageIcon(stage.stage)}</div>
                  <div className="font-medium">{stage.stage.replace('_', ' ')}</div>
                  <div className="text-2xl font-bold mt-2">{stage.count.toLocaleString()}</div>
                  <div className="text-sm opacity-75">
                    {stage.conversionRate > 0 && (
                      <span className={getConversionRateColor(stage.conversionRate)}>
                        {(stage.conversionRate * 100).toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
                {index < funnel.stages.length - 1 && (
                  <div className="text-center text-gray-400 mt-2">↓</div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <div className="text-lg font-semibold">
              Overall Conversion: <span className={getConversionRateColor(funnel.overallConversionRate)}>
                {(funnel.overallConversionRate * 100).toFixed(1)}%
              </span>
            </div>
            <div className="text-sm text-gray-500">
              Average Journey Duration: {(funnel.averageJourneyDuration / 3600).toFixed(1)} hours
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Customer Journeys</h3>
          <div className="space-y-4">
            {journeys.slice(0, 10).map((journey) => (
              <div
                key={journey.id}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedJourney === journey.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedJourney(journey.id)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-medium">Journey {journey.id.slice(-8)}</div>
                    <div className="text-sm text-gray-500">
                      {journey.customerId ? `Customer: ${journey.customerId}` : 'Anonymous'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">Score: {journey.score.toFixed(2)}</div>
                    <div className="text-xs text-gray-500">
                      {journey.progress.toFixed(0)}% complete
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 mb-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStageColor(journey.currentStage)}`}>
                    {getStageIcon(journey.currentStage)} {journey.currentStage.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-gray-500">
                    Started: {new Date(journey.startedAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="text-xs text-gray-600">
                  {journey.touchpoints.length} touchpoints • {journey.stageTransitions.length} transitions
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">
            {selectedJourneyData ? 'Journey Details' : 'Stage Content Strategy'}
          </h3>

          {selectedJourneyData ? (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Touchpoints</h4>
                <div className="space-y-2">
                  {selectedJourneyData.touchpoints.map((touchpoint, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <span className="text-gray-500">{index + 1}.</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStageColor(touchpoint.stage)}`}>
                        {getStageIcon(touchpoint.stage)}
                      </span>
                      <span>{touchpoint.type}</span>
                      <span className="text-gray-500">•</span>
                      <span>{new Date(touchpoint.timestamp).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Stage Transitions</h4>
                <div className="space-y-2">
                  {selectedJourneyData.stageTransitions.map((transition, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStageColor(transition.fromStage)}`}>
                        {transition.fromStage.replace('_', ' ')}
                      </span>
                      <span className="text-gray-500">→</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStageColor(transition.toStage)}`}>
                        {transition.toStage.replace('_', ' ')}
                      </span>
                      <span className="text-gray-500">
                        ({(transition.probability * 100).toFixed(1)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {stageContent.map((content, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-lg">{getStageIcon(content.stage)}</span>
                    <h4 className="font-medium">{content.stage.replace('_', ' ')}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStageColor(content.stage)}`}>
                      {(content.effectiveness * 100).toFixed(0)}% effective
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-3">{content.description}</p>

                  <div className="space-y-2">
                    <div>
                      <h5 className="text-xs font-medium text-gray-700 mb-1">Key Messages</h5>
                      <ul className="text-xs space-y-1">
                        {content.keyMessages.map((message, msgIndex) => (
                          <li key={msgIndex} className="flex items-start space-x-1">
                            <span className="text-green-500 mt-0.5">•</span>
                            <span>{message}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h5 className="text-xs font-medium text-gray-700 mb-1">Content Types</h5>
                      <div className="flex flex-wrap gap-1">
                        {content.contentTypes.map((type, typeIndex) => (
                          <span key={typeIndex} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h5 className="text-xs font-medium text-gray-700 mb-1">Recommended Actions</h5>
                      <ul className="text-xs space-y-1">
                        {content.recommendedActions.map((action, actionIndex) => (
                          <li key={actionIndex} className="flex items-start space-x-1">
                            <span className="text-blue-500 mt-0.5">→</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JourneyOptimizer;