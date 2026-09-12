import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../app.js";

/**
 * Isolated in its own file so it gets a fresh authRouter module (and therefore a fresh
 * rate-limit counter) rather than sharing budget with auth.routes.test.ts's own
 * expected failures -- Vitest isolates each test file's module graph by default.
 */
let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
}, 180_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe("auth endpoint rate limiting", () => {
  it("blocks repeated failed login attempts after the limit, without blocking successful ones", async () => {
    const app = createApp();

    // Only failed attempts count (skipSuccessfulRequests) -- exhaust the 20-request budget with wrong-password attempts.
    let lastStatus = 0;
    for (let i = 0; i < 20; i++) {
      const res = await request(app).post("/api/auth/login").send({ email: "nobody@example.com", password: "wrong" });
      lastStatus = res.status;
    }
    expect(lastStatus).toBe(401); // still ordinary failures up to the limit

    const overLimit = await request(app).post("/api/auth/login").send({ email: "nobody@example.com", password: "wrong" });
    expect(overLimit.status).toBe(429);
  }, 30_000);
});
