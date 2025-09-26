import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { OptimizationJob } from '@jewelry-seo/shared/types/monitoring';
import { Play, Pause, RotateCcw, Trash2, Clock, CheckCircle, AlertCircle, Loader } from 'lucide-react';

interface JobQueueProps {
  jobs?: OptimizationJob[];
  loading?: boolean;
}

export const JobQueue: React.FC<JobQueueProps> = ({
  jobs = [],
  loading = false,
}) => {
  const [selectedJob, setSelectedJob] = useState<string | null>(null);

  const getStatusColor = (status: OptimizationJob['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: OptimizationJob['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'processing':
        return <Loader className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-gray-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatDuration = (startTime?: Date, endTime?: Date) => {
    if (!startTime) return '-';
    if (!endTime) {
      const duration = Date.now() - new Date(startTime).getTime();
      return `${Math.floor(duration / 1000)}s`;
    }
    const duration = new Date(endTime).getTime() - new Date(startTime).getTime();
    return `${Math.floor(duration / 1000)}s`;
  };

  const getJobStats = () => {
    const stats = {
      total: jobs.length,
      pending: jobs.filter(j => j.status === 'pending').length,
      processing: jobs.filter(j => j.status === 'processing').length,
      completed: jobs.filter(j => j.status === 'completed').length,
      failed: jobs.filter(j => j.status === 'failed').length,
    };
    return stats;
  };

  const stats = getJobStats();

  if (loading) {
    return (
      <Card title="Job Queue">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Job Queue">
      <div className="space-y-6">
        {/* Queue Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-gray-900">{stats.total}</div>
            <div className="text-xs text-gray-600">Total Jobs</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-blue-600">{stats.pending}</div>
            <div className="text-xs text-gray-600">Pending</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-lg font-bold text-blue-600">{stats.processing}</div>
            <div className="text-xs text-gray-600">Processing</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-lg font-bold text-green-600">{stats.completed}</div>
            <div className="text-xs text-gray-600">Completed</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-lg font-bold text-red-600">{stats.failed}</div>
            <div className="text-xs text-gray-600">Failed</div>
          </div>
        </div>

        {/* Queue Actions */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <Play className="w-4 h-4 mr-2" />
              Start Queue
            </Button>
            <Button variant="outline" size="sm">
              <Pause className="w-4 h-4 mr-2" />
              Pause Queue
            </Button>
            <Button variant="outline" size="sm">
              <RotateCcw className="w-4 h-4 mr-2" />
              Retry Failed
            </Button>
          </div>
          <Button variant="outline" size="sm">
            <Trash2 className="w-4 h-4 mr-2" />
            Clear Completed
          </Button>
        </div>

        {/* Job List */}
        <div className="space-y-3">
          {jobs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No jobs in queue
            </div>
          ) : (
            jobs.map((job) => (
              <div
                key={job.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedJob === job.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedJob(selectedJob === job.id ? null : job.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(job.status)}
                    <div>
                      <div className="font-medium text-sm">Product {job.productId}</div>
                      <div className="text-xs text-gray-600">
                        Started: {job.startedAt ? new Date(job.startedAt).toLocaleTimeString() : 'Not started'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {/* Progress Bar */}
                    <div className="w-24">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            job.status === 'completed' ? 'bg-green-500' :
                            job.status === 'processing' ? 'bg-blue-500' :
                            job.status === 'failed' ? 'bg-red-500' : 'bg-gray-400'
                          }`}
                          style={{ width: `${job.progress}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-center text-gray-600 mt-1">
                        {job.progress}%
                      </div>
                    </div>

                    <Badge className={getStatusColor(job.status)}>
                      {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                    </Badge>

                    <div className="text-right text-xs text-gray-600">
                      <div>{formatDuration(job.startedAt, job.completedAt)}</div>
                      {job.completedAt && (
                        <div className="text-green-600">Completed</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedJob === job.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Job ID:</span>
                        <span className="ml-2 text-gray-600">{job.id}</span>
                      </div>
                      <div>
                        <span className="font-medium">Product ID:</span>
                        <span className="ml-2 text-gray-600">{job.productId}</span>
                      </div>
                      <div>
                        <span className="font-medium">Started:</span>
                        <span className="ml-2 text-gray-600">
                          {job.startedAt ? new Date(job.startedAt).toLocaleString() : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Completed:</span>
                        <span className="ml-2 text-gray-600">
                          {job.completedAt ? new Date(job.completedAt).toLocaleString() : 'N/A'}
                        </span>
                      </div>
                    </div>

                    {job.errorMessage && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="font-medium text-red-800 text-sm">Error Message:</div>
                        <div className="text-red-700 text-sm mt-1">{job.errorMessage}</div>
                      </div>
                    )}

                    <div className="flex space-x-2 mt-4">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                      {job.status === 'failed' && (
                        <Button variant="outline" size="sm">
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Retry Job
                        </Button>
                      )}
                      <Button variant="outline" size="sm" className="text-red-600">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Queue Performance */}
        <div className="pt-4 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">Queue Performance</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="font-medium text-gray-900">Avg Processing Time</div>
              <div className="text-gray-600">2m 34s</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="font-medium text-gray-900">Success Rate</div>
              <div className="text-green-600">94.2%</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="font-medium text-gray-900">Queue Length</div>
              <div className="text-gray-600">{stats.pending} pending</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="font-medium text-gray-900">Throughput</div>
              <div className="text-gray-600">12.5 jobs/hr</div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};