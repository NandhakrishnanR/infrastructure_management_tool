import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { requestApi, approvalApi } from '../services/apiServices.js';
import { InfrastructureRequest } from '../types/index.js';
import { useAuth } from '../context/AuthContext.js';
import { PageHeader } from '../components/PageHeader.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { Button } from '../components/ui/Button.js';
import { Card } from '../components/ui/Card.js';
import { Modal } from '../components/ui/Modal.js';
import { LoadingSpinner } from '../components/LoadingSpinner.js';
import { ErrorMessage } from '../components/ErrorMessage.js';
import { ConfirmDialog } from '../components/ConfirmDialog.js';
import {
  ArrowLeft,
  Server,
  User,
  Cpu,
  Database,
  HardDrive,
  Calendar,
  CheckCircle,
  XCircle,
  Terminal,
  Activity,
  AlertCircle,
  FileText,
} from 'lucide-react';

export const RequestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin } = useAuth();

  const [request, setRequest] = useState<InfrastructureRequest | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Dialog States
  const [isCancelOpen, setIsCancelOpen] = useState<boolean>(false);
  const [isApproveOpen, setIsApproveOpen] = useState<boolean>(false);
  const [isRejectOpen, setIsRejectOpen] = useState<boolean>(false);
  const [approvalComment, setApprovalComment] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [actionError, setActionError] = useState<string | null>(null);

  const queryParams = new URLSearchParams(location.search);
  const isNewlyCreated = queryParams.get('created') === 'true';

  const fetchRequestDetails = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await requestApi.getById(id);
      setRequest(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to fetch request details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequestDetails();
  }, [id]);

  // Periodic polling if request is in PROVISIONING or PENDING_APPROVAL
  useEffect(() => {
    if (!request || (request.status !== 'PROVISIONING' && request.status !== 'PENDING_APPROVAL')) return;
    const interval = setInterval(async () => {
      try {
        const fresh = await requestApi.getById(request.id);
        setRequest(fresh);
      } catch {
        // silent polling error
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [request?.status]);

  const handleCancel = async () => {
    if (!id) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await requestApi.cancel(id, 'Cancelled by requester');
      setIsCancelOpen(false);
      fetchRequestDetails();
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Failed to cancel request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!id) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await approvalApi.approve(id, approvalComment);
      setIsApproveOpen(false);
      fetchRequestDetails();
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Failed to approve request');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!id) return;
    if (!rejectionReason.trim()) {
      setActionError('A rejection reason is mandatory.');
      return;
    }
    setActionLoading(true);
    setActionError(null);
    try {
      await approvalApi.reject(id, rejectionReason);
      setIsRejectOpen(false);
      fetchRequestDetails();
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Failed to reject request');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading request details..." />;
  if (error || !request) return <ErrorMessage message={error || 'Request not found'} onRetry={fetchRequestDetails} />;

  const canCancel = (request.status === 'PENDING_APPROVAL' || request.status === 'DRAFT') &&
    (user?.id === request.requesterId || isAdmin);

  const canApproveOrReject = isAdmin && request.status === 'PENDING_APPROVAL' && request.requesterId !== user?.id;

  const latestJob = request.provisioningJobs && request.provisioningJobs.length > 0
    ? request.provisioningJobs[0]
    : null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Link to="/requests" className="hover:text-blue-600 flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Requests
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-mono text-xs">{request.name}</span>
      </div>

      {isNewlyCreated && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span>Infrastructure request submitted successfully! It is now pending administrative review.</span>
          </div>
        </div>
      )}

      {/* Header with Title and Actions */}
      <PageHeader
        title={request.name}
        description={`Request ID: ${request.id}`}
        action={
          <div className="flex items-center gap-3">
            <StatusBadge status={request.status} />

            {canApproveOrReject && (
              <>
                <Button variant="danger" size="sm" onClick={() => setIsRejectOpen(true)}>
                  Reject
                </Button>
                <Button variant="success" size="sm" onClick={() => setIsApproveOpen(true)}>
                  Approve Request
                </Button>
              </>
            )}

            {canCancel && (
              <Button variant="outline" size="sm" onClick={() => setIsCancelOpen(true)}>
                Cancel Request
              </Button>
            )}
          </div>
        }
      />

      {/* Grid: Request Details & Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Specs, Justification, Provisioning */}
        <div className="lg:col-span-2 space-y-6">
          {/* Hardware Specs Card */}
          <Card header={<h3 className="text-sm font-semibold text-slate-900">Virtual Hardware Configuration</h3>}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="text-xs text-slate-500 flex items-center gap-1.5 mb-1">
                  <Cpu className="w-3.5 h-3.5 text-blue-600" />
                  <span>vCPU Cores</span>
                </div>
                <div className="text-lg font-bold text-slate-800">{request.cpu} Cores</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="text-xs text-slate-500 flex items-center gap-1.5 mb-1">
                  <Database className="w-3.5 h-3.5 text-indigo-600" />
                  <span>RAM Memory</span>
                </div>
                <div className="text-lg font-bold text-slate-800">
                  {(request.ramMb / 1024).toFixed(1)} GB ({request.ramMb} MB)
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="text-xs text-slate-500 flex items-center gap-1.5 mb-1">
                  <HardDrive className="w-3.5 h-3.5 text-purple-600" />
                  <span>Disk Storage</span>
                </div>
                <div className="text-lg font-bold text-slate-800">{request.diskGb} GB</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="text-xs text-slate-500 mb-1">Operating System</div>
                <div className="text-sm font-semibold text-slate-800">{request.operatingSystem}</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="text-xs text-slate-500 mb-1">Deployment Region</div>
                <div className="text-sm font-semibold text-slate-800">{request.region}</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="text-xs text-slate-500 mb-1">Environment</div>
                <div className="text-sm font-semibold text-slate-800">{request.environment}</div>
              </div>
            </div>
          </Card>

          {/* Business Justification */}
          <Card header={<h3 className="text-sm font-semibold text-slate-900">Business Justification</h3>}>
            <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-200/60">
              {request.justification}
            </p>
          </Card>

          {/* Associated Virtual Machine Record (If Active) */}
          {request.virtualMachine && (
            <Card header={<h3 className="text-sm font-semibold text-slate-900">Provisioned Virtual Machine</h3>}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Link
                      to={`/inventory/${request.virtualMachine.id}`}
                      className="text-base font-bold text-blue-600 hover:underline"
                    >
                      {request.virtualMachine.name}
                    </Link>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      {request.virtualMachine.hostname}
                    </p>
                  </div>
                  <StatusBadge status={request.virtualMachine.powerState} type="power" />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    Mode: {request.virtualMachine.provisioningMode}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                    Simulated Demo Resource
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* Terraform Execution Logs (If job exists) */}
          {latestJob && (
            <Card
              header={
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-slate-600" />
                    <h3 className="text-sm font-semibold text-slate-900">Terraform Automation Job</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Stage: <strong className="text-slate-800">{latestJob.stage}</strong></span>
                    <StatusBadge status={latestJob.status} type="job" />
                  </div>
                </div>
              }
            >
              <div className="space-y-3">
                {latestJob.errorMessage && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong>Job Failure Message:</strong> {latestJob.errorMessage}
                    </div>
                  </div>
                )}

                <div className="bg-slate-950 text-slate-200 p-4 rounded-xl font-mono text-xs overflow-x-auto max-h-72 border border-slate-800">
                  <pre className="whitespace-pre-wrap leading-5">
                    {latestJob.logs || 'No execution logs recorded yet.'}
                  </pre>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column (1 Col): Meta, Requester, Timeline */}
        <div className="space-y-6">
          {/* Requester Info */}
          <Card header={<h3 className="text-sm font-semibold text-slate-900">Requester Details</h3>}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-sm">
                {request.requester?.name?.slice(0, 2).toUpperCase() || 'U'}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{request.requester?.name}</p>
                <p className="text-xs text-slate-500">{request.requester?.email}</p>
                <span className="inline-block text-[10px] text-blue-600 font-medium capitalize mt-0.5">
                  Role: {request.requester?.role}
                </span>
              </div>
            </div>
          </Card>

          {/* Approvals History */}
          <Card header={<h3 className="text-sm font-semibold text-slate-900">Approval Decisions</h3>}>
            {!request.approvals || request.approvals.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No approval decisions recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {request.approvals.map((app) => (
                  <div key={app.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-xs">
                    <div className="flex items-center justify-between font-semibold mb-1">
                      <span className={app.decision === 'APPROVED' ? 'text-emerald-700' : 'text-rose-700'}>
                        {app.decision}
                      </span>
                      <span className="text-slate-400 font-normal">
                        {new Date(app.decidedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-slate-600 italic">"{app.comment || 'No comment provided'}"</p>
                    <p className="text-[10px] text-slate-400 mt-1">Decided by: {app.approver?.name || 'Administrator'}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Status Progression Timeline */}
          <Card header={<h3 className="text-sm font-semibold text-slate-900">Status History</h3>}>
            {!request.statusHistory || request.statusHistory.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No transition history available.</p>
            ) : (
              <div className="relative pl-4 border-l-2 border-slate-200 space-y-4">
                {request.statusHistory.map((hist, idx) => (
                  <div key={hist.id || idx} className="relative">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-white" />
                    <p className="text-xs font-semibold text-slate-800">
                      {hist.fromStatus} → {hist.toStatus}
                    </p>
                    {hist.reason && <p className="text-[11px] text-slate-500 mt-0.5">{hist.reason}</p>}
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {new Date(hist.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                      {new Date(hist.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Cancel Request Dialog */}
      <ConfirmDialog
        isOpen={isCancelOpen}
        title="Cancel Infrastructure Request"
        message="Are you sure you want to cancel this request? Once cancelled, this request cannot be approved or provisioned."
        confirmText="Confirm Cancellation"
        variant="danger"
        isLoading={actionLoading}
        onConfirm={handleCancel}
        onCancel={() => setIsCancelOpen(false)}
      />

      {/* Approve Dialog */}
      <Modal
        isOpen={isApproveOpen}
        onClose={() => setIsApproveOpen(false)}
        title="Approve Infrastructure Request"
        description="Approving will automatically enqueue the background BullMQ provisioning job and trigger the isolated Terraform workflow."
        footer={
          <>
            <Button variant="outline" onClick={() => setIsApproveOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button variant="success" onClick={handleApprove} isLoading={actionLoading}>
              Confirm Approval
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {actionError && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg">{actionError}</div>
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Approval Comment (Optional)
            </label>
            <textarea
              value={approvalComment}
              onChange={(e) => setApprovalComment(e.target.value)}
              placeholder="e.g. Approved per sprint plan budget authorization..."
              className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
        </div>
      </Modal>

      {/* Reject Dialog */}
      <Modal
        isOpen={isRejectOpen}
        onClose={() => setIsRejectOpen(false)}
        title="Reject Infrastructure Request"
        description="Please provide a clear reason for the requester explaining why this request cannot be approved."
        footer={
          <>
            <Button variant="outline" onClick={() => setIsRejectOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleReject} isLoading={actionLoading}>
              Confirm Rejection
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {actionError && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg">{actionError}</div>
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Rejection Reason *
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Requested CPU exceeds development team allocation policy; please scale down."
              className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              rows={3}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
