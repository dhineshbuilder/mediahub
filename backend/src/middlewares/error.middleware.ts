import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/error.formatter';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export function errorMiddleware(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err.message || 'Internal Server Error';

  logger.error(`[${req.method}] ${req.url} - Error ${statusCode}: ${message}`);
  if (!(err instanceof AppError)) {
    logger.error(err.stack || 'No stack trace available');
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: env.NODE_ENV === 'development' ? err.stack : undefined,
  });
}
