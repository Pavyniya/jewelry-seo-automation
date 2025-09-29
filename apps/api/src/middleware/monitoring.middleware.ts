import { Request, Response, NextFunction } from 'express';
import { monitoring } from '../monitoring/monitoring';

export const monitoringMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  // Override res.end to track response time
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any) {
    const duration = Date.now() - start;
    monitoring.recordHttpRequest(
      req.method,
      req.route?.path || req.path,
      res.statusCode,
      duration
    );
    originalEnd.call(this, chunk, encoding);
  };

  next();
};

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  monitoring.recordError('application', req.path);

  // Log error
  console.error(err.stack);

  // Send error response
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};