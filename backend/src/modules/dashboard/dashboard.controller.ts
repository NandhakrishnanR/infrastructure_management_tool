import { Request, Response, NextFunction } from 'express';
import { DashboardService } from './dashboard.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';

export class DashboardController {
  public static async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const summary = await DashboardService.getSummary(req.user!);
      return sendSuccess(res, summary, 'Dashboard summary retrieved');
    } catch (error) {
      next(error);
    }
  }

  public static async getCharts(req: Request, res: Response, next: NextFunction) {
    try {
      const charts = await DashboardService.getCharts(req.user!);
      return sendSuccess(res, charts, 'Dashboard chart metrics retrieved');
    } catch (error) {
      next(error);
    }
  }
}
