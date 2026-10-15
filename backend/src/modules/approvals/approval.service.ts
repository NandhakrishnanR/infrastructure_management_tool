import { prisma } from '../../config/database.js';
import { AuthUserPayload } from '../../types/index.js';
import { RequestStatus, ApprovalDecision, Role } from '@prisma/client';
import { StatusTransitionService } from '../../services/statusTransitionService.js';
import { enqueueProvisioningJob } from '../../queues/provisioningQueue.js';
import { logger } from '../../utils/logger.js';

export class ApprovalService {
  /**
   * Get all requests pending approval (Admin only)
   */
  public static async getPendingApprovals() {
    return await prisma.infrastructureRequest.findMany({
      where: { status: RequestStatus.PENDING_APPROVAL },
      orderBy: { createdAt: 'desc' },
      include: {
        requester: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  /**
   * Approve an infrastructure request
   */
  public static async approveRequest(
    approver: AuthUserPayload,
    requestId: string,
    comment?: string
  ) {
    if (approver.role !== Role.ADMIN) {
      throw {
        statusCode: 403,
        message: 'Forbidden: Only administrators can approve infrastructure requests',
      };
    }

    const request = await prisma.infrastructureRequest.findUnique({
      where: { id: requestId },
      include: { requester: true },
    });

    if (!request) {
      throw { statusCode: 404, message: 'Infrastructure request not found' };
    }

    // Rule: Requesters cannot approve their own requests
    if (request.requesterId === approver.id) {
      throw {
        statusCode: 403,
        message: 'Separation of duties violation: You cannot approve your own request',
      };
    }

    // Rule: Prevent double approvals or approvals of non-pending requests
    if (request.status !== RequestStatus.PENDING_APPROVAL) {
      throw {
        statusCode: 400,
        message: `Cannot approve request with status '${request.status}'. Only PENDING_APPROVAL requests can be approved.`,
      };
    }

    // Execute approval transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Record approval decision
      const approval = await tx.approval.create({
        data: {
          requestId,
          approverId: approver.id,
          decision: ApprovalDecision.APPROVED,
          comment: comment || 'Approved by administrator',
        },
      });

      // 2. Transition status to APPROVED
      const updatedRequest = await StatusTransitionService.executeTransition(
        tx,
        requestId,
        RequestStatus.APPROVED,
        approver.id,
        comment || 'Approved by administrator'
      );

      // 3. Create initial ProvisioningJob DB record
      const jobRecord = await tx.provisioningJob.create({
        data: {
          requestId,
          status: 'QUEUED',
          stage: 'QUEUED',
          attempts: 1,
        },
      });

      // 4. Append audit log
      await tx.auditLog.create({
        data: {
          actorId: approver.id,
          action: 'REQUEST_APPROVED',
          entityType: 'InfrastructureRequest',
          entityId: requestId,
          metadata: {
            comment: comment || 'Approved by administrator',
            approvalId: approval.id,
            jobId: jobRecord.id,
          },
          result: 'SUCCESS',
        },
      });

      return { updatedRequest, approval, jobRecord };
    });

    // 5. Enqueue background provisioning job in BullMQ
    try {
      await enqueueProvisioningJob(requestId, approver.id);
      logger.info(`Provisioning job enqueued for request ${requestId}`);
    } catch (queueErr: any) {
      logger.error(`Failed to enqueue BullMQ job for request ${requestId}:`, queueErr);
      // Even if queue dispatch had a temporary failure, DB state is safely APPROVED and job can be retried
    }

    return result;
  }

  /**
   * Reject an infrastructure request
   */
  public static async rejectRequest(
    approver: AuthUserPayload,
    requestId: string,
    comment: string
  ) {
    if (approver.role !== Role.ADMIN) {
      throw {
        statusCode: 403,
        message: 'Forbidden: Only administrators can reject infrastructure requests',
      };
    }

    if (!comment || comment.trim().length < 3) {
      throw {
        statusCode: 400,
        message: 'A detailed rejection reason is required (minimum 3 characters)',
      };
    }

    const request = await prisma.infrastructureRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw { statusCode: 404, message: 'Infrastructure request not found' };
    }

    if (request.status !== RequestStatus.PENDING_APPROVAL) {
      throw {
        statusCode: 400,
        message: `Cannot reject request with status '${request.status}'. Only PENDING_APPROVAL requests can be rejected.`,
      };
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Record rejection decision
      const approval = await tx.approval.create({
        data: {
          requestId,
          approverId: approver.id,
          decision: ApprovalDecision.REJECTED,
          comment: comment.trim(),
        },
      });

      // 2. Transition status to REJECTED
      const updatedRequest = await StatusTransitionService.executeTransition(
        tx,
        requestId,
        RequestStatus.REJECTED,
        approver.id,
        comment.trim()
      );

      // 3. Append audit log
      await tx.auditLog.create({
        data: {
          actorId: approver.id,
          action: 'REQUEST_REJECTED',
          entityType: 'InfrastructureRequest',
          entityId: requestId,
          metadata: {
            comment: comment.trim(),
            approvalId: approval.id,
          },
          result: 'SUCCESS',
        },
      });

      return { updatedRequest, approval };
    });
  }
}
