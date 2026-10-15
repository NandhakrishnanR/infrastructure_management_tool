import { prisma } from '../../config/database.js';
import { AuthUserPayload } from '../../types/index.js';
import { JobStatus, RequestStatus, Role, Prisma } from '@prisma/client';
import { enqueueProvisioningJob } from '../../queues/provisioningQueue.js';
import { StatusTransitionService } from '../../services/statusTransitionService.js';
import { logger } from '../../utils/logger.js';

export class JobService {
  public static async listJobs(
    user: AuthUserPayload,
    query: { page?: number; limit?: number; status?: JobStatus; requestId?: string }
  ) {
    const page = query.page ? Math.max(1, query.page) : 1;
    const limit = query.limit ? Math.min(100, Math.max(1, query.limit)) : 10;
    const skip = (page - 1) * limit;

    const where: Prisma.ProvisioningJobWhereInput = {};

    if (user.role === Role.DEVELOPER) {
      where.request = { requesterId: user.id };
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.requestId) {
      where.requestId = query.requestId;
    }

    const [total, jobs] = await Promise.all([
      prisma.provisioningJob.count({ where }),
      prisma.provisioningJob.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          request: {
            select: {
              id: true,
              name: true,
              operatingSystem: true,
              environment: true,
              status: true,
              requester: { select: { id: true, name: true, email: true } },
            },
          },
        },
      }),
    ]);

    return {
      jobs,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  public static async getJobById(user: AuthUserPayload, id: string) {
    const job = await prisma.provisioningJob.findUnique({
      where: { id },
      include: {
        request: {
          include: {
            requester: { select: { id: true, name: true, email: true } },
            virtualMachine: true,
          },
        },
      },
    });

    if (!job) {
      throw { statusCode: 404, message: 'Provisioning job not found' };
    }

    if (user.role === Role.DEVELOPER && job.request.requesterId !== user.id) {
      throw {
        statusCode: 403,
        message: 'Forbidden: You do not have permission to view this job',
      };
    }

    return job;
  }

  public static async retryJob(adminUser: AuthUserPayload, id: string) {
    if (adminUser.role !== Role.ADMIN) {
      throw {
        statusCode: 403,
        message: 'Forbidden: Only administrators can trigger job retries',
      };
    }

    const job = await prisma.provisioningJob.findUnique({
      where: { id },
      include: { request: true },
    });

    if (!job) {
      throw { statusCode: 404, message: 'Provisioning job not found' };
    }

    // Only eligible failed jobs can be retried
    if (job.status !== JobStatus.FAILED) {
      throw {
        statusCode: 400,
        message: `Cannot retry job with status '${job.status}'. Only FAILED jobs can be retried.`,
      };
    }

    // Prepare retry in transaction
    const updatedJob = await prisma.$transaction(async (tx) => {
      // Transition request status back to PROVISIONING
      await StatusTransitionService.executeTransition(
        tx,
        job.requestId,
        RequestStatus.PROVISIONING,
        adminUser.id,
        'Manual retry initiated by administrator'
      );

      const j = await tx.provisioningJob.update({
        where: { id },
        data: {
          status: JobStatus.QUEUED,
          stage: 'QUEUED_FOR_RETRY',
          errorMessage: null,
          logs: `${job.logs || ''}\n[${new Date().toISOString()}] Administrator triggered safe retry.`,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: adminUser.id,
          action: 'JOB_RETRY_TRIGGERED',
          entityType: 'ProvisioningJob',
          entityId: id,
          metadata: { requestId: job.requestId, attempt: job.attempts + 1 },
          result: 'SUCCESS',
        },
      });

      return j;
    });

    // Enqueue to BullMQ
    await enqueueProvisioningJob(job.requestId, adminUser.id, true);
    logger.info(`Retry enqueued for request ${job.requestId}`);

    return updatedJob;
  }
}
