import { Router, Request, Response } from 'express';
import { migrationManager } from '../utils/migrations';
import { logger } from '../utils/logger';

const router: Router = Router();

// Get migration status
router.get('/status', async (req: Request, res: Response) => {
  try {
    const status = await migrationManager.getStatus();
    res.json({
      success: true,
      ...status,
    });
  } catch (error) {
    logger.error('Failed to get migration status:', error);
    res.status(500).json({
      success: false,
      error: String(error),
    });
  }
});

// Run pending migrations
router.post('/run', async (req: Request, res: Response) => {
  try {
    const { version } = req.body;

    logger.info(`Running migrations ${version ? `to version ${version}` : 'to latest'}`);

    const results = await migrationManager.migrateTo(version);

    res.json({
      success: true,
      message: `Successfully ran ${results.length} migrations`,
      migrations: results,
    });
  } catch (error) {
    logger.error('Migration failed:', error);
    res.status(500).json({
      success: false,
      error: String(error),
    });
  }
});

// Rollback migrations
router.post('/rollback', async (req: Request, res: Response) => {
  try {
    const { version } = req.body;

    if (!version) {
      return res.status(400).json({
        success: false,
        error: 'Version is required for rollback',
      });
    }

    logger.info(`Rolling back migrations to version ${version}`);

    await migrationManager.rollbackTo(version);

    res.json({
      success: true,
      message: `Successfully rolled back to version ${version}`,
    });
  } catch (error) {
    logger.error('Rollback failed:', error);
    res.status(500).json({
      success: false,
      error: String(error),
    });
  }
});

// List all migrations
router.get('/list', async (req: Request, res: Response) => {
  try {
    const [executed, pending] = await Promise.all([
      migrationManager.getExecutedMigrations(),
      migrationManager.getPendingMigrations(),
    ]);

    res.json({
      success: true,
      executed,
      pending,
      total: executed.length + pending.length,
    });
  } catch (error) {
    logger.error('Failed to list migrations:', error);
    res.status(500).json({
      success: false,
      error: String(error),
    });
  }
});

// Initialize migration system
router.post('/initialize', async (req: Request, res: Response) => {
  try {
    await migrationManager.initialize();

    res.json({
      success: true,
      message: 'Migration system initialized successfully',
    });
  } catch (error) {
    logger.error('Failed to initialize migration system:', error);
    res.status(500).json({
      success: false,
      error: String(error),
    });
  }
});

export default router;