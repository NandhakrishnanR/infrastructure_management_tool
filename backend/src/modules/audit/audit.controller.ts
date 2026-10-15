import { Request, Response, NextFunction } from 'express';
import { AuditService } from './audit.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';

export class AuditController {
  public static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 15;

      const result = await AuditService.listAuditLogs({
        page,
        limit,
        search: req.query.search as string,
        action: req.query.action as string,
        entityType: req.query.entityType as string,
        actorId: req.query.actorId as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      });

      return sendSuccess(res, result.logs, 'Audit logs retrieved', 200, result.meta);
    } catch (error) {
      next(error);
    }
  }
}
