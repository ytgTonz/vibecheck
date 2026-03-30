import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ZodSchema } from 'zod';

/**
 * Middleware that parses req.body against a Zod schema.
 * On success, replaces req.body with the parsed (type-safe) data.
 * On failure, forwards the ZodError to the global error handler (→ 400).
 */
export function validateBody<T>(schema: ZodSchema<T>): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(result.error);
      return;
    }
    req.body = result.data;
    next();
  };
}

/**
 * Wraps an async route handler so any thrown error is forwarded to next()
 * instead of becoming an unhandled promise rejection.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
