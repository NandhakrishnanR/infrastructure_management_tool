import { prisma } from '../../config/database.js';
import { RequestStatus } from '@prisma/client';

export interface UpdateQuotaInput {
  maxVms: number;
  maxCpu: number;
  maxRamMb: number;
  maxDiskGb: number;
}

export class QuotaService {
  public static async listAllUserQuotas() {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        quota: true,
      },
    });

    // Compute live usage for each user
    const usersWithUsage = await Promise.all(
      users.map(async (u) => {
        const activeRequests = await prisma.infrastructureRequest.findMany({
          where: {
            requesterId: u.id,
            status: {
              in: [
                RequestStatus.PENDING_APPROVAL,
                RequestStatus.APPROVED,
                RequestStatus.PROVISIONING,
                RequestStatus.ACTIVE,
              ],
            },
          },
          select: { cpu: true, ramMb: true, diskGb: true },
        });

        const usage = {
          usedVms: activeRequests.length,
          usedCpu: activeRequests.reduce((sum, r) => sum + r.cpu, 0),
          usedRamMb: activeRequests.reduce((sum, r) => sum + r.ramMb, 0),
          usedDiskGb: activeRequests.reduce((sum, r) => sum + r.diskGb, 0),
        };

        return {
          ...u,
          usage,
        };
      })
    );

    return usersWithUsage;
  }

  public static async updateUserQuota(
    adminId: string,
    userId: string,
    input: UpdateQuotaInput
  ) {
    if (input.maxVms <= 0 || input.maxCpu <= 0 || input.maxRamMb <= 0 || input.maxDiskGb <= 0) {
      throw { statusCode: 400, message: 'All quota limits must be positive numbers.' };
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      throw { statusCode: 404, message: 'User not found' };
    }

    const updatedQuota = await prisma.$transaction(async (tx) => {
      const quota = await tx.resourceQuota.upsert({
        where: { userId },
        create: {
          userId,
          maxVms: input.maxVms,
          maxCpu: input.maxCpu,
          maxRamMb: input.maxRamMb,
          maxDiskGb: input.maxDiskGb,
        },
        update: {
          maxVms: input.maxVms,
          maxCpu: input.maxCpu,
          maxRamMb: input.maxRamMb,
          maxDiskGb: input.maxDiskGb,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: adminId,
          action: 'QUOTA_UPDATED',
          entityType: 'ResourceQuota',
          entityId: quota.id,
          metadata: {
            targetUserId: userId,
            targetUserEmail: targetUser.email,
            newQuota: JSON.parse(JSON.stringify(input)),
          },
          result: 'SUCCESS',
        },
      });

      return quota;
    });

    return updatedQuota;
  }
}
