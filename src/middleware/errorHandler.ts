import type { NextFunction, Request, Response } from 'express';
import { logger } from '../config/logger';
import { AppError } from '../utils/appError';

export const errorHandler = (error: Error, _req: Request, res: Response, _next: NextFunction) => {
  const statusCode = error instanceof AppError ? error.statusCode : 500;
  const message = error instanceof AppError ? error.message : 'Internal server error';

  logger.error({ err: error, statusCode }, 'Request failed');

  res.status(statusCode).json({
    status: 'error',
    message,
    details: error instanceof AppError ? error.details : undefined,
  });
};