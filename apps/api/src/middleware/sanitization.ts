import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { createError } from './errorHandler';
import { logger } from '../utils/logger';

// Sanitization utilities
export const sanitizeString = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/[{}]/g, '') // Remove potential template literals
    .replace(/[[\]]/g, '') // Remove potential array access patterns
    .replace(/["']/g, '') // Remove quotes to prevent injection
    .substring(0, 10000); // Limit length
};

export const sanitizeHtml = (input: string): string => {
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '') // Remove object tags
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '') // Remove embed tags
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/javascript:/gi, '') // Remove javascript protocol
    .substring(0, 50000); // Limit length for HTML content
};

export const sanitizeNumeric = (input: any): number => {
  const num = Number(input);
  return isNaN(num) ? 0 : Math.max(0, Math.min(num, 999999999.99));
};

export const sanitizeInteger = (input: any): number => {
  const num = parseInt(input);
  return isNaN(num) ? 0 : Math.max(0, Math.min(num, 2147483647));
};

export const sanitizeBoolean = (input: any): boolean => {
  if (typeof input === 'boolean') return input;
  if (typeof input === 'string') {
    return input.toLowerCase() === 'true' || input === '1';
  }
  return Boolean(input);
};

export const sanitizeArray = (input: any): any[] => {
  if (Array.isArray(input)) return input;
  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      return Array.isArray(parsed) ? parsed : [input];
    } catch {
      return [input];
    }
  }
  return input ? [input] : [];
};

export const sanitizeObject = (input: any): any => {
  if (typeof input === 'object' && input !== null) return input;
  if (typeof input === 'string') {
    try {
      return JSON.parse(input);
    } catch {
      return {};
    }
  }
  return {};
};

// Enhanced validation middleware with sanitization
export const validateAndSanitizeRequest = (schema: {
  body?: z.ZodSchema;
  params?: z.ZodSchema;
  query?: z.ZodSchema;
  sanitizationRules?: {
    body?: Record<string, (value: any) => any>;
    params?: Record<string, (value: any) => any>;
    query?: Record<string, (value: any) => any>;
  };
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Apply sanitization before validation
      if (schema.sanitizationRules?.body) {
        for (const [field, sanitizer] of Object.entries(schema.sanitizationRules.body)) {
          if (req.body[field] !== undefined) {
            req.body[field] = sanitizer(req.body[field]);
          }
        }
      }

      if (schema.sanitizationRules?.params) {
        for (const [field, sanitizer] of Object.entries(schema.sanitizationRules.params)) {
          if (req.params[field] !== undefined) {
            req.params[field] = sanitizer(req.params[field]);
          }
        }
      }

      if (schema.sanitizationRules?.query) {
        for (const [field, sanitizer] of Object.entries(schema.sanitizationRules.query)) {
          if (req.query[field] !== undefined) {
            req.query[field] = sanitizer(req.query[field]);
          }
        }
      }

      // Validate after sanitization
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }
      if (schema.params) {
        req.params = schema.params.parse(req.params);
      }
      if (schema.query) {
        req.query = schema.query.parse(req.query);
      }

      // Log validation for debugging
      logger.debug('Request validated and sanitized', {
        path: req.path,
        method: req.method,
        hasBody: !!req.body,
        hasParams: !!Object.keys(req.params).length,
        hasQuery: !!Object.keys(req.query).length
      });

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
        logger.warn('Validation failed', {
          path: req.path,
          method: req.method,
          errors: error.errors,
          body: req.body,
          params: req.params,
          query: req.query
        });
        next(createError(`Validation failed: ${errorMessage}`, 400));
      } else {
        logger.error('Unexpected validation error', {
          path: req.path,
          method: req.method,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        next(error);
      }
    }
  };
};

// Common validation schemas with sanitization rules
export const commonValidationSchemas = {
  productId: {
    params: z.object({
      id: z.string().min(1, 'Product ID is required').max(100, 'Product ID too long')
    }),
    sanitizationRules: {
      params: {
        id: sanitizeString
      }
    }
  },

  pagination: {
    query: z.object({
      page: z.string().regex(/^\d+$/).transform(Number).refine(n => n > 0, 'Page must be greater than 0').optional().default('1'),
      limit: z.string().regex(/^\d+$/).transform(Number).refine(n => n > 0 && n <= 100, 'Limit must be between 1 and 100').optional().default('20'),
      sortBy: z.string().optional(),
      sortOrder: z.enum(['asc', 'desc']).optional().default('asc')
    }),
    sanitizationRules: {
      query: {
        page: sanitizeInteger,
        limit: sanitizeInteger,
        sortBy: sanitizeString,
        sortOrder: (value: string) => ['asc', 'desc'].includes(value) ? value : 'asc'
      }
    }
  },

  searchQuery: {
    query: z.object({
      q: z.string().min(1, 'Search query is required').max(200, 'Search query too long'),
      vendor: z.string().optional(),
      productType: z.string().optional(),
      optimizationStatus: z.enum(['pending', 'processing', 'completed', 'failed', 'needs_review']).optional(),
      page: z.string().regex(/^\d+$/).transform(Number).refine(n => n > 0, 'Page must be greater than 0').optional().default('1'),
      limit: z.string().regex(/^\d+$/).transform(Number).refine(n => n > 0 && n <= 100, 'Limit must be between 1 and 100').optional().default('20')
    }),
    sanitizationRules: {
      query: {
        q: sanitizeString,
        vendor: sanitizeString,
        productType: sanitizeString,
        optimizationStatus: (value: string) => ['pending', 'processing', 'completed', 'failed', 'needs_review'].includes(value) ? value : undefined,
        page: sanitizeInteger,
        limit: sanitizeInteger
      }
    }
  }
};

// SQL injection prevention
export const preventSqlInjection = (input: string): string => {
  const sqlPatterns = [
    /(\s|^)(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE)(\s|$)/gi,
    /(\s|^)(UNION|JOIN|INNER|OUTER|LEFT|RIGHT)(\s|$)/gi,
    /(\s|^)(WHERE|HAVING|GROUP|ORDER)(\s|$)/gi,
    /(\s|^)(OR|AND)(\s+\d+\s*=\s*\d+)/gi,
    /(\s|^)(--|\/\*|\*\/)(\s|$)/gi,
    /;\s*$/gi,
    /'[^']*'/gi,
    /"[^"]*"/gi
  ];

  let sanitized = input;
  for (const pattern of sqlPatterns) {
    sanitized = sanitized.replace(pattern, '');
  }
  return sanitized;
};

// NoSQL injection prevention
export const preventNoSqlInjection = (input: string): string => {
  const nosqlPatterns = [
    /\$where/gi,
    /\$ne/gi,
    /\$gt/gi,
    /\$lt/gi,
    /\$gte/gi,
    /\$lte/gi,
    /\$in/gi,
    /\$nin/gi,
    /\$or/gi,
    /\$and/gi,
    /\$not/gi,
    /\$exists/gi,
    /\$regex/gi,
    /\$options/gi
  ];

  let sanitized = input;
  for (const pattern of nosqlPatterns) {
    sanitized = sanitized.replace(pattern, '');
  }
  return sanitized;
};

// XSS prevention
export const preventXss = (input: string): string => {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<\s*\/?\s*script\s*>/gi,
    /<\s*\/?\s*iframe\s*>/gi,
    /<\s*\/?\s*object\s*>/gi,
    /<\s*\/?\s*embed\s*>/gi
  ];

  let sanitized = input;
  for (const pattern of xssPatterns) {
    sanitized = sanitized.replace(pattern, '');
  }
  return sanitized;
};

// File upload validation
export const validateFileUpload = (req: Request, res: Response, next: NextFunction) => {
  // Note: req.file would be populated by multer middleware
  // This is a placeholder for future file upload functionality
  next();
};

// Rate limiting validation
export const validateRateLimit = (req: Request, res: Response, next: NextFunction) => {
  const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.get('User-Agent') || 'unknown';

  // Log request for rate limiting
  logger.debug('Rate limit check', {
    ip: clientIp,
    userAgent: userAgent.substring(0, 100),
    path: req.path,
    method: req.method
  });

  next();
};

// Request size validation
export const validateRequestSize = (maxSize: number = 1024 * 1024) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.get('Content-Length') || '0');

    if (contentLength > maxSize) {
      return next(createError(`Request size exceeds maximum limit of ${maxSize} bytes`, 413));
    }

    next();
  };
};