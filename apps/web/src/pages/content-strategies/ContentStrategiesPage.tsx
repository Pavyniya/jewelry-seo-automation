import React, { useState } from 'react';
import PersonalizationDashboard from '../../components/content-strategies/PersonalizationDashboard';
import BehaviorAnalytics from '../../components/content-strategies/BehaviorAnalytics';
import TrendAnalysisComponent from '../../components/content-strategies/TrendAnalysis';
import ABTestingDashboard from '../../components/content-strategies/ABTestingDashboard';
import JourneyOptimizer from '../../components/content-strategies/JourneyOptimizer';

const ContentStrategiesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('personalization');

  const tabs = [
    { id: 'personalization', name: 'Personalization', component: PersonalizationDashboard },
    { id: 'behavior', name: 'Behavior Analytics', component: BehaviorAnalytics },
    { id: 'trends', name: 'Trend Analysis', component: TrendAnalysisComponent },
    { id: 'abtesting', name: 'A/B Testing', component: ABTestingDashboard },
    { id: 'journey', name: 'Journey Optimizer', component: JourneyOptimizer }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || PersonalizationDashboard;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Content Strategies</h1>
          <p className="text-gray-600 mt-2">
            Advanced content personalization and optimization strategies for your jewelry store
          </p>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            <ActiveComponent />
          </div>
        </div>
      </div>
    </div>
  );
};

export { ContentStrategiesPage };
export default ContentStrategiesPage;