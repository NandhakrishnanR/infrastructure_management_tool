import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { inventoryApi } from '../services/apiServices.js';
import { VirtualMachine, PowerState } from '../types/index.js';
import { PageHeader } from '../components/PageHeader.js';
import { SearchInput } from '../components/SearchInput.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { Pagination } from '../components/Pagination.js';
import { LoadingSpinner } from '../components/LoadingSpinner.js';
import { EmptyState } from '../components/EmptyState.js';
import { ErrorMessage } from '../components/ErrorMessage.js';
import { ConfirmDialog } from '../components/ConfirmDialog.js';
import { Button } from '../components/ui/Button.js';
import { Modal } from '../components/ui/Modal.js';
import {
  HardDrive,
  Play,
  Square,
  RefreshCw,
  Info,
  Server,
  Filter,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

export const InventoryPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [vms, setVms] = useState<VirtualMachine[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [search, setSearch] = useState<string>('');
  const [powerFilter, setPowerFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, limit: 10 });

  // Power action state
  const [powerModal, setPowerModal] = useState<{
    vm: VirtualMachine | null;
    action: 'START' | 'STOP' | 'RESTART' | null;
  }>({ vm: null, action: null });
  const [powerLoading, setPowerLoading] = useState<boolean>(false);
  const [powerError, setPowerError] = useState<string | null>(null);

  // Details Modal
  const [detailVm, setDetailVm] = useState<VirtualMachine | null>(null);

  const fetchInventory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await inventoryApi.list({
        page,
        limit: 10,
        search: search || undefined,
        powerState: powerFilter || undefined,
      });
      setVms(res.data);
      if (res.meta) {
        setMeta({
          total: res.meta.total || 0,
          totalPages: res.meta.totalPages || 1,
          limit: res.meta.limit || 10,
        });
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to fetch VM inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInventory();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, powerFilter, page]);

  const handlePowerAction = async () => {
    if (!powerModal.vm || !powerModal.action) return;
    setPowerLoading(true);
    setPowerError(null);
    try {
      await inventoryApi.togglePower(powerModal.vm.id, powerModal.action);
      setPowerModal({ vm: null, action: null });
      fetchInventory();
    } catch (err: any) {
      setPowerError(err?.response?.data?.message || 'Failed to toggle VM power state');
    } finally {
      setPowerLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Virtual Machine Inventory"
        description="Centralized inventory of provisioned virtual machine instances. Includes simulated power management operations."
        action={
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
            <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>Simulated Demo Resources (Zero Cloud Cost)</span>
          </div>
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
          placeholder="Search by VM name, hostname, or OS..."
          className="w-full sm:w-80"
        />

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={powerFilter}
            onChange={(e) => {
              setPowerFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Power States</option>
            <option value="RUNNING">Running</option>
            <option value="STOPPED">Stopped</option>
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      {loading ? (
        <LoadingSpinner message="Scanning virtual machine inventory..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchInventory} />
      ) : vms.length === 0 ? (
        <EmptyState
          title="No Virtual Machines Found"
          description={
            search || powerFilter
              ? 'No instances match the specified search or filter criteria.'
              : 'No virtual machines have been provisioned yet. Submit and approve an infrastructure request to deploy a demo VM.'
          }
          icon={HardDrive}
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">VM Name & Hostname</th>
                  <th className="px-6 py-3.5">Specifications</th>
                  <th className="px-6 py-3.5">Environment</th>
                  {isAdmin && <th className="px-6 py-3.5">Owner</th>}
                  <th className="px-6 py-3.5">Power State</th>
                  <th className="px-6 py-3.5 text-right">Power Actions</th>
                  <th className="px-6 py-3.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vms.map((vm) => (
                  <tr key={vm.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-900 block">{vm.name}</span>
                      <span className="text-xs font-mono text-slate-500 block truncate max-w-xs">
                        {vm.hostname}
                      </span>
                      <span className="inline-block text-[10px] text-blue-600 font-medium">
                        {vm.operatingSystem}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <span className="font-medium text-slate-800">
                        {vm.cpu} vCPU • {(vm.ramMb / 1024).toFixed(0)} GB RAM
                      </span>
                      <span className="text-slate-400 block">{vm.diskGb} GB Storage • {vm.region}</span>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-700">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {vm.environment}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-xs">
                        <span className="font-medium text-slate-800 block">{vm.owner?.name}</span>
                        <span className="text-slate-400 block">{vm.owner?.email}</span>
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <StatusBadge status={vm.powerState} type="power" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {vm.powerState === 'STOPPED' ? (
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => setPowerModal({ vm, action: 'START' })}
                            leftIcon={<Play className="w-3.5 h-3.5" />}
                          >
                            Start
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setPowerModal({ vm, action: 'STOP' })}
                            leftIcon={<Square className="w-3.5 h-3.5 text-slate-600" />}
                          >
                            Stop
                          </Button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDetailVm(vm)}
                      >
                        Inspect
                      </Button>
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

      {/* Power Control Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!powerModal.action}
        title={`Simulated Power ${powerModal.action}`}
        message={`Are you sure you want to ${powerModal.action?.toLowerCase()} demo VM "${powerModal.vm?.name}"? This operation simulates state transition in PostgreSQL inventory and records an audit log event.`}
        confirmText={`Confirm ${powerModal.action}`}
        variant={powerModal.action === 'STOP' ? 'danger' : 'success'}
        isLoading={powerLoading}
        onConfirm={handlePowerAction}
        onCancel={() => setPowerModal({ vm: null, action: null })}
      />

      {/* Inspect VM Modal */}
      <Modal
        isOpen={!!detailVm}
        onClose={() => setDetailVm(null)}
        title={detailVm?.name || 'VM Details'}
        description={`Simulated Virtual Machine (Mode: ${detailVm?.provisioningMode})`}
        maxWidth="lg"
        footer={
          <Button variant="outline" onClick={() => setDetailVm(null)}>
            Close
          </Button>
        }
      >
        {detailVm && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-500 block">Assigned Hostname</span>
                <span className="font-mono font-semibold text-slate-800 break-all">{detailVm.hostname}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-500 block">Power State</span>
                <div className="mt-1"><StatusBadge status={detailVm.powerState} type="power" /></div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-500 block">Operating System</span>
                <span className="font-semibold text-slate-800">{detailVm.operatingSystem}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-500 block">Region & Environment</span>
                <span className="font-semibold text-slate-800">{detailVm.region} • {detailVm.environment}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-500 block">Hardware Specs</span>
                <span className="font-semibold text-slate-800">{detailVm.cpu} vCPU, {(detailVm.ramMb / 1024).toFixed(0)}GB RAM, {detailVm.diskGb}GB Disk</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-500 block">Owner</span>
                <span className="font-semibold text-slate-800">{detailVm.owner?.name} ({detailVm.owner?.email})</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-center justify-between">
              <span>View original infrastructure request and approval notes:</span>
              <Link to={`/requests/${detailVm.requestId}`}>
                <Button size="sm" variant="outline" className="bg-white">
                  View Request Details
                </Button>
              </Link>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
