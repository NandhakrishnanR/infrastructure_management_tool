import { RequestStatus, PrismaClient } from '@prisma/client';

export class StatusTransitionError extends Error {
  constructor(public fromStatus: RequestStatus, public toStatus: RequestStatus, reason?: string) {
    super(reason || `Invalid status transition from ${fromStatus} to ${toStatus}`);
    this.name = 'StatusTransitionError';
  }
}

/**
 * Valid state transitions mapping:
 * Each key defines the permitted target states it can transition into.
 */
export const ALLOWED_STATUS_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  [RequestStatus.DRAFT]: [
    RequestStatus.PENDING_APPROVAL,
    RequestStatus.CANCELLED,
  ],
  [RequestStatus.PENDING_APPROVAL]: [
    RequestStatus.APPROVED,
    RequestStatus.REJECTED,
    RequestStatus.CANCELLED,
  ],
  [RequestStatus.APPROVED]: [
    RequestStatus.PROVISIONING,
    RequestStatus.FAILED,
  ],
  [RequestStatus.PROVISIONING]: [
    RequestStatus.ACTIVE,
    RequestStatus.FAILED,
  ],
  [RequestStatus.ACTIVE]: [
    RequestStatus.DECOMMISSIONED,
  ],
  [RequestStatus.REJECTED]: [
    // Terminal state - cannot be approved or transitioned
  ],
  [RequestStatus.FAILED]: [
    // Eligible for retry -> re-enters PROVISIONING
    RequestStatus.PROVISIONING,
    RequestStatus.CANCELLED,
  ],
  [RequestStatus.CANCELLED]: [
    // Terminal state
  ],
  [RequestStatus.DECOMMISSIONED]: [
    // Terminal state
  ],
};

export class StatusTransitionService {
  /**
   * Validates if a transition from current to target status is permitted.
   */
  public static canTransition(from: RequestStatus, to: RequestStatus): boolean {
    const allowedTargets = ALLOWED_STATUS_TRANSITIONS[from] || [];
    return allowedTargets.includes(to);
  }

  /**
   * Asserts validity or throws a StatusTransitionError
   */
  public static validateTransition(from: RequestStatus, to: RequestStatus): void {
    if (!this.canTransition(from, to)) {
      throw new StatusTransitionError(from, to);
    }
  }

  /**
   * Executes a status transition within a Prisma transaction, recording the transition in history.
   */
  public static async executeTransition(
    prismaTx: any,
    requestId: string,
    targetStatus: RequestStatus,
    changedById?: string | null,
    reason?: string
  ) {
    const request = await prismaTx.infrastructureRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new Error(`Request with ID ${requestId} not found`);
    }

    this.validateTransition(request.status, targetStatus);

    const updated = await prismaTx.infrastructureRequest.update({
      where: { id: requestId },
      data: { status: targetStatus },
    });

    await prismaTx.requestStatusHistory.create({
      data: {
        requestId,
        fromStatus: request.status,
        toStatus: targetStatus,
        changedById: changedById || null,
        reason: reason || null,
      },
    });

    return updated;
  }
}
