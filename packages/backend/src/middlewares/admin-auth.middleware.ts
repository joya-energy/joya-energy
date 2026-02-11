import { type Request, type Response, type NextFunction } from 'express';
import { HTTP401Error } from '@backend/errors/http.error';
import { Logger } from './logger.midddleware';

/**
 * Get the admin password from environment variable
 * Reads it dynamically on each call to ensure it's loaded from .env file
 */
const getAdminPassword = (): string => {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    Logger.warn('ADMIN_PASSWORD not set in environment, using default JOYA2024');
    return 'JOYA2024';
  }
  return password.trim(); // Remove any whitespace
};

/**
 * Simple admin authentication middleware
 * Expects password in Authorization header: "Bearer <password>"
 * or in query parameter: ?adminPassword=<password>
 */
export const adminAuthMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  // Get the expected password from environment (read dynamically)
  const expectedPassword = getAdminPassword();
  
  // Get password from Authorization header or query parameter
  const authHeader = req.headers.authorization;
  const queryPassword = req.query.adminPassword as string | undefined;

  let providedPassword: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    providedPassword = authHeader.substring(7).trim();
  } else if (queryPassword) {
    providedPassword = String(queryPassword).trim();
  }

  if (!providedPassword) {
    Logger.warn('Admin auth failed: No password provided');
    throw new HTTP401Error('Unauthorized: Admin password required');
  }

  if (providedPassword !== expectedPassword) {
    Logger.warn('Admin auth failed: Invalid password provided');
    throw new HTTP401Error('Unauthorized: Admin password required');
  }

  next();
};
