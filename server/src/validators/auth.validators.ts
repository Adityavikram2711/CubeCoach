import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("must be a valid email address");

const usernameSchema = z
  .string()
  .trim()
  .min(3, "username must be at least 3 characters")
  .max(30, "username must be at most 30 characters")
  .regex(/^[a-zA-Z0-9_]+$/, "username can only contain letters, numbers, and underscores");

const passwordSchema = z
  .string()
  .min(8, "password must be at least 8 characters")
  .max(72, "password must be at most 72 characters"); // bcrypt silently truncates beyond 72 bytes

export const registerRequestSchema = z.object({
  email: emailSchema,
  username: usernameSchema,
  password: passwordSchema,
});

export const loginRequestSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "password is required"),
});

export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
