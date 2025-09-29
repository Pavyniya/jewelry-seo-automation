import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import authRouter from './routes/api/auth';
import productsRouter from './routes/api/products-simple';
import analyticsRouter from './routes/api/analytics';

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

// API routes - include auth, products, and analytics for basic functionality
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/products', productsRouter);
app.use('/api/v1/analytics', analyticsRouter);

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = config.port;

async function startServer() {
  try {
    // Skip problematic services for now
    logger.warn('Starting simplified server without AI service and database');

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${config.env}`);
      logger.info(`CORS origin: ${config.cors.origin}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`API Base: http://localhost:${PORT}/api/v1`);
      logger.info(`Auth endpoints available at: http://localhost:${PORT}/api/v1/auth`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();

export default app;