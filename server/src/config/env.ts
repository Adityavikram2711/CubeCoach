import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

// npm workspace scripts run with cwd set to server/, so dotenv's default cwd-relative
// lookup would miss a .env file kept at the repo root (where .env.example lives).
// Resolve explicitly so `npm run dev` (root) and running the server directly both work.
const repoRootEnvPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../.env");
dotenv.config({ path: repoRootEnvPath });

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const nodeEnv = process.env.NODE_ENV ?? "development";
const isProdEnv = nodeEnv === "production";

export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv,
  mongodbUri: required("MONGODB_URI", "mongodb://localhost:27017/cubecoach"),
  jwtSecret: required("JWT_SECRET", isProdEnv ? undefined : "dev_only_insecure_secret_change_me"),
  clientUrl: process.env.CLIENT_URL ?? "http://localhost:5173",
};

export const isProduction = isProdEnv;
export const isTest = env.nodeEnv === "test";
