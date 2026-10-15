import { apiClient } from './apiClient.js';
import {
  User,
  InfrastructureRequest,
  VirtualMachine,
  ProvisioningJob,
  AuditLog,
  ResourceQuota,
  ApiResponse,
  DashboardSummary,
  DashboardCharts,
} from '../types/index.js';

// Auth Services
export const authApi = {
  login: async (credentials: { email: string; password: string }) => {
    const res = await apiClient.post<ApiResponse<{ user: User; token: string }>>('/auth/login', credentials);
    return res.data;
  },
  logout: async () => {
    const res = await apiClient.post<ApiResponse<null>>('/auth/logout');
    return res.data;
  },
  getCurrentUser: async () => {
    const res = await apiClient.get<ApiResponse<User>>('/auth/me');
    return res.data;
  },
};

// Dashboard Services
export const dashboardApi = {
  getSummary: async () => {
    const res = await apiClient.get<ApiResponse<DashboardSummary>>('/dashboard/summary');
    return res.data.data;
  },
  getCharts: async () => {
    const res = await apiClient.get<ApiResponse<DashboardCharts>>('/dashboard/charts');
    return res.data.data;
  },
};

// Request Services
export const requestApi = {
  list: async (params?: Record<string, any>) => {
    const res = await apiClient.get<ApiResponse<InfrastructureRequest[]>>('/requests', { params });
    return res.data;
  },
  getById: async (id: string) => {
    const res = await apiClient.get<ApiResponse<InfrastructureRequest>>(`/requests/${id}`);
    return res.data.data;
  },
  create: async (data: any) => {
    const res = await apiClient.post<ApiResponse<InfrastructureRequest>>('/requests', data);
    return res.data.data;
  },
  cancel: async (id: string, reason?: string) => {
    const res = await apiClient.post<ApiResponse<InfrastructureRequest>>(`/requests/${id}/cancel`, { reason });
    return res.data.data;
  },
};

// Approval Services
export const approvalApi = {
  getPending: async () => {
    const res = await apiClient.get<ApiResponse<InfrastructureRequest[]>>('/approvals/pending');
    return res.data.data;
  },
  approve: async (id: string, comment?: string) => {
    const res = await apiClient.post<ApiResponse<any>>(`/approvals/${id}/approve`, { comment });
    return res.data;
  },
  reject: async (id: string, comment: string) => {
    const res = await apiClient.post<ApiResponse<any>>(`/approvals/${id}/reject`, { comment });
    return res.data;
  },
};

// Inventory Services
export const inventoryApi = {
  list: async (params?: Record<string, any>) => {
    const res = await apiClient.get<ApiResponse<VirtualMachine[]>>('/inventory', { params });
    return res.data;
  },
  getById: async (id: string) => {
    const res = await apiClient.get<ApiResponse<VirtualMachine>>(`/inventory/${id}`);
    return res.data.data;
  },
  togglePower: async (id: string, action: 'START' | 'STOP' | 'RESTART') => {
    const res = await apiClient.post<ApiResponse<VirtualMachine>>(`/inventory/${id}/power`, { action });
    return res.data.data;
  },
};

// Provisioning Job Services
export const jobApi = {
  list: async (params?: Record<string, any>) => {
    const res = await apiClient.get<ApiResponse<ProvisioningJob[]>>('/jobs', { params });
    return res.data;
  },
  getById: async (id: string) => {
    const res = await apiClient.get<ApiResponse<ProvisioningJob>>(`/jobs/${id}`);
    return res.data.data;
  },
  retry: async (id: string) => {
    const res = await apiClient.post<ApiResponse<ProvisioningJob>>(`/jobs/${id}/retry`);
    return res.data.data;
  },
};

// Audit Log Services
export const auditApi = {
  list: async (params?: Record<string, any>) => {
    const res = await apiClient.get<ApiResponse<AuditLog[]>>('/audit-logs', { params });
    return res.data;
  },
};

// Resource Quotas Services
export const quotaApi = {
  list: async () => {
    const res = await apiClient.get<ApiResponse<(User & { usage: any })[]>>('/quotas');
    return res.data.data;
  },
  update: async (userId: string, data: { maxVms: number; maxCpu: number; maxRamMb: number; maxDiskGb: number }) => {
    const res = await apiClient.put<ApiResponse<ResourceQuota>>(`/quotas/${userId}`, data);
    return res.data.data;
  },
};
