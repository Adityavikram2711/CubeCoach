import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { User } from "../models/user.model.js";

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
}, 180_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
});

const VALID_REGISTRATION = { email: "Alice@Example.com", username: "alice_cuber", password: "correcthorsebattery" };

describe("POST /api/auth/register", () => {
  it("registers a new user, hashes the password, and never returns it", async () => {
    const app = createApp();
    const res = await request(app).post("/api/auth/register").send(VALID_REGISTRATION);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.token).toBe("string");
    // The API contract is `id`, never Mongo's raw `_id` -- the client keys every
    // personalization query off user.id, so a silent regression here would disable
    // favorites/learned/notes for every user without any obviously-failing request.
    expect(typeof res.body.user.id).toBe("string");
    expect(res.body.user.id.length).toBeGreaterThan(0);
    expect(res.body.user._id).toBeUndefined();
    expect(res.body.user.email).toBe("alice@example.com"); // normalized
    expect(res.body.user.username).toBe("alice_cuber");
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.body.user.password).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toContain("correcthorsebattery");

    const stored = await User.findOne({ email: "alice@example.com" }).select("+passwordHash");
    expect(stored!.passwordHash).not.toBe("correcthorsebattery");
    expect(stored!.passwordHash.length).toBeGreaterThan(20);
  });

  it("rejects a duplicate email", async () => {
    const app = createApp();
    await request(app).post("/api/auth/register").send(VALID_REGISTRATION);
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...VALID_REGISTRATION, username: "alice_two" });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("EMAIL_TAKEN");
  });

  it("rejects an invalid email", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...VALID_REGISTRATION, email: "not-an-email" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_REQUEST");
  });

  it("rejects a short password", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...VALID_REGISTRATION, password: "short" });
    expect(res.status).toBe(400);
  });

  it("rejects an invalid username", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...VALID_REGISTRATION, username: "a" });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    const app = createApp();
    await request(app).post("/api/auth/register").send(VALID_REGISTRATION);
  });

  it("logs in with correct credentials", async () => {
    const app = createApp();
    const res = await request(app).post("/api/auth/login").send({ email: "alice@example.com", password: "correcthorsebattery" });
    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe("string");
    expect(typeof res.body.user.id).toBe("string");
    expect(res.body.user.email).toBe("alice@example.com");
  });

  it("normalizes email case on login", async () => {
    const app = createApp();
    const res = await request(app).post("/api/auth/login").send({ email: "ALICE@EXAMPLE.COM", password: "correcthorsebattery" });
    expect(res.status).toBe(200);
  });

  it("rejects the wrong password without revealing which field was wrong", async () => {
    const app = createApp();
    const res = await request(app).post("/api/auth/login").send({ email: "alice@example.com", password: "wrongpassword" });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("rejects an unknown email with the same error as a wrong password", async () => {
    const app = createApp();
    const res = await request(app).post("/api/auth/login").send({ email: "nobody@example.com", password: "correcthorsebattery" });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
  });
});

describe("GET /api/auth/me", () => {
  async function registerAndGetToken(app: ReturnType<typeof createApp>): Promise<string> {
    const res = await request(app).post("/api/auth/register").send(VALID_REGISTRATION);
    return res.body.token;
  }

  it("returns the authenticated user for a valid token", async () => {
    const app = createApp();
    const token = await registerAndGetToken(app);
    const res = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(typeof res.body.user.id).toBe("string");
    expect(res.body.user.email).toBe("alice@example.com");
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it("rejects a missing token", async () => {
    const app = createApp();
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("rejects a malformed/invalid token", async () => {
    const app = createApp();
    const res = await request(app).get("/api/auth/me").set("Authorization", "Bearer not.a.valid.jwt");
    expect(res.status).toBe(401);
  });

  it("rejects an expired token", async () => {
    const app = createApp();
    const jwt = await import("jsonwebtoken");
    const { env } = await import("../config/env.js");
    const expiredToken = jwt.default.sign({ sub: "000000000000000000000000", username: "x", email: "x@example.com" }, env.jwtSecret, {
      expiresIn: -10, // already expired
    });
    const res = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${expiredToken}`);
    expect(res.status).toBe(401);
  });

  it("rejects a token signed with the wrong secret", async () => {
    const app = createApp();
    const jwt = await import("jsonwebtoken");
    const forgedToken = jwt.default.sign({ sub: "000000000000000000000000", username: "x", email: "x@example.com" }, "wrong-secret");
    const res = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${forgedToken}`);
    expect(res.status).toBe(401);
  });
});
