import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { database } from './utils/database';
import { validateShopifyConfig } from './config/shopify';
import { aiService } from './services/aiService';
import { aiHealthMonitor } from './services/aiHealthMonitor';

const app: Express = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });
  next();
});

// Basic health check endpoint
app.get('/health', (req, res) => {
  logger.info('Health check endpoint accessed');
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: config.env,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: 'disconnected (troubleshooting)',
    shopify: 'configured',
  });
});

// API routes
import routes from './routes';
app.use('/api/v1', routes);

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = config.port;

async function startServer() {
  try {
    // Validate Shopify configuration
    const shopifyValidation = validateShopifyConfig();
    if (!shopifyValidation.valid) {
      logger.error('Invalid Shopify configuration:', shopifyValidation.error);
      process.exit(1);
    }

    // Connect to database
    await database.connect();
    // Skip AI service initialization for now to focus on fixing the main issues
    // await aiService.init();

    // Start AI provider health monitoring
    aiHealthMonitor.startMonitoring(30000); // Check every 30 seconds
    logger.info('AI provider health monitoring started');

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${config.env}`);
      logger.info(`CORS origin: ${config.cors.origin}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`API Base: http://localhost:${PORT}/api/v1`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await database.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await database.close();
  process.exit(0);
});

// Handle uncaught exceptions and prevent server crashes
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', { error });
  // Don't exit the process for constraint errors - just log and continue
  if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
    logger.warn('Constraint error occurred, server continuing to run');
    return;
  }
  // For other errors, log the error but continue running
  logger.error('Non-database error occurred, server continuing to run');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🔥 UNHANDLED REJECTION:');
  console.error('Reason:', reason);
  console.error('Promise:', promise);
  console.error('Stack:', reason instanceof Error ? reason.stack : 'No stack trace');
  console.error('Type:', typeof reason);
  console.error('Is Error:', reason instanceof Error);
  if (reason instanceof Error) {
    console.error('Error Message:', reason.message);
    console.error('Error Name:', reason.name);
  }
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process for database or constraint errors - just log and continue
  if (reason instanceof Error && (
    reason.message.includes('UNIQUE constraint failed') ||
    reason.message.includes('SQLITE') ||
    reason.message.includes('database') ||
    reason.message.includes('Database')
  )) {
    logger.warn('Database error occurred in promise, server continuing to run');
    return;
  }
  // For other errors, log the error but continue running
  logger.error('Non-database error occurred in promise, server continuing to run');
});

startServer();

export default app;