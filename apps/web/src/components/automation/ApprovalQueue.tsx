import React, { useState } from 'react'
import { useAutomationStore } from '@/stores/automationStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import {
  ApprovalRequest,
  ActionType
} from '@jewelry-seo/shared/types/automation'
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Shield,
  User,
  Calendar,
  Eye,
  Search
} from 'lucide-react'

interface ApprovalQueueProps {
  approvals?: ApprovalRequest[]
  onApprove?: (id: string) => void
  onReject?: (id: string, reason: string) => void
  showFilters?: boolean
}

export const ApprovalQueue: React.FC<ApprovalQueueProps> = ({
  approvals: propApprovals,
  onApprove: propOnApprove,
  onReject: propOnReject,
  showFilters = true
}) => {
  const {
    approvals: storeApprovals,
    approveRequest,
    rejectRequest,
    loading
  } = useAutomationStore()

  const approvals = propApprovals || storeApprovals
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')

  const handleApprove = async (id: string) => {
    try {
      if (propOnApprove) {
        propOnApprove(id)
      } else {
        await approveRequest(id, 'admin')
      }
    } catch (error) {
      console.error('Error approving request:', error)
    }
  }

  const handleReject = async (id: string) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection')
      return
    }

    try {
      if (propOnReject) {
        propOnReject(id, rejectionReason)
      } else {
        await rejectRequest(id, 'admin', rejectionReason)
      }
      setRejectionReason('')
      setSelectedRequest(null)
    } catch (error) {
      console.error('Error rejecting request:', error)
    }
  }

  const filteredApprovals = approvals.filter(approval => {
    const matchesStatus = filterStatus === 'all' || approval.status === filterStatus
    const matchesSearch = searchTerm === '' ||
      approval.ruleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      approval.actionType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      approval.description.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesStatus && matchesSearch
  })

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getActionTypeLabel = (actionType: ActionType) => {
    switch (actionType) {
      case 'optimize_content':
        return 'Optimize Content'
      case 'update_pricing':
        return 'Update Pricing'
      case 'adjust_tags':
        return 'Adjust Tags'
      case 'send_alert':
        return 'Send Alert'
      case 'update_meta':
        return 'Update Meta Tags'
      case 'optimize_images':
        return 'Optimize Images'
      default:
        return (actionType as string).replace('_', ' ').toUpperCase()
    }
  }

  const pendingCount = approvals.filter(a => a.status === 'pending').length
  const highRiskCount = approvals.filter(a => a.riskLevel === 'high' && a.status === 'pending').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Approval Queue</h2>
          <p className="text-sm text-gray-600 mt-1">
            {pendingCount} pending {pendingCount === 1 ? 'request' : 'requests'}
            {highRiskCount > 0 && ` • ${highRiskCount} high risk`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <Badge className="bg-red-500 text-white animate-pulse">
              {pendingCount} pending
            </Badge>
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search requests..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
                  <Button
                    key={status}
                    variant={filterStatus === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus(status)}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                    {status === 'pending' && pendingCount > 0 && (
                      <Badge className="bg-gray-100 text-gray-800 ml-1 text-xs">
                        {pendingCount}
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approval Requests */}
      {loading ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading approval requests...</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredApprovals.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {filterStatus === 'pending' ? 'No Pending Approvals' : 'No Approval Requests Found'}
                  </h3>
                  <p className="text-gray-600">
                    {filterStatus === 'pending'
                      ? 'All automated actions have been approved'
                      : 'No requests match your current filters'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredApprovals.map((request) => (
              <Card key={request.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* Main Content */}
                    <div className="md:col-span-8">
                      <div className="flex items-start gap-3 mb-3">
                        {getStatusIcon(request.status)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">{request.ruleName}</h3>
                            <Badge className={getStatusColor(request.status)}>
                              {request.status}
                            </Badge>
                            <Badge className={getRiskColor(request.riskLevel)}>
                              {request.riskLevel} risk
                            </Badge>
                          </div>
                          <p className="text-gray-600 mb-3">{request.description}</p>

                          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <span className="font-medium">Action:</span>
                              <Badge className="border border-gray-300 text-gray-700">{getActionTypeLabel(request.actionType)}</Badge>
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              <span>{request.requestedBy}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(request.requestedAt).toLocaleDateString()}</span>
                            </div>
                            {request.estimatedImpact && (
                              <div className="flex items-center gap-1">
                                <span className="font-medium">Impact:</span>
                                <span>{request.estimatedImpact}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="md:col-span-4 flex flex-col justify-between">
                      <div className="mb-3">
                        <div className="text-sm text-gray-600 mb-1">Estimated Impact</div>
                        <div className="font-medium">{request.estimatedImpact || 'Not specified'}</div>
                      </div>

                      <div className="flex gap-2">
                        {request.status === 'pending' && (
                          <>
                            <Button
                              onClick={() => handleApprove(request.id)}
                              className="flex-1"
                              size="sm"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setSelectedRequest(request)}
                              size="sm"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Review
                            </Button>
                          </>
                        )}
                        {request.status !== 'pending' && (
                          <Button
                            variant="outline"
                            onClick={() => setSelectedRequest(request)}
                            size="sm"
                            className="flex-1"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View Details
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status Details */}
                  {request.status !== 'pending' && (
                    <div className="mt-4 pt-4 border-t text-sm text-gray-600">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="font-medium">Reviewed by:</span> {request.reviewedBy || 'Unknown'}
                        </div>
                        <div>
                          <span className="font-medium">Reviewed at:</span> {request.reviewedAt ? new Date(request.reviewedAt).toLocaleDateString() : 'Unknown'}
                        </div>
                        {request.rejectionReason && (
                          <div className="md:col-span-2">
                            <span className="font-medium">Reason:</span> {request.rejectionReason}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Rejection Modal */}
      {selectedRequest && selectedRequest.status === 'pending' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                Reject Approval Request
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium mb-1">Rule:</p>
                <p className="text-gray-600">{selectedRequest.ruleName}</p>
              </div>
              <div>
                <p className="font-medium mb-1">Action:</p>
                <p className="text-gray-600">{getActionTypeLabel(selectedRequest.actionType)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Reason for Rejection *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please explain why this request is being rejected..."
                  className="w-full p-3 border rounded-md resize-none"
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedRequest(null)
                    setRejectionReason('')
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleReject(selectedRequest.id)}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  Reject Request
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Details Modal */}
      {selectedRequest && selectedRequest.status !== 'pending' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>Approval Request Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium mb-1">Rule:</p>
                <p className="text-gray-600">{selectedRequest.ruleName}</p>
              </div>
              <div>
                <p className="font-medium mb-1">Action:</p>
                <p className="text-gray-600">{getActionTypeLabel(selectedRequest.actionType)}</p>
              </div>
              <div>
                <p className="font-medium mb-1">Description:</p>
                <p className="text-gray-600">{selectedRequest.description}</p>
              </div>
              <div>
                <p className="font-medium mb-1">Risk Level:</p>
                <Badge className={getRiskColor(selectedRequest.riskLevel)}>
                  {selectedRequest.riskLevel}
                </Badge>
              </div>
              <div>
                <p className="font-medium mb-1">Status:</p>
                <Badge className={getStatusColor(selectedRequest.status)}>
                  {selectedRequest.status}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">Requested by:</p>
                  <p className="text-gray-600">{selectedRequest.requestedBy}</p>
                </div>
                <div>
                  <p className="font-medium">Requested at:</p>
                  <p className="text-gray-600">{new Date(selectedRequest.requestedAt).toLocaleString()}</p>
                </div>
                {selectedRequest.reviewedBy && (
                  <>
                    <div>
                      <p className="font-medium">Reviewed by:</p>
                      <p className="text-gray-600">{selectedRequest.reviewedBy}</p>
                    </div>
                    <div>
                      <p className="font-medium">Reviewed at:</p>
                      <p className="text-gray-600">{selectedRequest.reviewedAt ? new Date(selectedRequest.reviewedAt).toLocaleString() : ''}</p>
                    </div>
                  </>
                )}
              </div>
              {selectedRequest.rejectionReason && (
                <div>
                  <p className="font-medium mb-1">Rejection Reason:</p>
                  <p className="text-gray-600">{selectedRequest.rejectionReason}</p>
                </div>
              )}
              <div className="pt-4">
                <Button
                  onClick={() => setSelectedRequest(null)}
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}