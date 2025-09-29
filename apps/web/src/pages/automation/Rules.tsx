
import React from 'react';
import useAutomationStore from '../../stores/automationStore';
import RuleBuilder from '../../components/automation/RuleBuilder';
import RuleTemplates from '../../components/automation/RuleTemplates';
import RulePerformance from '../../components/automation/RulePerformance';
import ApprovalQueue from '../../components/automation/ApprovalQueue';
import RuleManagement from '../../components/automation/RuleManagement';

const AutomationRules: React.FC = () => {
  const {
    rules,
    templates,
    performance,
    pendingApprovals,
    createRule,
    executeRule,
    deleteRule,
    toggleRule
  } = useAutomationStore();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Automation Rules</h1>
        <button
          onClick={() => { /* Open rule builder */ }}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Create Rule
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RuleBuilder
            onSave={createRule}
            templates={templates}
          />
        </div>
        <div>
          <RuleTemplates templates={templates} onSelect={(template) => console.log(template)} />
          <RulePerformance performance={performance} />
        </div>
      </div>

      <RuleManagement rules={rules} onDelete={deleteRule} onToggle={toggleRule} />

      <ApprovalQueue
        approvals={pendingApprovals}
        onApprove={(id) => { /* Handle approval */ }}
        onReject={(id, reason) => { /* Handle rejection */ }}
      />
    </div>
  );
};

export default AutomationRules;
