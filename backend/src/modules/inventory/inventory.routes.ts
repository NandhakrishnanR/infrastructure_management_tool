import { Router } from 'express';
import { InventoryController } from './inventory.controller.js';
import { authenticate } from '../../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/', InventoryController.list);
router.get('/:id', InventoryController.getById);
router.post('/:id/power', InventoryController.power);

export const inventoryRoutes = router;
