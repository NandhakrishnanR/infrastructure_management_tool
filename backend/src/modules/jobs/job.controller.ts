import { Request, Response, NextFunction } from 'express';
import { JobService } from './job.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';

export class JobController {
  public static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const result = await JobService.listJobs(req.user!, {
        page,
        limit,
        status: req.query.status as any,
        requestId: req.query.requestId as string,
      });

      return sendSuccess(res, result.jobs, 'Provisioning jobs retrieved', 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const job = await JobService.getJobById(req.user!, req.params.id);
      return sendSuccess(res, job, 'Job details retrieved');
    } catch (error) {
      next(error);
    }
  }

  public static async retry(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await JobService.retryJob(req.user!, req.params.id);
      return sendSuccess(res, result, 'Provisioning job retry enqueued successfully');
    } catch (error) {
      next(error);
    }
  }
}
