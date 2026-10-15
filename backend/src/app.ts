import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';

// Route imports
import { authRoutes } from './modules/auth/auth.routes.js';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes.js';
import { requestRoutes } from './modules/requests/request.routes.js';
import { approvalRoutes } from './modules/approvals/approval.routes.js';
import { inventoryRoutes } from './modules/inventory/inventory.routes.js';
import { jobRoutes } from './modules/jobs/job.routes.js';
import { auditRoutes } from './modules/audit/audit.routes.js';
import { quotaRoutes } from './modules/quotas/quota.routes.js';

export const app = express();

// Trust proxy for secure cookies and rate limiting
app.set('trust proxy', 1);

// Security and utility middleware
app.use(helmet());
app.use(
  cors({
    origin: [env.FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Global API rate limiting
app.use('/api/', apiRateLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    system: 'InfraPilot REST API',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'healthy',
    system: 'InfraPilot REST API',
    version: '1.0.0',
    demoMode: env.DEMO_MODE,
    timestamp: new Date().toISOString(),
  });
});

// REST API v1 Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/requests', requestRoutes);
app.use('/api/v1/approvals', approvalRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/jobs', jobRoutes);
app.use('/api/v1/audit-logs', auditRoutes);
app.use('/api/v1/quotas', quotaRoutes);

// Fallback 404 for undefined API endpoints
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API route ${req.method} ${req.originalUrl} not found`,
  });
});

// Centralized error handling
app.use(errorHandler);
