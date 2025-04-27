import { Request, Response, NextFunction } from 'express';
import { sanitizeObject } from '../utils/sanitize';

/**
 * Middleware to sanitize request body to prevent XSS attacks
 */
export function sanitizeRequestBody(req: Request, res: Response, next: NextFunction) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  next();
}