
import React from 'react';
import { CompetitorAnalysis as CompetitorAnalysisType } from 'packages/shared/src/types/analytics';

interface CompetitorAnalysisProps {
  competitors: CompetitorAnalysisType[];
}

const CompetitorAnalysis: React.FC<CompetitorAnalysisProps> = ({ competitors = [] }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Competitor Analysis</h2>
      <ul>
        {competitors.map(competitor => (
          <li key={competitor.id} className="py-2 border-b">
            <p className="font-bold">{competitor.competitorDomain}</p>
            <p>Market Share: {competitor.marketShare * 100}%</p>
            <p>Position: {competitor.competitorPosition}</p>
            <p>Price Comparison: {competitor.priceComparison > 1 ? 'More Expensive' : 'Less Expensive'}</p>
            <p>Content Gap: {competitor.contentGap.join(', ')}</p>
          </li>
        ))}
      </ul>
      {competitors.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No competitor data available. Competitor analysis will appear here when data is collected.</p>
        </div>
      )}
    </div>
  );
};

export default CompetitorAnalysis;
