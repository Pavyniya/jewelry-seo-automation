
import React from 'react';
import { SeoMetrics } from 'packages/shared/src/types/analytics';

interface KeywordTrackerProps {
  keywords: SeoMetrics[];
}

const KeywordTracker: React.FC<KeywordTrackerProps> = ({ keywords }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Keyword Tracker</h2>
      <ul>
        {keywords.map(keyword => (
          <li key={keyword.id} className="flex justify-between items-center py-2 border-b">
            <span>{keyword.keyword}</span>
            <span className="font-bold">{keyword.position}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default KeywordTracker;
