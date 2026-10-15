import { Router } from 'express';
import { QuotaController } from './quota.controller.js';
import { authenticate } from '../../middleware/authMiddleware.js';
import { requireRole } from '../../middleware/roleMiddleware.js';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);
router.use(requireRole(Role.ADMIN));

router.get('/', QuotaController.list);
router.put('/:userId', QuotaController.update);

export const quotaRoutes = router;
