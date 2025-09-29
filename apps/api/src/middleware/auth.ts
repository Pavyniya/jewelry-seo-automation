import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // For development/testing, skip actual authentication
  // In production, you would validate JWT tokens here
  req.user = {
    id: 'dev-user-id',
    email: 'dev@example.com',
    role: 'admin'
  };
  next();
};