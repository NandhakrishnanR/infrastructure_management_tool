import React, { useState, useEffect } from 'react';
import { auditApi } from '../services/apiServices.js';
import { AuditLog } from '../types/index.js';
import { PageHeader } from '../components/PageHeader.js';
import { SearchInput } from '../components/SearchInput.js';
import { Pagination } from '../components/Pagination.js';
import { LoadingSpinner } from '../components/LoadingSpinner.js';
import { EmptyState } from '../components/EmptyState.js';
import { ErrorMessage } from '../components/ErrorMessage.js';
import { Button } from '../components/ui/Button.js';
import { Modal } from '../components/ui/Modal.js';
import { ShieldCheck, Filter, Calendar, Code, CheckCircle, XCircle } from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [search, setSearch] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, limit: 15 });

  // Metadata inspector
  const [selectedMetaLog, setSelectedMetaLog] = useState<AuditLog | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await auditApi.list({
        page,
        limit: 15,
        search: search || undefined,
        action: actionFilter || undefined,
      });
      setLogs(res.data);
      if (res.meta) {
        setMeta({
          total: res.meta.total || 0,
          totalPages: res.meta.totalPages || 1,
          limit: res.meta.limit || 15,
        });
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, actionFilter, page]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs & Compliance Trail"
        description="Append-only immutable record of system operations, user logins, approval decisions, and infrastructure lifecycle changes."
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
        <SearchInput
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Search by action, entity ID, or actor..."
          className="w-full sm:w-80"
        />

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Actions</option>
            <option value="USER_LOGIN">User Login</option>
            <option value="REQUEST_CREATED">Request Created</option>
            <option value="REQUEST_APPROVED">Request Approved</option>
            <option value="REQUEST_REJECTED">Request Rejected</option>
            <option value="REQUEST_CANCELLED">Request Cancelled</option>
            <option value="PROVISIONING_STARTED">Provisioning Started</option>
            <option value="PROVISIONING_COMPLETED">Provisioning Completed</option>
            <option value="PROVISIONING_FAILED">Provisioning Failed</option>
            <option value="JOB_RETRY_TRIGGERED">Job Retry Triggered</option>
            <option value="VM_POWER_START">VM Power Start</option>
            <option value="VM_POWER_STOP">VM Power Stop</option>
            <option value="QUOTA_UPDATED">Quota Updated</option>
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      {loading ? (
        <LoadingSpinner message="Querying audit records..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchLogs} />
      ) : logs.length === 0 ? (
        <EmptyState
          title="No Audit Logs Found"
          description="No audit records match the current criteria."
          icon={ShieldCheck}
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Timestamp</th>
                  <th className="px-6 py-3.5">Action</th>
                  <th className="px-6 py-3.5">Actor</th>
                  <th className="px-6 py-3.5">Target Entity</th>
                  <th className="px-6 py-3.5">Result</th>
                  <th className="px-6 py-3.5 text-right">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                      <div className="font-medium text-slate-800">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(log.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {log.actor ? (
                        <div>
                          <span className="font-medium text-slate-800 block">{log.actor.name}</span>
                          <span className="text-[11px] text-slate-400 block">{log.actor.email}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">System Automation</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <span className="font-medium text-slate-700">{log.entityType}</span>
                      {log.entityId && (
                        <span className="font-mono text-[10px] text-slate-400 block truncate max-w-xs">
                          {log.entityId}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                          log.result === 'SUCCESS'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {log.result === 'SUCCESS' ? (
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <XCircle className="w-3 h-3 text-rose-600" />
                        )}
                        {log.result}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {log.metadata ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedMetaLog(log)}
                          leftIcon={<Code className="w-3.5 h-3.5" />}
                        >
                          Payload
                        </Button>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
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

      {/* Metadata JSON Modal */}
      <Modal
        isOpen={!!selectedMetaLog}
        onClose={() => setSelectedMetaLog(null)}
        title={`Audit Payload: ${selectedMetaLog?.action}`}
        description={`Event ID: ${selectedMetaLog?.id}`}
        maxWidth="lg"
        footer={
          <Button variant="outline" onClick={() => setSelectedMetaLog(null)}>
            Close
          </Button>
        }
      >
        <div className="bg-slate-950 text-slate-200 p-4 rounded-xl font-mono text-xs overflow-x-auto max-h-80 border border-slate-800">
          <pre>{JSON.stringify(selectedMetaLog?.metadata, null, 2)}</pre>
        </div>
      </Modal>
    </div>
  );
};
