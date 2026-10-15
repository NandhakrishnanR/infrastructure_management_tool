import { Request, Response, NextFunction } from 'express';
import { QuotaService } from './quota.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';

export class QuotaController {
  public static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const quotas = await QuotaService.listAllUserQuotas();
      return sendSuccess(res, quotas, 'User resource quotas retrieved');
    } catch (error) {
      next(error);
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await QuotaService.updateUserQuota(
        req.user!.id,
        req.params.userId,
        {
          maxVms: parseInt(req.body.maxVms, 10),
          maxCpu: parseInt(req.body.maxCpu, 10),
          maxRamMb: parseInt(req.body.maxRamMb, 10),
          maxDiskGb: parseInt(req.body.maxDiskGb, 10),
        }
      );
      return sendSuccess(res, updated, 'Resource quota updated successfully');
    } catch (error) {
      next(error);
    }
  }
}
