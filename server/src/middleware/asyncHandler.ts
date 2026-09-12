import type { NextFunction, Request, Response } from "express";

/**
 * Express 4 does not forward a rejected promise from an async route handler to
 * errorHandler on its own -- wrapping every async controller here (rather than adding
 * try/catch to each one) keeps that plumbing in one place.
 */
export function asyncHandler(fn: (req: Request, res: Response) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res).catch(next);
  };
}
