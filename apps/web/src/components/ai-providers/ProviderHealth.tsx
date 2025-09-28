import React from 'react';
import { ProviderHealth } from '@jewelry-seo/shared/types/aiProvider';

interface ProviderHealthProps {
  providers: ProviderHealth[];
}

export const ProviderHealthComponent: React.FC<ProviderHealthProps> = ({ providers }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'down':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'maintenance':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return '✓';
      case 'degraded':
        return '⚠';
      case 'down':
        return '✗';
      case 'maintenance':
        return '🔧';
      default:
        return '?';
    }
  };

  const getCircuitStateColor = (state: string) => {
    switch (state) {
      case 'closed':
        return 'bg-green-500';
      case 'open':
        return 'bg-red-500';
      case 'half-open':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatResponseTime = (time: number) => {
    if (time < 1000) {
      return `${Math.round(time)}ms`;
    }
    return `${(time / 1000).toFixed(1)}s`;
  };

  const formatLastChecked = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) {
      return 'Just now';
    } else if (minutes < 60) {
      return `${minutes}m ago`;
    } else {
      const hours = Math.floor(minutes / 60);
      return `${hours}h ago`;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Provider Health Status</h2>
        <p className="text-sm text-gray-600 mt-1">Real-time health monitoring for all AI providers</p>
      </div>

      <div className="p-6">
        {providers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No provider data available</p>
          </div>
        ) : (
          <div className="space-y-4">
            {providers.map((provider) => (
              <div
                key={provider.id}
                className={`border rounded-lg p-4 transition-all duration-200 hover:shadow-md ${
                  provider.status === 'healthy' ? 'border-green-200' :
                  provider.status === 'degraded' ? 'border-yellow-200' :
                  provider.status === 'down' ? 'border-red-200' :
                  'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(provider.status)}`}>
                      <span className="mr-1">{getStatusIcon(provider.status)}</span>
                      {provider.status.charAt(0).toUpperCase() + provider.status.slice(1)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{provider.provider}</h3>
                      <p className="text-sm text-gray-600">ID: {provider.id}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Response Time</p>
                      <p className={`font-semibold ${
                        provider.responseTime < 500 ? 'text-green-600' :
                        provider.responseTime < 1000 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {formatResponseTime(provider.responseTime)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-gray-600">Success Rate</p>
                      <p className={`font-semibold ${
                        provider.successRate >= 95 ? 'text-green-600' :
                        provider.successRate >= 80 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {provider.successRate.toFixed(1)}%
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-gray-600">Error Rate</p>
                      <p className={`font-semibold ${
                        provider.errorRate <= 5 ? 'text-green-600' :
                        provider.errorRate <= 15 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {provider.errorRate.toFixed(1)}%
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Circuit</p>
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${getCircuitStateColor(provider.circuitState)}`}></div>
                          <span className="text-sm font-medium text-gray-700">
                            {provider.circuitState}
                          </span>
                        </div>
                      </div>

                      {provider.consecutiveFailures > 0 && (
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Failures</p>
                          <p className="font-semibold text-red-600">
                            {provider.consecutiveFailures}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
                  <span>Last checked: {formatLastChecked(provider.lastChecked)}</span>
                  {provider.status === 'degraded' && (
                    <span className="text-yellow-600">
                      Performance degraded - monitoring closely
                    </span>
                  )}
                  {provider.status === 'down' && (
                    <span className="text-red-600">
                      Service unavailable - automatic failover activated
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export { ProviderHealthComponent as ProviderHealth };