import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { authenticate } from '../../middleware/authMiddleware.js';
import { validateRequest } from '../../middleware/validationMiddleware.js';
import { loginRateLimiter } from '../../middleware/rateLimiter.js';
import { loginSchema } from './auth.validation.js';

const router = Router();

router.post(
  '/login',
  loginRateLimiter,
  validateRequest({ body: loginSchema }),
  AuthController.login
);

router.post('/logout', authenticate, AuthController.logout);

router.get('/me', authenticate, AuthController.me);

export const authRoutes = router;
