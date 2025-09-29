import { Router } from 'express';
import healthRouter from './health';
import productsRouter from './api/products-simple';
import aiProvidersRouter from './api/ai-providers';
import backupRouter from './api/backup';
import analyticsRouter from './api/analytics';
import automationRouter from './api/automation';
import migrationsRouter from './migrations';
import authRouter from './api/auth';
import contentStrategiesRouter from './api/content-strategies';

const router: Router = Router();

router.use('/health', healthRouter);
router.use('/products', productsRouter);
router.use('/ai-providers', aiProvidersRouter);
router.use('/backup', backupRouter);
router.use('/analytics', analyticsRouter);
router.use('/automation', automationRouter);
router.use('/migrations', migrationsRouter);
router.use('/auth', authRouter);
router.use('/content-strategies', contentStrategiesRouter);

export default router;