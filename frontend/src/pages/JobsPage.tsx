import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { jobApi } from '../services/apiServices.js';
import { ProvisioningJob, JobStatus } from '../types/index.js';
import { PageHeader } from '../components/PageHeader.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { Pagination } from '../components/Pagination.js';
import { LoadingSpinner } from '../components/LoadingSpinner.js';
import { EmptyState } from '../components/EmptyState.js';
import { ErrorMessage } from '../components/ErrorMessage.js';
import { ConfirmDialog } from '../components/ConfirmDialog.js';
import { Button } from '../components/ui/Button.js';
import { Modal } from '../components/ui/Modal.js';
import {
  Activity,
  Terminal,
  RotateCcw,
  Clock,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Filter,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

export const JobsPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [jobs, setJobs] = useState<ProvisioningJob[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, limit: 10 });

  // Inspection & Retry States
  const [inspectJob, setInspectJob] = useState<ProvisioningJob | null>(null);
  const [retryTargetJob, setRetryTargetJob] = useState<ProvisioningJob | null>(null);
  const [retryLoading, setRetryLoading] = useState<boolean>(false);

  const fetchJobs = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await jobApi.list({
        page,
        limit: 10,
        status: statusFilter || undefined,
      });
      setJobs(res.data);
      if (res.meta) {
        setMeta({
          total: res.meta.total || 0,
          totalPages: res.meta.totalPages || 1,
          limit: res.meta.limit || 10,
        });
      }
    } catch (err: any) {
      if (!silent) setError(err?.response?.data?.message || 'Failed to fetch provisioning jobs');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [statusFilter, page]);

  // Periodic polling every 5 seconds to update active jobs
  useEffect(() => {
    const interval = setInterval(() => {
      fetchJobs(true);
    }, 5000);
    return () => clearInterval(interval);
  }, [statusFilter, page]);

  const handleRetry = async () => {
    if (!retryTargetJob) return;
    setRetryLoading(true);
    try {
      await jobApi.retry(retryTargetJob.id);
      setRetryTargetJob(null);
      fetchJobs();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to trigger job retry');
    } finally {
      setRetryLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Provisioning Workloads & Automation Jobs"
        description="Monitor BullMQ job queue executions, Terraform stage progression, stdout/stderr streams, and error diagnostics."
        action={
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live Polling Active (5s interval)</span>
          </div>
        }
      />

      {/* Filter Row */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Job Statuses</option>
            <option value="QUEUED">Queued</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>

        <Button variant="outline" size="sm" onClick={() => fetchJobs()}>
          Refresh Now
        </Button>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading background provisioning jobs..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={() => fetchJobs()} />
      ) : jobs.length === 0 ? (
        <EmptyState
          title="No Provisioning Jobs"
          description="No Terraform provisioning jobs have been executed yet."
          icon={Activity}
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Job ID & Target VM</th>
                  <th className="px-6 py-3.5">Terraform Stage</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Attempts</th>
                  <th className="px-6 py-3.5">Duration</th>
                  <th className="px-6 py-3.5">Started At</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobs.map((j) => {
                  const durationSec =
                    j.startedAt && j.finishedAt
                      ? Math.round((new Date(j.finishedAt).getTime() - new Date(j.startedAt).getTime()) / 1000)
                      : null;

                  return (
                    <tr key={j.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <Link
                          to={`/requests/${j.requestId}`}
                          className="font-semibold text-slate-900 hover:text-blue-600 transition-colors block"
                        >
                          {j.request?.name || 'Infrastructure Request'}
                        </Link>
                        <span className="text-[11px] font-mono text-slate-400 block truncate max-w-xs">
                          ID: {j.id}
                        </span>
                        {j.request?.requester && (
                          <span className="text-[10px] text-slate-400 block">
                            By: {j.request.requester.name}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono font-medium text-slate-700">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                          {j.stage}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={j.status} type="job" />
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-700">
                        Attempt #{j.attempts}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {durationSec !== null ? `${durationSec} seconds` : 'In progress...'}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {j.startedAt ? new Date(j.startedAt).toLocaleTimeString() : 'Pending pick-up'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setInspectJob(j)}
                            leftIcon={<Terminal className="w-3.5 h-3.5" />}
                          >
                            Logs
                          </Button>
                          {isAdmin && j.status === 'FAILED' && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setRetryTargetJob(j)}
                              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                            >
                              Retry
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={page}
            totalPages={meta.totalPages}
            totalItems={meta.total}
            pageSize={meta.limit}
            onPageChange={(newPage) => setPage(newPage)}
          />
        </div>
      )}

      {/* Inspect Execution Logs Modal */}
      <Modal
        isOpen={!!inspectJob}
        onClose={() => setInspectJob(null)}
        title={`Execution Logs: ${inspectJob?.request?.name || 'Provisioning Job'}`}
        description={`Job ID: ${inspectJob?.id} • Stage: ${inspectJob?.stage} • Status: ${inspectJob?.status}`}
        maxWidth="2xl"
        footer={
          <Button variant="outline" onClick={() => setInspectJob(null)}>
            Close Logs
          </Button>
        }
      >
        <div className="space-y-3">
          {inspectJob?.errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Error Details:</strong> {inspectJob.errorMessage}
              </div>
            </div>
          )}

          <div className="bg-slate-950 text-slate-200 p-4 rounded-xl font-mono text-xs overflow-x-auto max-h-96 border border-slate-800">
            <pre className="whitespace-pre-wrap leading-relaxed">
              {inspectJob?.logs || 'No execution logs recorded yet.'}
            </pre>
          </div>
        </div>
      </Modal>

      {/* Safe Retry Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!retryTargetJob}
        title="Retry Provisioning Job"
        message={`Are you sure you want to trigger a safe retry for request "${retryTargetJob?.request?.name}"? The background worker will reset the job status and re-execute the isolated Terraform workflow.`}
        confirmText="Retry Execution"
        isLoading={retryLoading}
        onConfirm={handleRetry}
        onCancel={() => setRetryTargetJob(null)}
      />
    </div>
  );
};
