import "express";

declare global {
  namespace Express {
    interface Request {
      /** Set by requireAuth from a verified JWT -- never trust any client-supplied user id instead of this. */
      user?: { id: string; username: string; email: string };
    }
  }
}
