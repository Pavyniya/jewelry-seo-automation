import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ActivityLogEntry } from '@jewelry-seo/shared/types/monitoring';
import { Search, Download, Clock, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

interface ActivityLogProps {
  events?: ActivityLogEntry[];
  loading?: boolean;
}

export const ActivityLog: React.FC<ActivityLogProps> = ({
  events = [],
  loading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');

  const activityTypes = useMemo(() => {
    const types = Array.from(new Set(events.map(e => e.type)));
    return types;
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const matchesSearch = event.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           event.productName?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = selectedType === 'all' || event.type === selectedType;
      const matchesSeverity = selectedSeverity === 'all' || event.severity === selectedSeverity;

      return matchesSearch && matchesType && matchesSeverity;
    });
  }, [events, searchTerm, selectedType, selectedSeverity]);

  const getSeverityColor = (severity: ActivityLogEntry['severity']) => {
    switch (severity) {
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'info':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: ActivityLogEntry['type']) => {
    switch (type) {
      case 'optimization':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'approval':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejection':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'system':
        return <Info className="w-4 h-4 text-gray-600" />;
      default:
        return <Info className="w-4 h-4 text-gray-600" />;
    }
  };

  const getSeverityIcon = (severity: ActivityLogEntry['severity']) => {
    switch (severity) {
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-600" />;
      default:
        return <Info className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  if (loading) {
    return (
      <Card title="Activity Log">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Activity Log">
      <div className="space-y-4">
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Types</option>
            {activityTypes.map(type => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>

          {/* Severity Filter */}
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Severities</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>

          {/* Export Button */}
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Results Summary */}
        <div className="text-sm text-gray-600">
          Showing {filteredEvents.length} of {events.length} events
        </div>

        {/* Activity List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No activity events found matching your filters
            </div>
          ) : (
            filteredEvents.map((event) => (
              <div key={event.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {getSeverityIcon(event.severity)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(event.type)}
                        <span className="font-medium text-sm">{event.type}</span>
                        {event.productName && (
                          <span className="text-gray-600">• {event.productName}</span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <Badge className={getSeverityColor(event.severity)}>
                          {event.severity}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(event.timestamp)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 text-sm text-gray-700">
                      {event.message}
                    </div>

                    {event.details && (
                      <details className="mt-2">
                        <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-800">
                          View details
                        </summary>
                        <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono overflow-x-auto">
                          <pre>{JSON.stringify(event.details, null, 2)}</pre>
                        </div>
                      </details>
                    )}

                    <div className="mt-2 text-xs text-gray-500">
                      {new Date(event.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Load More */}
        {filteredEvents.length > 0 && (
          <div className="text-center">
            <Button variant="outline" size="sm">
              Load More Events
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};