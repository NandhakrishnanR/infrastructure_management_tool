import { Request, Response, NextFunction } from 'express';
import { InventoryService } from './inventory.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';

export class InventoryController {
  public static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const result = await InventoryService.listInventory(req.user!, {
        page,
        limit,
        search: req.query.search as string,
        powerState: req.query.powerState as any,
        region: req.query.region as string,
        environment: req.query.environment as string,
        ownerId: req.query.ownerId as string,
      });

      return sendSuccess(res, result.vms, 'VM inventory retrieved', 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const vm = await InventoryService.getVmById(req.user!, req.params.id);
      return sendSuccess(res, vm, 'VM details retrieved');
    } catch (error) {
      next(error);
    }
  }

  public static async power(req: Request, res: Response, next: NextFunction) {
    try {
      const action = req.body.action as 'START' | 'STOP' | 'RESTART';
      if (!['START', 'STOP', 'RESTART'].includes(action)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid power action. Allowed values: START, STOP, RESTART',
        });
      }

      const updated = await InventoryService.togglePower(req.user!, req.params.id, action);
      return sendSuccess(res, updated, `VM power state changed to ${updated.powerState} (Simulated Demo Action)`);
    } catch (error) {
      next(error);
    }
  }
}
