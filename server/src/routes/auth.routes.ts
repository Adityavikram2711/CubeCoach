import rateLimit from "express-rate-limit";
import { Router } from "express";
import { getMe, postLogin, postRegister } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const authRouter = Router();

/**
 * Tighter than the app-wide limiter (app.ts): register/login are credential-guessing
 * targets, so they get their own stricter cap independent of how much other API
 * traffic a client has made. Skips successful requests so a legitimate user who logs
 * in/out repeatedly never gets penalized -- only repeated FAILED attempts count
 * against the limit.
 */
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

authRouter.post("/register", authRateLimit, asyncHandler(postRegister));
authRouter.post("/login", authRateLimit, asyncHandler(postLogin));
authRouter.get("/me", requireAuth, asyncHandler(getMe));
