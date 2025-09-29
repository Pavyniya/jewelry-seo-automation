
import React from 'react';
import { RulePerformance as RulePerformanceType } from 'packages/shared/src/types/automation';

interface RulePerformanceProps {
  performance: RulePerformanceType[];
}

const RulePerformance: React.FC<RulePerformanceProps> = ({ performance }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Rule Performance</h2>
      <ul>
        {performance?.map((p, i) => (
          <li key={i} className="py-2 border-b">
            <p>Executions: {p.executions}</p>
            <p>Successes: {p.successes}</p>
            <p>Failures: {p.failures}</p>
            <p>Average Improvement: {p.averageImprovement}%</p>
            <p>ROI: {p.roi}x</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export { RulePerformance };
export default RulePerformance;
