import { Router } from 'express';
import { JobController } from './job.controller.js';
import { authenticate } from '../../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/', JobController.list);
router.get('/:id', JobController.getById);
router.post('/:id/retry', JobController.retry);

export const jobRoutes = router;
