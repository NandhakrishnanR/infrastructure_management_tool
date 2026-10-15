import React, { useState, useEffect } from 'react';
import { quotaApi } from '../services/apiServices.js';
import { User, ResourceQuota } from '../types/index.js';
import { PageHeader } from '../components/PageHeader.js';
import { LoadingSpinner } from '../components/LoadingSpinner.js';
import { ErrorMessage } from '../components/ErrorMessage.js';
import { Card } from '../components/ui/Card.js';
import { Button } from '../components/ui/Button.js';
import { Modal } from '../components/ui/Modal.js';
import { Sliders, Cpu, Database, HardDrive, Server, Edit2, ShieldAlert } from 'lucide-react';

export const QuotasPage: React.FC = () => {
  const [users, setUsers] = useState<(User & { usage: any })[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Quota State
  const [selectedUser, setSelectedUser] = useState<(User & { usage: any }) | null>(null);
  const [formValues, setFormValues] = useState({
    maxVms: 5,
    maxCpu: 16,
    maxRamMb: 32768,
    maxDiskGb: 500,
  });
  const [updating, setUpdating] = useState<boolean>(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const fetchQuotas = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await quotaApi.list();
      setUsers(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to fetch resource quotas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotas();
  }, []);

  const openEditModal = (u: User & { usage: any }) => {
    setSelectedUser(u);
    setFormValues({
      maxVms: u.quota?.maxVms || 5,
      maxCpu: u.quota?.maxCpu || 16,
      maxRamMb: u.quota?.maxRamMb || 32768,
      maxDiskGb: u.quota?.maxDiskGb || 500,
    });
    setUpdateError(null);
  };

  const handleUpdate = async () => {
    if (!selectedUser) return;
    setUpdating(true);
    setUpdateError(null);
    try {
      await quotaApi.update(selectedUser.id, formValues);
      setSelectedUser(null);
      fetchQuotas();
    } catch (err: any) {
      setUpdateError(err?.response?.data?.message || 'Failed to update quota limits');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        title="Resource Quota Management"
        description="Configure upper thresholds for virtual machine count, CPU allocation, RAM capacity, and persistent disk space per user."
      />

      {loading ? (
        <LoadingSpinner message="Calculating user quota allocations..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchQuotas} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {users.map((u) => {
            const quota = u.quota || { maxVms: 5, maxCpu: 16, maxRamMb: 32768, maxDiskGb: 500 };
            const usage = u.usage || { usedVms: 0, usedCpu: 0, usedRamMb: 0, usedDiskGb: 0 };

            const vmsPercent = Math.min(100, Math.round((usage.usedVms / quota.maxVms) * 100));
            const cpuPercent = Math.min(100, Math.round((usage.usedCpu / quota.maxCpu) * 100));
            const ramPercent = Math.min(100, Math.round((usage.usedRamMb / quota.maxRamMb) * 100));
            const diskPercent = Math.min(100, Math.round((usage.usedDiskGb / quota.maxDiskGb) * 100));

            return (
              <Card
                key={u.id}
                header={
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">{u.name}</h3>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {u.role}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{u.email}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditModal(u)}
                      leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                    >
                      Adjust Quota
                    </Button>
                  </div>
                }
              >
                <div className="space-y-4">
                  {/* VM Count */}
                  <div>
                    <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                      <span className="flex items-center gap-1.5">
                        <Server className="w-3.5 h-3.5 text-blue-600" /> VM Instances
                      </span>
                      <span>
                        <strong>{usage.usedVms}</strong> / {quota.maxVms} VMs ({vmsPercent}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full ${
                          vmsPercent >= 90 ? 'bg-red-500' : vmsPercent >= 70 ? 'bg-amber-500' : 'bg-blue-600'
                        }`}
                        style={{ width: `${vmsPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* CPU Cores */}
                  <div>
                    <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                      <span className="flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-indigo-600" /> vCPU Cores
                      </span>
                      <span>
                        <strong>{usage.usedCpu}</strong> / {quota.maxCpu} Cores ({cpuPercent}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full ${
                          cpuPercent >= 90 ? 'bg-red-500' : cpuPercent >= 70 ? 'bg-amber-500' : 'bg-indigo-600'
                        }`}
                        style={{ width: `${cpuPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* RAM MB */}
                  <div>
                    <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                      <span className="flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5 text-purple-600" /> RAM Memory
                      </span>
                      <span>
                        <strong>{(usage.usedRamMb / 1024).toFixed(1)}</strong> / {(quota.maxRamMb / 1024).toFixed(0)} GB ({ramPercent}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full ${
                          ramPercent >= 90 ? 'bg-red-500' : ramPercent >= 70 ? 'bg-amber-500' : 'bg-purple-600'
                        }`}
                        style={{ width: `${ramPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Disk GB */}
                  <div>
                    <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                      <span className="flex items-center gap-1.5">
                        <HardDrive className="w-3.5 h-3.5 text-emerald-600" /> Storage Volume
                      </span>
                      <span>
                        <strong>{usage.usedDiskGb}</strong> / {quota.maxDiskGb} GB ({diskPercent}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full ${
                          diskPercent >= 90 ? 'bg-red-500' : diskPercent >= 70 ? 'bg-amber-500' : 'bg-emerald-600'
                        }`}
                        style={{ width: `${diskPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Adjust Quotas Modal */}
      <Modal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title={`Adjust Quota: ${selectedUser?.name}`}
        description={`Configure resource limits for ${selectedUser?.email}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setSelectedUser(null)} disabled={updating}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} isLoading={updating}>
              Save Quota Configuration
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {updateError && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg">{updateError}</div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Maximum Concurrent VMs
            </label>
            <input
              type="number"
              value={formValues.maxVms}
              onChange={(e) => setFormValues({ ...formValues, maxVms: parseInt(e.target.value, 10) || 1 })}
              min={1}
              max={100}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Maximum Total CPU Cores
            </label>
            <input
              type="number"
              value={formValues.maxCpu}
              onChange={(e) => setFormValues({ ...formValues, maxCpu: parseInt(e.target.value, 10) || 1 })}
              min={1}
              max={256}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Maximum Total RAM (MB)
            </label>
            <input
              type="number"
              value={formValues.maxRamMb}
              onChange={(e) => setFormValues({ ...formValues, maxRamMb: parseInt(e.target.value, 10) || 1024 })}
              min={1024}
              step={1024}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              {(formValues.maxRamMb / 1024).toFixed(1)} GB RAM equivalent
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Maximum Total Disk (GB)
            </label>
            <input
              type="number"
              value={formValues.maxDiskGb}
              onChange={(e) => setFormValues({ ...formValues, maxDiskGb: parseInt(e.target.value, 10) || 10 })}
              min={10}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
