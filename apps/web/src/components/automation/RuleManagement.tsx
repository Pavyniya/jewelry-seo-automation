
import React from 'react';
import { OptimizationRule } from 'packages/shared/src/types/automation';

interface RuleManagementProps {
  rules: OptimizationRule[];
  // eslint-disable-next-line no-unused-vars
  onDelete: (ruleId: string) => void;
  // eslint-disable-next-line no-unused-vars
  onToggle: (ruleId: string) => void;
}

const RuleManagement: React.FC<RuleManagementProps> = ({ rules, onDelete, onToggle }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Rule Management</h2>
      <ul>
        {rules.map(rule => (
          <li key={rule.id} className="py-2 border-b flex justify-between items-center">
            <div>
              <p className="font-bold">{rule.name}</p>
              <p className="text-sm text-gray-600">{rule.description}</p>
            </div>
            <div>
              <button onClick={() => onToggle(rule.id)} className={`px-3 py-1 text-white rounded mr-2 ${rule.isActive ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-gray-500 hover:bg-gray-600'}`}>
                {rule.isActive ? 'Deactivate' : 'Activate'}
              </button>
              <button onClick={() => onDelete(rule.id)} className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600">Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RuleManagement;
