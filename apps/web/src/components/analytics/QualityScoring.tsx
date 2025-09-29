
import React from 'react';
import { ContentQualityScore } from 'packages/shared/src/types/analytics';
import { calculateOverallSeoScore } from '../../utils/seoCalculations';

interface QualityScoringProps {
  scores: ContentQualityScore[];
}

const QualityScoring: React.FC<QualityScoringProps> = ({ scores }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Content Quality Scoring</h2>
      <ul>
        {scores.map(score => (
          <li key={score.id} className="py-2 border-b">
            <p className="font-bold">Product ID: {score.productId}</p>
            <p>Overall Score: {calculateOverallSeoScore(score)}</p>
            <p>Recommendations: {score.recommendations.join(', ')}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default QualityScoring;
