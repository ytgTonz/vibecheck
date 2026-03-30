import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

/**
 * Typed application error with an explicit HTTP status code.
 * Throw this from route handlers for expected error conditions.
 */
export class AppError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Global Express error-handling middleware.
 * Must be registered after all routes with four parameters (err, req, res, next).
 *
 * - ZodError   → 400 with a human-readable validation message
 * - AppError   → mapped HTTP status + message
 * - unknown    → 500 with a generic message; original error logged server-side
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    const message = err.issues.map((i) => i.message).join('; ');
    res.status(400).json({ error: message });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.status).json({ error: err.message });
    return;
  }

  console.error('[API Error]', err);
  res.status(500).json({ error: 'An unexpected error occurred' });
}
