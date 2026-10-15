import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { requestApi } from '../services/apiServices.js';
import { InfrastructureRequest, RequestStatus } from '../types/index.js';
import { PageHeader } from '../components/PageHeader.js';
import { SearchInput } from '../components/SearchInput.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { Pagination } from '../components/Pagination.js';
import { LoadingSpinner } from '../components/LoadingSpinner.js';
import { EmptyState } from '../components/EmptyState.js';
import { ErrorMessage } from '../components/ErrorMessage.js';
import { Button } from '../components/ui/Button.js';
import { PlusCircle, ExternalLink, Filter, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

export const RequestsPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [requests, setRequests] = useState<InfrastructureRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [search, setSearch] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, limit: 10 });

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await requestApi.list({
        page,
        limit: 10,
        search: search || undefined,
        status: status || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      setRequests(res.data);
      if (res.meta) {
        setMeta({
          total: res.meta.total || 0,
          totalPages: res.meta.totalPages || 1,
          limit: res.meta.limit || 10,
        });
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRequests();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, status, page]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={isAdmin ? 'All Infrastructure Requests' : 'My Infrastructure Requests'}
        description={
          isAdmin
            ? 'Review and inspect all virtual machine provisioning requests submitted across the organization.'
            : 'Track the status and provisioning lifecycle of your requested virtual machines.'
        }
        action={
          <Link to="/requests/new">
            <Button leftIcon={<PlusCircle className="w-4 h-4" />}>
              Request New VM
            </Button>
          </Link>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
        <SearchInput
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Search requests by name or description..."
          className="w-full sm:w-80"
        />

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="APPROVED">Approved</option>
            <option value="PROVISIONING">Provisioning</option>
            <option value="ACTIVE">Active</option>
            <option value="REJECTED">Rejected</option>
            <option value="FAILED">Failed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Main Table Content */}
      {loading ? (
        <LoadingSpinner message="Loading infrastructure requests..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchRequests} />
      ) : requests.length === 0 ? (
        <EmptyState
          title="No Infrastructure Requests"
          description={
            search || status
              ? 'No requests match your current search and filter criteria.'
              : 'You have not submitted any infrastructure requests yet.'
          }
          actionText={search || status ? 'Clear Filters' : 'Submit First Request'}
          onAction={() => {
            if (search || status) {
              setSearch('');
              setStatus('');
            } else {
              window.location.href = '/requests/new';
            }
          }}
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">VM Name</th>
                  {isAdmin && <th className="px-6 py-3.5">Requester</th>}
                  <th className="px-6 py-3.5">Specifications</th>
                  <th className="px-6 py-3.5">Environment</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Submitted</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <Link
                        to={`/requests/${req.id}`}
                        className="font-semibold text-slate-900 hover:text-blue-600 transition-colors block"
                      >
                        {req.name}
                      </Link>
                      <span className="text-xs text-slate-400 block">{req.operatingSystem}</span>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4">
                        <span className="font-medium text-slate-800 block text-xs">
                          {req.requester?.name || 'Unknown'}
                        </span>
                        <span className="text-[11px] text-slate-400 block">
                          {req.requester?.email}
                        </span>
                      </td>
                    )}
                    <td className="px-6 py-4 text-xs">
                      <span className="font-medium text-slate-700">
                        {req.cpu} vCPU • {(req.ramMb / 1024).toFixed(0)} GB RAM
                      </span>
                      <span className="text-slate-400 block">{req.diskGb} GB Disk</span>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-700">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {req.environment}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link to={`/requests/${req.id}`}>
                        <Button variant="outline" size="sm" rightIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                          Details
                        </Button>
                      </Link>
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
    </div>
  );
};
