import { Request, Response, NextFunction } from 'express';
import { ApprovalService } from './approval.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';

export class ApprovalController {
  public static async getPending(req: Request, res: Response, next: NextFunction) {
    try {
      const pending = await ApprovalService.getPendingApprovals();
      return sendSuccess(res, pending, 'Pending approvals retrieved');
    } catch (error) {
      next(error);
    }
  }

  public static async approve(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ApprovalService.approveRequest(
        req.user!,
        req.params.id,
        req.body.comment
      );
      return sendSuccess(res, result, 'Request approved and enqueued for provisioning');
    } catch (error) {
      next(error);
    }
  }

  public static async reject(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ApprovalService.rejectRequest(
        req.user!,
        req.params.id,
        req.body.comment
      );
      return sendSuccess(res, result, 'Request rejected successfully');
    } catch (error) {
      next(error);
    }
  }
}
