import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { SystemStatus, SystemMetrics } from '@jewelry-seo/shared/types/monitoring';
import { Wifi, WifiOff, AlertTriangle, CheckCircle, Clock, Zap, Activity } from 'lucide-react';

interface SystemStatusProps {
  status?: SystemStatus;
  metrics?: SystemMetrics;
  loading?: boolean;
}

export const SystemStatusComponent: React.FC<SystemStatusProps> = ({
  status,
  metrics,
  loading = false,
}) => {
  const getStatusColor = (overall: SystemStatus['overall']) => {
    switch (overall) {
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'down':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (overall: SystemStatus['overall']) => {
    switch (overall) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'degraded':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'down':
        return <WifiOff className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getServiceIcon = (service: string, serviceStatus: string) => {
    if (serviceStatus === 'connected' || serviceStatus === 'online' || serviceStatus === 'available') {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    } else if (serviceStatus === 'error' || serviceStatus === 'offline' || serviceStatus === 'unavailable') {
      return <WifiOff className="w-4 h-4 text-red-600" />;
    } else {
      return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    }
  };

  if (loading) {
    return (
      <Card title="System Status">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Card>
    );
  }

  if (!status) {
    return (
      <Card title="System Status">
        <div className="text-center text-gray-500 py-8">
          No system status data available
        </div>
      </Card>
    );
  }

  return (
    <Card title="System Status">
      <div className="space-y-6">
        {/* Overall Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon(status.overall)}
            <div>
              <h3 className="text-lg font-semibold">Overall System Health</h3>
              <p className="text-sm text-gray-600">
                Last checked: {new Date(status.lastChecked).toLocaleTimeString()}
              </p>
            </div>
          </div>
          <Badge className={getStatusColor(status.overall)}>
            {status.overall.charAt(0).toUpperCase() + status.overall.slice(1)}
          </Badge>
        </div>

        {/* Service Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Core Services</h4>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Wifi className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium">Shopify API</span>
              </div>
              <div className="flex items-center space-x-2">
                {getServiceIcon('shopify', status.services.shopify)}
                <Badge className="text-xs bg-gray-100 text-gray-800">
                  {status.services.shopify}
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium">Database</span>
              </div>
              <div className="flex items-center space-x-2">
                {getServiceIcon('database', status.services.database)}
                <Badge className="text-xs bg-gray-100 text-gray-800">
                  {status.services.database}
                </Badge>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">AI Providers</h4>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium">Gemini</span>
              </div>
              <div className="flex items-center space-x-2">
                {getServiceIcon('gemini', status.services.aiProviders.gemini)}
                <Badge className="text-xs bg-gray-100 text-gray-800">
                  {status.services.aiProviders.gemini}
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium">Claude</span>
              </div>
              <div className="flex items-center space-x-2">
                {getServiceIcon('claude', status.services.aiProviders.claude)}
                <Badge className="text-xs bg-gray-100 text-gray-800">
                  {status.services.aiProviders.claude}
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium">GPT</span>
              </div>
              <div className="flex items-center space-x-2">
                {getServiceIcon('gpt', status.services.aiProviders.gpt)}
                <Badge className="text-xs bg-gray-100 text-gray-800">
                  {status.services.aiProviders.gpt}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        {metrics && (
          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-900 mb-3">Performance Metrics</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{metrics.uptime}%</div>
                <div className="text-sm text-blue-600">Uptime</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{metrics.responseTime}ms</div>
                <div className="text-sm text-green-600">Avg Response</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{metrics.errorRate}%</div>
                <div className="text-sm text-yellow-600">Error Rate</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{metrics.activeJobs}</div>
                <div className="text-sm text-purple-600">Active Jobs</div>
              </div>
            </div>
          </div>
        )}

        {/* Last Updated */}
        <div className="text-xs text-gray-500 text-center pt-2 border-t">
          Last updated: {metrics?.lastUpdated ? new Date(metrics.lastUpdated).toLocaleString() : 'Not available'}
        </div>
      </div>
    </Card>
  );
};