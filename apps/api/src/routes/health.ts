import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';
import {
  getDatabaseHealth,
  getSystemHealth,
  readyCheck,
  liveCheck,
  healthCheckMiddleware
} from '../utils/healthCheck';

const router: Router = Router();

// Apply middleware to all health routes
router.use(healthCheckMiddleware);

// Basic health check
router.get('/', (req: Request, res: Response) => {
  logger.info('Basic health check endpoint accessed');
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

// Detailed database health check
router.get('/database', getDatabaseHealth);

// Full system health check
router.get('/system', getSystemHealth);

// Kubernetes liveness probe
router.get('/live', liveCheck);

// Kubernetes readiness probe
router.get('/ready', readyCheck);

export default router;