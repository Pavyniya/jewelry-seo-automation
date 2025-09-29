
import React, { useState } from 'react';
import { OptimizationRule } from 'packages/shared/src/types/automation';

interface RuleBuilderProps {
  onSave: (rule: OptimizationRule) => void;
  templates: OptimizationRule[];
}

const RuleBuilder: React.FC<RuleBuilderProps> = ({ onSave, templates }) => {
  const [rule, setRule] = useState<Partial<OptimizationRule>>({});

  const handleSave = () => {
    // Basic validation
    if (rule.name && rule.conditions && rule.actions) {
      onSave(rule as OptimizationRule);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Rule Builder</h2>
      {/* This would be a complex UI for building rules, for now it's a placeholder */}
      <input 
        type="text" 
        placeholder="Rule Name"
        className="w-full p-2 border border-gray-300 rounded-md mb-4"
        onChange={(e) => setRule({ ...rule, name: e.target.value })}
      />
      <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
        Save Rule
      </button>
    </div>
  );
};

export { RuleBuilder };
export default RuleBuilder;
