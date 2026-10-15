import { Request, Response, NextFunction } from 'express';
import { RequestService } from './request.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';

export class RequestController {
  public static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const request = await RequestService.createRequest(req.user!, req.body);
      return sendSuccess(res, request, 'Infrastructure request created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  public static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await RequestService.listRequests(req.user!, req.query as any);
      return sendSuccess(res, result.requests, 'Requests retrieved successfully', 200, result.meta);
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const request = await RequestService.getRequestById(req.user!, req.params.id);
      return sendSuccess(res, request, 'Request details retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await RequestService.cancelRequest(req.user!, req.params.id, req.body.reason);
      return sendSuccess(res, updated, 'Request cancelled successfully');
    } catch (error) {
      next(error);
    }
  }
}
