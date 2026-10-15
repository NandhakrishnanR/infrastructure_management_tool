export type Role = 'DEVELOPER' | 'ADMIN';

export type RequestStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'PROVISIONING'
  | 'ACTIVE'
  | 'FAILED'
  | 'CANCELLED'
  | 'DECOMMISSIONED';

export type ApprovalDecision = 'APPROVED' | 'REJECTED';

export type PowerState = 'RUNNING' | 'STOPPED' | 'TERMINATED';

export type JobStatus = 'QUEUED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  quota?: ResourceQuota;
}

export interface ResourceQuota {
  id: string;
  userId: string;
  maxVms: number;
  maxCpu: number;
  maxRamMb: number;
  maxDiskGb: number;
  usage?: {
    usedVms: number;
    usedCpu: number;
    usedRamMb: number;
    usedDiskGb: number;
  };
}

export interface InfrastructureRequest {
  id: string;
  requesterId: string;
  requester?: {
    id: string;
    name: string;
    email: string;
    role?: Role;
  };
  name: string;
  description?: string;
  provider: string;
  operatingSystem: string;
  cpu: number;
  ramMb: number;
  diskGb: number;
  region: string;
  environment: string;
  justification: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  approvals?: Approval[];
  virtualMachine?: VirtualMachine;
  provisioningJobs?: ProvisioningJob[];
  statusHistory?: RequestStatusHistory[];
}

export interface Approval {
  id: string;
  requestId: string;
  approverId: string;
  approver?: {
    id: string;
    name: string;
    email?: string;
  };
  decision: ApprovalDecision;
  comment?: string;
  decidedAt: string;
}

export interface VirtualMachine {
  id: string;
  requestId: string;
  ownerId: string;
  owner?: {
    id: string;
    name: string;
    email: string;
  };
  name: string;
  hostname: string;
  operatingSystem: string;
  provider: string;
  cpu: number;
  ramMb: number;
  diskGb: number;
  region: string;
  environment: string;
  powerState: PowerState;
  provisioningMode: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProvisioningJob {
  id: string;
  requestId: string;
  request?: {
    id: string;
    name: string;
    operatingSystem: string;
    environment: string;
    status: RequestStatus;
    requester?: { id: string; name: string; email: string };
  };
  status: JobStatus;
  attempts: number;
  stage: string;
  startedAt?: string;
  finishedAt?: string;
  errorMessage?: string;
  logs?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RequestStatusHistory {
  id: string;
  requestId: string;
  fromStatus: RequestStatus;
  toStatus: RequestStatus;
  changedById?: string;
  reason?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId?: string;
  actor?: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: any;
  result: string;
  createdAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface DashboardSummary {
  metrics: {
    totalVms: number;
    runningVms: number;
    stoppedVms: number;
    pendingRequests: number;
    approvedRequests: number;
    failedJobs: number;
    totalCpuAllocated: number;
    totalRamMbAllocated: number;
    totalDiskGbAllocated: number;
  };
  recentRequests: InfrastructureRequest[];
  recentAuditLogs: AuditLog[];
}

export interface DashboardCharts {
  vmStatusDistribution: { name: string; value: number }[];
  requestsByStatus: { status: string; count: number }[];
  vmsByEnvironment: { name: string; value: number }[];
}
