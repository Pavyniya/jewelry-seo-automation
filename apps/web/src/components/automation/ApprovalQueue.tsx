
import React from 'react';

interface ApprovalQueueProps {
  approvals: any[];
  // eslint-disable-next-line no-unused-vars
  onApprove: (id: string) => void;
  // eslint-disable-next-line no-unused-vars
  onReject: (id: string, reason: string) => void;
}

const ApprovalQueue: React.FC<ApprovalQueueProps> = ({ approvals = [], onApprove, onReject }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Approval Queue</h2>
      <ul>
        {approvals.map(approval => (
          <li key={approval.id} className="py-2 border-b flex justify-between items-center">
            <span>{approval.description}</span>
            <div>
              <button onClick={() => onApprove(approval.id)} className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 mr-2">Approve</button>
              <button onClick={() => onReject(approval.id, 'No reason')} className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600">Reject</button>
            </div>
          </li>
        ))}
      </ul>
      {approvals.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No items pending approval</p>
        </div>
      )}
    </div>
  );
};

export { ApprovalQueue };
export default ApprovalQueue;
