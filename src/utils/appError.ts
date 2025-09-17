export class AppError extends Error {
  constructor(message: string, public readonly statusCode = 400, public readonly details?: unknown) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace?.(this, AppError);
  }
}