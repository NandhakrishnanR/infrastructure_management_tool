import { Router } from 'express';
import { RequestController } from './request.controller.js';
import { authenticate } from '../../middleware/authMiddleware.js';
import { validateRequest } from '../../middleware/validationMiddleware.js';
import { createRequestSchema, queryRequestsSchema } from './request.validation.js';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  validateRequest({ body: createRequestSchema }),
  RequestController.create
);

router.get(
  '/',
  validateRequest({ query: queryRequestsSchema }),
  RequestController.list
);

router.get('/:id', RequestController.getById);

router.post('/:id/cancel', RequestController.cancel);

export const requestRoutes = router;
