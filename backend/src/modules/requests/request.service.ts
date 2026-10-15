import { prisma } from '../../config/database.js';
import { CreateRequestInput, QueryRequestsInput } from './request.validation.js';
import { AuthUserPayload } from '../../types/index.js';
import { RequestStatus, Role, Prisma } from '@prisma/client';
import { StatusTransitionService } from '../../services/statusTransitionService.js';

export class RequestService {
  /**
   * Check if user has sufficient quota for the requested resources
   */
  public static async validateUserQuota(
    userId: string,
    requested: { cpu: number; ramMb: number; diskGb: number }
  ) {
    let quota = await prisma.resourceQuota.findUnique({
      where: { userId },
    });

    if (!quota) {
      quota = await prisma.resourceQuota.create({
        data: {
          userId,
          maxVms: 5,
          maxCpu: 16,
          maxRamMb: 32768,
          maxDiskGb: 500,
        },
      });
    }

    // Calculate currently committed resources (Pending, Approved, Provisioning, Active)
    const activeRequests = await prisma.infrastructureRequest.findMany({
      where: {
        requesterId: userId,
        status: {
          in: [
            RequestStatus.PENDING_APPROVAL,
            RequestStatus.APPROVED,
            RequestStatus.PROVISIONING,
            RequestStatus.ACTIVE,
          ],
        },
      },
      select: {
        cpu: true,
        ramMb: true,
        diskGb: true,
      },
    });

    const currentVms = activeRequests.length;
    const currentCpu = activeRequests.reduce((sum, r) => sum + r.cpu, 0);
    const currentRam = activeRequests.reduce((sum, r) => sum + r.ramMb, 0);
    const currentDisk = activeRequests.reduce((sum, r) => sum + r.diskGb, 0);

    if (currentVms + 1 > quota.maxVms) {
      throw {
        statusCode: 400,
        message: `Quota limit exceeded: Maximum allowed VMs is ${quota.maxVms}. You currently have ${currentVms} active/pending requests.`,
      };
    }

    if (currentCpu + requested.cpu > quota.maxCpu) {
      throw {
        statusCode: 400,
        message: `CPU quota limit exceeded: Maximum allowed CPU cores is ${quota.maxCpu}. You are currently using ${currentCpu} cores; requesting +${requested.cpu} exceeds your limit.`,
      };
    }

    if (currentRam + requested.ramMb > quota.maxRamMb) {
      throw {
        statusCode: 400,
        message: `RAM quota limit exceeded: Maximum allowed RAM is ${quota.maxRamMb} MB. You are currently using ${currentRam} MB; requesting +${requested.ramMb} MB exceeds your limit.`,
      };
    }

    if (currentDisk + requested.diskGb > quota.maxDiskGb) {
      throw {
        statusCode: 400,
        message: `Disk quota limit exceeded: Maximum allowed Disk is ${quota.maxDiskGb} GB. You are currently using ${currentDisk} GB; requesting +${requested.diskGb} GB exceeds your limit.`,
      };
    }
  }

  /**
   * Create a new infrastructure request
   */
  public static async createRequest(user: AuthUserPayload, input: CreateRequestInput) {
    // Validate quota first
    await this.validateUserQuota(user.id, {
      cpu: input.cpu,
      ramMb: input.ramMb,
      diskGb: input.diskGb,
    });

    return await prisma.$transaction(async (tx) => {
      const request = await tx.infrastructureRequest.create({
        data: {
          requesterId: user.id,
          name: input.name,
          description: input.description,
          provider: input.provider,
          operatingSystem: input.operatingSystem,
          cpu: input.cpu,
          ramMb: input.ramMb,
          diskGb: input.diskGb,
          region: input.region,
          environment: input.environment,
          justification: input.justification,
          status: RequestStatus.PENDING_APPROVAL,
          statusHistory: {
            create: {
              fromStatus: RequestStatus.DRAFT,
              toStatus: RequestStatus.PENDING_APPROVAL,
              changedById: user.id,
              reason: 'Initial submission for administrative approval',
            },
          },
        },
      });

      // Append-only audit log
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: 'REQUEST_CREATED',
          entityType: 'InfrastructureRequest',
          entityId: request.id,
          metadata: {
            name: request.name,
            cpu: request.cpu,
            ramMb: request.ramMb,
            diskGb: request.diskGb,
            environment: request.environment,
            provider: request.provider,
          },
          result: 'SUCCESS',
        },
      });

      return request;
    });
  }

  /**
   * List requests with role-based filtering, search, sorting, and pagination
   */
  public static async listRequests(user: AuthUserPayload, query: QueryRequestsInput) {
    const { page, limit, search, status, requesterId, provider, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.InfrastructureRequestWhereInput = {};

    // Developers can strictly only view their own requests
    if (user.role === Role.DEVELOPER) {
      where.requesterId = user.id;
    } else if (requesterId) {
      where.requesterId = requesterId;
    }

    if (status) {
      where.status = status;
    }

    if (provider) {
      where.provider = provider;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { description: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { justification: { contains: search, mode: Prisma.QueryMode.insensitive } },
        ...(user.role === Role.ADMIN
          ? [{ requester: { name: { contains: search, mode: Prisma.QueryMode.insensitive } } }]
          : []),
      ];
    }

    const [total, requests] = await Promise.all([
      prisma.infrastructureRequest.count({ where }),
      prisma.infrastructureRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          requester: {
            select: { id: true, name: true, email: true },
          },
          approvals: {
            include: { approver: { select: { id: true, name: true } } },
          },
          virtualMachine: {
            select: { id: true, hostname: true, powerState: true },
          },
          provisioningJobs: {
            select: { id: true, status: true, stage: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
    ]);

    return {
      requests,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single request details with authorization check
   */
  public static async getRequestById(user: AuthUserPayload, id: string) {
    const request = await prisma.infrastructureRequest.findUnique({
      where: { id },
      include: {
        requester: {
          select: { id: true, name: true, email: true, role: true },
        },
        approvals: {
          include: { approver: { select: { id: true, name: true, email: true } } },
          orderBy: { decidedAt: 'desc' },
        },
        virtualMachine: true,
        provisioningJobs: {
          orderBy: { createdAt: 'desc' },
        },
        statusHistory: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!request) {
      throw { statusCode: 404, message: 'Infrastructure request not found' };
    }

    // Strict Authorization check
    if (user.role === Role.DEVELOPER && request.requesterId !== user.id) {
      throw {
        statusCode: 403,
        message: 'Forbidden: You are not authorized to view this request',
      };
    }

    return request;
  }

  /**
   * Cancel a pending request
   */
  public static async cancelRequest(user: AuthUserPayload, id: string, reason?: string) {
    const request = await prisma.infrastructureRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw { statusCode: 404, message: 'Infrastructure request not found' };
    }

    if (user.role === Role.DEVELOPER && request.requesterId !== user.id) {
      throw {
        statusCode: 403,
        message: 'Forbidden: You cannot cancel another user\'s request',
      };
    }

    if (request.status !== RequestStatus.PENDING_APPROVAL && request.status !== RequestStatus.DRAFT) {
      throw {
        statusCode: 400,
        message: `Cannot cancel a request that is in ${request.status} status. Only pending or draft requests can be cancelled.`,
      };
    }

    return await prisma.$transaction(async (tx) => {
      const updated = await StatusTransitionService.executeTransition(
        tx,
        id,
        RequestStatus.CANCELLED,
        user.id,
        reason || 'Cancelled by requester'
      );

      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: 'REQUEST_CANCELLED',
          entityType: 'InfrastructureRequest',
          entityId: id,
          metadata: { reason: reason || 'Cancelled by requester' },
          result: 'SUCCESS',
        },
      });

      return updated;
    });
  }
}
