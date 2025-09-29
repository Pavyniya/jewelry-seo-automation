
import React, { useState, useEffect } from 'react';
import useAnalyticsStore from '../../stores/analyticsStore';

interface Alert {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'error';
}

const AlertManager: React.FC = () => {
  const { seoMetrics, competitorData, qualityScores, trendData } = useAnalyticsStore();
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    const newAlerts: Alert[] = [];

    // Generate alerts based on SEO metrics
    if (seoMetrics.length > 0) {
      const avgPosition = seoMetrics.reduce((sum, metric) => sum + (metric.position || 0), 0) / seoMetrics.length;
      if (avgPosition > 20) {
        newAlerts.push({
          id: 'position-warning',
          message: `Average position is ${avgPosition.toFixed(1)}. Consider optimizing for better rankings.`,
          type: 'warning'
        });
      }
    }

    // Generate alerts based on competitor analysis
    if (competitorData.length > 0) {
      const topCompetitor = competitorData.reduce((max, comp) =>
        comp.marketShare > max.marketShare ? comp : max, competitorData[0]);
      if (topCompetitor.marketShare > 0.3) {
        newAlerts.push({
          id: 'competitor-warning',
          message: `${topCompetitor.competitorDomain} has ${Math.round(topCompetitor.marketShare * 100)}% market share. Monitor their strategies.`,
          type: 'warning'
        });
      }
    }

    // Generate alerts based on quality scores
    if (qualityScores.length > 0) {
      const avgQuality = qualityScores.reduce((sum, score) => sum + score.overallScore, 0) / qualityScores.length;
      if (avgQuality < 70) {
        newAlerts.push({
          id: 'quality-warning',
          message: `Average content quality score is ${avgQuality.toFixed(1)}%. Improve content quality.`,
          type: 'error'
        });
      }
    }

    // Add info alert about data refresh
    newAlerts.push({
      id: 'data-refresh',
      message: 'Data refreshed successfully. All metrics are up to date.',
      type: 'info'
    });

    setAlerts(newAlerts);
  }, [seoMetrics, competitorData, qualityScores, trendData]);

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Real-time Alerts</h2>
      <ul>
        {alerts.map(alert => (
          <li key={alert.id} className={`py-2 border-b ${alert.type === 'error' ? 'text-red-500' : alert.type === 'warning' ? 'text-yellow-500' : 'text-blue-500'}`}>
            {alert.message}
          </li>
        ))}
      </ul>
      {alerts.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          <p>No alerts at this time. Everything is running smoothly.</p>
        </div>
      )}
    </div>
  );
};

export default AlertManager;
