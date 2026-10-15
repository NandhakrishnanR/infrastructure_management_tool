import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { approvalApi } from '../services/apiServices.js';
import { InfrastructureRequest } from '../types/index.js';
import { PageHeader } from '../components/PageHeader.js';
import { Button } from '../components/ui/Button.js';
import { Card } from '../components/ui/Card.js';
import { Modal } from '../components/ui/Modal.js';
import { LoadingSpinner } from '../components/LoadingSpinner.js';
import { EmptyState } from '../components/EmptyState.js';
import { ErrorMessage } from '../components/ErrorMessage.js';
import { CheckCircle2, XCircle, Clock, Cpu, Database, HardDrive, User, AlertTriangle } from 'lucide-react';

export const ApprovalsPage: React.FC = () => {
  const [pending, setPending] = useState<InfrastructureRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal actions
  const [selectedReq, setSelectedReq] = useState<InfrastructureRequest | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [comment, setComment] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchPending = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await approvalApi.getPending();
      setPending(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to fetch pending approvals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const openActionModal = (req: InfrastructureRequest, type: 'approve' | 'reject') => {
    setSelectedReq(req);
    setActionType(type);
    setComment('');
    setModalError(null);
  };

  const handleActionSubmit = async () => {
    if (!selectedReq || !actionType) return;
    if (actionType === 'reject' && !comment.trim()) {
      setModalError('A rejection reason is mandatory.');
      return;
    }

    setSubmitting(true);
    setModalError(null);
    try {
      if (actionType === 'approve') {
        await approvalApi.approve(selectedReq.id, comment);
      } else {
        await approvalApi.reject(selectedReq.id, comment);
      }
      setActionType(null);
      setSelectedReq(null);
      fetchPending();
    } catch (err: any) {
      setModalError(err?.response?.data?.message || `Failed to ${actionType} request`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Pending Approval Queue"
        description="Review infrastructure provisioning requests submitted by developers. Approvals initiate background Terraform workflows."
      />

      {loading ? (
        <LoadingSpinner message="Checking approval queue..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchPending} />
      ) : pending.length === 0 ? (
        <EmptyState
          title="Queue Empty"
          description="There are currently no infrastructure requests awaiting administrator approval."
          icon={CheckCircle2}
        />
      ) : (
        <div className="space-y-4">
          {pending.map((req) => (
            <Card key={req.id} className="hover:border-blue-200 transition-all">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <Link
                      to={`/requests/${req.id}`}
                      className="text-lg font-bold text-slate-900 hover:text-blue-600 transition-colors"
                    >
                      {req.name}
                    </Link>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                      Pending Review
                    </span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {req.environment}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Requester: <strong className="text-slate-700">{req.requester?.name}</strong> ({req.requester?.email})</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Resource specs pill row */}
                  <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 font-medium">
                      <Cpu className="w-3.5 h-3.5 text-blue-600" />
                      {req.cpu} vCPU
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 font-medium">
                      <Database className="w-3.5 h-3.5 text-indigo-600" />
                      {(req.ramMb / 1024).toFixed(1)} GB RAM
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 font-medium">
                      <HardDrive className="w-3.5 h-3.5 text-purple-600" />
                      {req.diskGb} GB Disk
                    </span>
                    <span className="text-slate-500">
                      OS: <strong className="text-slate-700">{req.operatingSystem}</strong>
                    </span>
                  </div>

                  {/* Justification snippet */}
                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-2">
                    <strong className="text-slate-700">Justification: </strong>
                    {req.justification}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex sm:flex-col items-center sm:items-end gap-2 flex-shrink-0">
                  <Button
                    variant="success"
                    size="sm"
                    className="w-full sm:w-32"
                    onClick={() => openActionModal(req, 'approve')}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    className="w-full sm:w-32"
                    onClick={() => openActionModal(req, 'reject')}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Approve/Reject Modal */}
      <Modal
        isOpen={!!actionType}
        onClose={() => {
          if (!submitting) setActionType(null);
        }}
        title={actionType === 'approve' ? 'Approve Infrastructure Request' : 'Reject Infrastructure Request'}
        description={
          actionType === 'approve'
            ? `Approving "${selectedReq?.name}" will commit the request and enqueue the background Terraform job.`
            : `Rejecting "${selectedReq?.name}" requires a clear justification to inform the requester.`
        }
        footer={
          <>
            <Button variant="outline" onClick={() => setActionType(null)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              variant={actionType === 'approve' ? 'success' : 'danger'}
              onClick={handleActionSubmit}
              isLoading={submitting}
            >
              {actionType === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {modalError && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg">{modalError}</div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              {actionType === 'approve' ? 'Approval Comments (Optional)' : 'Rejection Reason *'}
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={
                actionType === 'approve'
                  ? 'e.g. Approved per sprint resource budget authorization'
                  : 'e.g. CPU quota exceeded for this development workload; please scale down to 2 vCPU.'
              }
              rows={3}
              className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
