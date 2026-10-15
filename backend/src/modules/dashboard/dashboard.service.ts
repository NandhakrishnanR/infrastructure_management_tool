import { prisma } from '../../config/database.js';
import { AuthUserPayload } from '../../types/index.js';
import { Role, PowerState, RequestStatus, JobStatus, Prisma } from '@prisma/client';

export class DashboardService {
  public static async getSummary(user: AuthUserPayload) {
    const isDev = user.role === Role.DEVELOPER;

    const vmWhere: Prisma.VirtualMachineWhereInput = isDev ? { ownerId: user.id } : {};
    const reqWhere: Prisma.InfrastructureRequestWhereInput = isDev ? { requesterId: user.id } : {};
    const jobWhere: Prisma.ProvisioningJobWhereInput = isDev ? { request: { requesterId: user.id } } : {};
    const auditWhere: Prisma.AuditLogWhereInput = isDev ? { actorId: user.id } : {};

    const [
      totalVms,
      runningVms,
      stoppedVms,
      pendingRequests,
      approvedRequests,
      failedJobs,
      vmsWithSpecs,
      recentRequests,
      recentAuditLogs,
    ] = await Promise.all([
      prisma.virtualMachine.count({ where: vmWhere }),
      prisma.virtualMachine.count({ where: { ...vmWhere, powerState: PowerState.RUNNING } }),
      prisma.virtualMachine.count({ where: { ...vmWhere, powerState: PowerState.STOPPED } }),
      prisma.infrastructureRequest.count({ where: { ...reqWhere, status: RequestStatus.PENDING_APPROVAL } }),
      prisma.infrastructureRequest.count({ where: { ...reqWhere, status: RequestStatus.APPROVED } }),
      prisma.provisioningJob.count({ where: { ...jobWhere, status: JobStatus.FAILED } }),
      prisma.virtualMachine.findMany({
        where: vmWhere,
        select: { cpu: true, ramMb: true, diskGb: true },
      }),
      prisma.infrastructureRequest.findMany({
        where: reqWhere,
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { requester: { select: { id: true, name: true } } },
      }),
      prisma.auditLog.findMany({
        where: auditWhere,
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { actor: { select: { id: true, name: true, email: true } } },
      }),
    ]);

    const totalCpuAllocated = vmsWithSpecs.reduce((acc, vm) => acc + vm.cpu, 0);
    const totalRamMbAllocated = vmsWithSpecs.reduce((acc, vm) => acc + vm.ramMb, 0);
    const totalDiskGbAllocated = vmsWithSpecs.reduce((acc, vm) => acc + vm.diskGb, 0);

    return {
      metrics: {
        totalVms,
        runningVms,
        stoppedVms,
        pendingRequests,
        approvedRequests,
        failedJobs,
        totalCpuAllocated,
        totalRamMbAllocated,
        totalDiskGbAllocated,
      },
      recentRequests,
      recentAuditLogs,
    };
  }

  public static async getCharts(user: AuthUserPayload) {
    const isDev = user.role === Role.DEVELOPER;
    const vmWhere: Prisma.VirtualMachineWhereInput = isDev ? { ownerId: user.id } : {};
    const reqWhere: Prisma.InfrastructureRequestWhereInput = isDev ? { requesterId: user.id } : {};

    const [vms, requests] = await Promise.all([
      prisma.virtualMachine.findMany({
        where: vmWhere,
        select: { powerState: true, environment: true, region: true },
      }),
      prisma.infrastructureRequest.findMany({
        where: reqWhere,
        select: { status: true, environment: true },
      }),
    ]);

    // VM Status breakdown
    const vmStatusMap: Record<string, number> = {};
    vms.forEach((vm) => {
      vmStatusMap[vm.powerState] = (vmStatusMap[vm.powerState] || 0) + 1;
    });
    const vmStatusDistribution = Object.entries(vmStatusMap).map(([name, value]) => ({
      name,
      value,
    }));

    // Requests by status breakdown
    const reqStatusMap: Record<string, number> = {};
    requests.forEach((r) => {
      reqStatusMap[r.status] = (reqStatusMap[r.status] || 0) + 1;
    });
    const requestsByStatus = Object.entries(reqStatusMap).map(([status, count]) => ({
      status,
      count,
    }));

    // Environment breakdown
    const envMap: Record<string, number> = {};
    vms.forEach((vm) => {
      envMap[vm.environment] = (envMap[vm.environment] || 0) + 1;
    });
    const vmsByEnvironment = Object.entries(envMap).map(([name, value]) => ({
      name,
      value,
    }));

    return {
      vmStatusDistribution,
      requestsByStatus,
      vmsByEnvironment,
    };
  }
}
