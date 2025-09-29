
import React from 'react';
import useAnalyticsStore from '../../stores/analyticsStore';

const ReportBuilder: React.FC = () => {
  const { seoMetrics, competitorData, qualityScores, trendData } = useAnalyticsStore();

  const handleExport = () => {
    const data = {
      seoMetrics,
      competitorData,
      qualityScores,
      trendData,
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'analytics-report.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Report Builder</h2>
      <button
        onClick={handleExport}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Export as JSON
      </button>
    </div>
  );
};

export default ReportBuilder;
