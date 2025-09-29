
import React from 'react';

interface ContentGapProps {
  contentGap: string[];
}

const ContentGap: React.FC<ContentGapProps> = ({ contentGap }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Content Gap Analysis</h2>
      <ul>
        {contentGap.map((gap, index) => (
          <li key={index} className="py-2 border-b">
            {gap}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ContentGap;
