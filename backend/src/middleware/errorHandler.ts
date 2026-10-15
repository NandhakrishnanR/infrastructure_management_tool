import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { StatusTransitionError } from '../services/statusTransitionService.js';
import { logger } from '../utils/logger.js';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(`Unhandled error during ${req.method} ${req.originalUrl}:`, err);

  // Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // Status transition error
  if (err instanceof StatusTransitionError) {
    return res.status(400).json({
      success: false,
      message: err.message,
      code: 'INVALID_STATUS_TRANSITION',
    });
  }

  // Prisma unique constraint violation (P2002)
  if (err?.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: 'A record with this unique attribute already exists.',
    });
  }

  // Known custom business errors with statusCode
  if (err?.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message || 'Error occurred',
      errors: err.errors,
    });
  }

  // Generic server error (do not leak internal stack traces)
  const isDev = process.env.NODE_ENV === 'development';
  return res.status(500).json({
    success: false,
    message: isDev ? err.message || 'Internal Server Error' : 'Internal Server Error',
    ...(isDev ? { stack: err.stack } : {}),
  });
};
