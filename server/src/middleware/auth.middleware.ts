import type { NextFunction, Request, Response } from "express";
import { ApiError } from "./errorHandler.js";
import { verifyAuthToken } from "../utils/jwt.js";

/**
 * Requires a valid "Authorization: Bearer <token>" header, verifies it, and attaches
 * the decoded identity to req.user. Every route handler that needs to scope data to
 * "the current user" must read req.user.id -- never a userId from the request body or
 * params, which a client could set to anyone.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new ApiError(401, "UNAUTHORIZED", "Missing authentication token.");
  }

  const token = header.slice("Bearer ".length);
  try {
    const payload = verifyAuthToken(token);
    req.user = { id: payload.sub, username: payload.username, email: payload.email };
    next();
  } catch {
    throw new ApiError(401, "UNAUTHORIZED", "Invalid or expired authentication token.");
  }
}
