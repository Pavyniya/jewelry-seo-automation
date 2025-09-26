import React from 'react';
import { useMonitoringStore } from '@/stores/monitoringStore';
import { SystemStatusComponent as SystemStatus } from '@/components/monitoring/SystemStatus';
import { UsageAnalyticsComponent as UsageAnalytics } from '@/components/monitoring/UsageAnalytics';
import { JobQueue } from '@/components/monitoring/JobQueue';
import { ActivityLog } from '@/components/monitoring/ActivityLog';
import { Button } from '@/components/ui/Button';
import { RefreshCw, Bell, Settings } from 'lucide-react';

export const AnalyticsDashboard: React.FC = () => {
  const {
    state: {
      systemMetrics,
      usageAnalytics,
      jobQueue,
      activityLog,
      systemStatus,
      loading,
      error,
      lastUpdated,
    },
    actions: {
      refreshData,
    },
  } = useMonitoringStore();

  const isRefreshing = loading && !!lastUpdated;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">System Monitoring</h1>
            <p className="text-gray-600 mt-1">
              Monitor system performance, AI usage, and activity logs
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-gray-600">Last Updated</div>
              <div className="text-sm font-medium">
                {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : 'Never'}
              </div>
            </div>

            <Button
              onClick={refreshData}
              disabled={isRefreshing}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </Button>

            <Button variant="outline" className="flex items-center space-x-2">
              <Bell className="w-4 h-4" />
              <span>Alerts</span>
            </Button>

            <Button variant="outline" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="text-red-800 font-medium">Error:</div>
              <div className="text-red-700">{error}</div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Row - System Status and Usage Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SystemStatus
            status={systemStatus || undefined}
            metrics={systemMetrics || undefined}
            loading={loading}
          />

          <UsageAnalytics
            analytics={usageAnalytics || undefined}
            loading={loading}
          />
        </div>

        {/* Middle Row - Job Queue */}
        <div className="grid grid-cols-1 gap-6">
          <JobQueue
            jobs={jobQueue}
            loading={loading}
          />
        </div>

        {/* Bottom Row - Activity Log */}
        <div className="grid grid-cols-1 gap-6">
          <ActivityLog
            events={activityLog}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};