
import React, { useEffect } from 'react';
import useAnalyticsStore from '../../stores/analyticsStore';
import SeoDashboard from '../../components/analytics/SeoDashboard';
import KeywordTracking from '../../components/analytics/KeywordTracking';
import CompetitorAnalysis from '../../components/analytics/CompetitorAnalysis';
import TrendAnalysis from '../../components/analytics/TrendAnalysis';
import ContentGap from '../../components/analytics/ContentGap';
import QualityScoring from '../../components/analytics/QualityScoring';
import ReportBuilder from '../../components/analytics/ReportBuilder';
import AdvancedFilters from '../../components/analytics/AdvancedFilters';
import AlertManager from '../../components/analytics/AlertManager';

const SeoAnalytics: React.FC = () => {
  const {
    seoMetrics,
    competitorData,
    trendData,
    contentGapData,
    qualityScores,
    keywords,
    loading,
    refreshData
  } = useAnalyticsStore();

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">SEO Analytics & Insights</h1>
        <button
          onClick={refreshData}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Refresh Data
        </button>
      </div>

      <AdvancedFilters />
      <SeoDashboard metrics={seoMetrics} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <KeywordTracking />
        <CompetitorAnalysis competitors={competitorData} />
      </div>

      <ContentGap contentGap={contentGapData} />
      <QualityScoring scores={qualityScores} />
      <TrendAnalysis trends={trendData} />
      <ReportBuilder />
      <AlertManager />
    </div>
  );
};

export default SeoAnalytics;
