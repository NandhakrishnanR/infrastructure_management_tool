import { Router } from 'express';
import { DashboardController } from './dashboard.controller.js';
import { authenticate } from '../../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/summary', DashboardController.getSummary);
router.get('/charts', DashboardController.getCharts);

export const dashboardRoutes = router;
