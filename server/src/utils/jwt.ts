import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export interface AuthTokenPayload {
  sub: string; // user id
  username: string;
  email: string;
}

const EXPIRES_IN = "7d";

export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: EXPIRES_IN });
}

/** Throws (jsonwebtoken's own errors: TokenExpiredError, JsonWebTokenError, etc.) on any invalid/expired/malformed token -- callers decide how to translate that into an HTTP response. */
export function verifyAuthToken(token: string): AuthTokenPayload {
  return jwt.verify(token, env.jwtSecret) as AuthTokenPayload;
}
