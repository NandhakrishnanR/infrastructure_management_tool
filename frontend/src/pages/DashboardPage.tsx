import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Server,
  PlayCircle,
  StopCircle,
  Clock,
  CheckCircle,
  AlertOctagon,
  Cpu,
  Database,
  ArrowRight,
  ShieldCheck,
  PlusCircle,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { dashboardApi } from '../services/apiServices.js';
import { DashboardSummary, DashboardCharts } from '../types/index.js';
import { StatCard } from '../components/StatCard.js';
import { PageHeader } from '../components/PageHeader.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { LoadingSpinner } from '../components/LoadingSpinner.js';
import { ErrorMessage } from '../components/ErrorMessage.js';
import { Button } from '../components/ui/Button.js';
import { Card } from '../components/ui/Card.js';

const PIE_COLORS: Record<string, string> = {
  RUNNING: '#10b981',
  STOPPED: '#64748b',
  TERMINATED: '#ef4444',
};

export const DashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [charts, setCharts] = useState<DashboardCharts | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryData, chartsData] = await Promise.all([
        dashboardApi.getSummary(),
        dashboardApi.getCharts(),
      ]);
      setSummary(summaryData);
      setCharts(chartsData);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) return <LoadingSpinner message="Calculating infrastructure metrics..." />;
  if (error || !summary) return <ErrorMessage message={error || 'Failed to load dashboard'} onRetry={fetchDashboardData} />;

  const { metrics, recentRequests, recentAuditLogs } = summary;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Infrastructure Overview"
        description="Real-time monitoring of virtual machines, provisioning workloads, and resource capacity."
        action={
          <Link to="/requests/new">
            <Button leftIcon={<PlusCircle className="w-4 h-4" />}>
              Request Virtual Machine
            </Button>
          </Link>
        }
      />

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Demo VMs"
          value={metrics.totalVms}
          icon={Server}
          color="blue"
          subtitle="Simulated instances"
        />
        <StatCard
          title="Running VMs"
          value={metrics.runningVms}
          icon={PlayCircle}
          color="emerald"
          subtitle="Operational instances"
        />
        <StatCard
          title="Pending Requests"
          value={metrics.pendingRequests}
          icon={Clock}
          color="amber"
          subtitle="Awaiting administrative review"
        />
        <StatCard
          title="Failed Jobs"
          value={metrics.failedJobs}
          icon={AlertOctagon}
          color={metrics.failedJobs > 0 ? 'rose' : 'slate'}
          subtitle="Eligible for retry"
        />
      </div>

      {/* Resource Utilization Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500 mb-2">
            <Cpu className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-semibold uppercase tracking-wider">Allocated vCPU</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{metrics.totalCpuAllocated} Cores</div>
          <p className="text-xs text-slate-500 mt-1">Across all running & stopped VMs</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500 mb-2">
            <Database className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-semibold uppercase tracking-wider">Allocated RAM</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {(metrics.totalRamMbAllocated / 1024).toFixed(1)} GB
          </div>
          <p className="text-xs text-slate-500 mt-1">{metrics.totalRamMbAllocated} MB committed memory</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500 mb-2">
            <Server className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-semibold uppercase tracking-wider">Allocated Storage</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{metrics.totalDiskGbAllocated} GB</div>
          <p className="text-xs text-slate-500 mt-1">Local demo disk volume reservation</p>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* VM Status Distribution */}
        <Card
          header={
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">VM Status Distribution</h3>
              <span className="text-xs text-slate-500">Live Inventory</span>
            </div>
          }
        >
          {charts && charts.vmStatusDistribution.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.vmStatusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {charts.vmStatusDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[entry.name] || '#94a3b8'}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-sm text-slate-400">
              No virtual machine records available
            </div>
          )}
        </Card>

        {/* Requests by Status */}
        <Card
          header={
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Requests by Status</h3>
              <span className="text-xs text-slate-500">Workflow Pipeline</span>
            </div>
          }
        >
          {charts && charts.requestsByStatus.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.requestsByStatus} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                  <XAxis
                    dataKey="status"
                    tick={{ fontSize: 10 }}
                    angle={-25}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-sm text-slate-400">
              No request activity records found
            </div>
          )}
        </Card>
      </div>

      {/* Recent Activity: Requests & Audit Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Requests */}
        <Card
          header={
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Recent Infrastructure Requests</h3>
              <Link to="/requests" className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          }
        >
          <div className="divide-y divide-slate-100">
            {recentRequests.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">No requests found</p>
            ) : (
              recentRequests.map((req) => (
                <div key={req.id} className="py-3 flex items-center justify-between">
                  <div>
                    <Link
                      to={`/requests/${req.id}`}
                      className="text-sm font-semibold text-slate-900 hover:text-blue-600 transition-colors"
                    >
                      {req.name}
                    </Link>
                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>{req.operatingSystem}</span>
                      <span>•</span>
                      <span>{req.cpu} vCPU, {(req.ramMb / 1024).toFixed(0)}GB RAM</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={req.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Recent Audit Events */}
        <Card
          header={
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Recent Audit Trail</h3>
              <Link to="/audit-logs" className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
                View logs <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          }
        >
          <div className="divide-y divide-slate-100">
            {recentAuditLogs.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">No audit records yet</p>
            ) : (
              recentAuditLogs.map((log) => (
                <div key={log.id} className="py-3 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 flex-shrink-0 mt-0.5">
                    <ShieldCheck className="w-4 h-4 text-slate-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-slate-900 font-mono">{log.action}</p>
                      <span className="text-[10px] text-slate-400">
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      Actor: <span className="text-slate-700">{log.actor?.name || 'System Worker'}</span> • Target: {log.entityType}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
