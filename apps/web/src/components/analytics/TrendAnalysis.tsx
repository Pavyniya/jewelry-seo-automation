
import React from 'react';
import { TrendAnalysis as TrendAnalysisType } from 'packages/shared/src/types/analytics';

interface TrendAnalysisProps {
  trends: TrendAnalysisType[];
}

const TrendAnalysis: React.FC<TrendAnalysisProps> = ({ trends = [] }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Trend Analysis</h2>
      <ul>
        {trends.map(trend => (
          <li key={trend.id} className="py-2 border-b">
            <p className="font-bold">{trend.metric}</p>
            <p>Trend: {trend.trend} ({trend.changePercentage}%)</p>
            <div className="w-full h-40 bg-gray-100 mt-2">
              <svg width="100%" height="100%">
                <polyline
                  fill="none"
                  stroke="#4F46E5"
                  strokeWidth="2"
                  points="0,150 50,120 100,130 150,100 200,110 250,90 300,80"
                />
              </svg>
            </div>
          </li>
        ))}
      </ul>
      {trends.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No trend data available. Trend analysis will appear here when data is collected.</p>
        </div>
      )}
    </div>
  );
};

export default TrendAnalysis;
