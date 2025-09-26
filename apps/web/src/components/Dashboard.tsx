import React from 'react';

interface DashboardProps {
  title?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ title = "Jewelry SEO Automation" }) => {
  return (
    <div className="dashboard">
      <h1>{title}</h1>
      <div className="dashboard-content">
        <div className="card">
          <h2>Project Status</h2>
          <p>✅ Monorepo structure configured</p>
          <p>✅ TypeScript setup complete</p>
          <p>✅ Environment configuration established</p>
          <p>✅ Git repository initialized</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;