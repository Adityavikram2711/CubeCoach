import bcrypt from "bcrypt";
import type { Request, Response } from "express";
import { ApiError } from "../middleware/errorHandler.js";
import { User } from "../models/user.model.js";
import { signAuthToken } from "../utils/jwt.js";
import { loginRequestSchema, registerRequestSchema } from "../validators/auth.validators.js";

const BCRYPT_ROUNDS = 10;

export async function postRegister(req: Request, res: Response): Promise<void> {
  const parsed = registerRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, "INVALID_REQUEST", parsed.error.issues.map((i) => i.message).join("; "));
  }
  const { email, username, password } = parsed.data;

  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(409, "EMAIL_TAKEN", "An account with this email already exists.");
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await User.create({ email, username, passwordHash });

  const token = signAuthToken({ sub: user.id, username: user.username, email: user.email });
  res.status(201).json({ success: true, token, user: user.toJSON() });
}

export async function postLogin(req: Request, res: Response): Promise<void> {
  const parsed = loginRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, "INVALID_REQUEST", parsed.error.issues.map((i) => i.message).join("; "));
  }
  const { email, password } = parsed.data;

  const user = await User.findOne({ email }).select("+passwordHash");
  // Same error for "no such email" and "wrong password" -- never reveal which one was wrong.
  const invalidCredentials = () => new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password.");
  if (!user) throw invalidCredentials();

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) throw invalidCredentials();

  const token = signAuthToken({ sub: user.id, username: user.username, email: user.email });
  res.json({ success: true, token, user: user.toJSON() });
}

export async function getMe(req: Request, res: Response): Promise<void> {
  const user = await User.findById(req.user!.id);
  if (!user) {
    throw new ApiError(401, "UNAUTHORIZED", "The authenticated user no longer exists.");
  }
  res.json({ success: true, user: user.toJSON() });
}
