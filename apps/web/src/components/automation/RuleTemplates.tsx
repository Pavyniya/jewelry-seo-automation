
import React from 'react';
import { OptimizationRule } from 'packages/shared/src/types/automation';

interface RuleTemplatesProps {
  templates: OptimizationRule[];
  // eslint-disable-next-line no-unused-vars
  onSelect: (template: OptimizationRule) => void;
  // eslint-disable-next-line no-unused-vars
  onCreateRuleFromTemplate: (templateId: string) => void;
}

const RuleTemplates: React.FC<RuleTemplatesProps> = ({ templates, onSelect, onCreateRuleFromTemplate }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Rule Templates</h2>
      <ul>
        {templates?.map(template => (
          <li key={template.id} className="py-2 border-b">
            <div className="flex justify-between items-start">
              <div>
                <button onClick={() => onSelect(template)} className="text-blue-600 hover:underline">
                  {template.name}
                </button>
                <p className="text-sm text-gray-600">{template.description}</p>
              </div>
              <button
                onClick={() => onCreateRuleFromTemplate(template.id)}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
              >
                Use Template
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export { RuleTemplates };
export default RuleTemplates;
