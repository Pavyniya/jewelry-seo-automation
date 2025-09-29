
import React from 'react';
import { SeoMetrics } from 'packages/shared/src/types/analytics';

interface SeoDashboardProps {
  metrics: SeoMetrics[];
}

const SeoDashboard: React.FC<SeoDashboardProps> = ({ metrics }) => {
  const totalClicks = metrics.reduce((acc, metric) => acc + metric.clicks, 0);
  const averagePosition = metrics.reduce((acc, metric) => acc + metric.position, 0) / metrics.length;

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">SEO Dashboard</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-gray-600">Total Clicks</p>
          <p className="text-2xl font-bold">{totalClicks}</p>
        </div>
        <div>
          <p className="text-gray-600">Average Position</p>
          <p className="text-2xl font-bold">{averagePosition.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
};

export default SeoDashboard;
