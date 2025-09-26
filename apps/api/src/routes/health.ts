import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';

const router: Router = Router();

router.get('/', (req: Request, res: Response) => {
  logger.info('Health check endpoint accessed');
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

export default router;