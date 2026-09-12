import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { Solve } from "../models/solve.model.js";
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

let app: ReturnType<typeof createApp>;
let tokenA: string;
let tokenB: string;

const VALID_SCRAMBLE = "R U2 F' L D2 B R2 U' F L2 D B' R U F2 D' L B2 U2 R'";

function authed(token: string) {
  return { Authorization: `Bearer ${token}` };
}

beforeEach(async () => {
  await Promise.all([User.deleteMany({}), Solve.deleteMany({})]);
  app = createApp();
  const resA = await request(app).post("/api/auth/register").send({ email: "a@example.com", username: "userA", password: "password123" });
  tokenA = resA.body.token;
  const resB = await request(app).post("/api/auth/register").send({ email: "b@example.com", username: "userB", password: "password123" });
  tokenB = resB.body.token;
});

describe("POST /api/solves", () => {
  it("requires authentication", async () => {
    const res = await request(app).post("/api/solves").send({ scramble: VALID_SCRAMBLE, rawTimeMs: 12470, penalty: "NONE" });
    expect(res.status).toBe(401);
  });

  it("creates a solve with the raw time, penalty, and correctly-calculated final time", async () => {
    const res = await request(app).post("/api/solves").set(authed(tokenA)).send({ scramble: VALID_SCRAMBLE, rawTimeMs: 12470, penalty: "NONE" });
    expect(res.status).toBe(201);
    expect(res.body.solve.rawTimeMs).toBe(12470);
    expect(res.body.solve.penalty).toBe("NONE");
    expect(res.body.solve.finalTimeMs).toBe(12470);
    expect(res.body.solve.scramble).toBe(VALID_SCRAMBLE);
  });

  it("calculates PLUS_TWO as rawTimeMs + 2000, server-side", () => {
    return request(app)
      .post("/api/solves")
      .set(authed(tokenA))
      .send({ scramble: VALID_SCRAMBLE, rawTimeMs: 10000, penalty: "PLUS_TWO" })
      .then((res) => {
        expect(res.body.solve.finalTimeMs).toBe(12000);
      });
  });

  it("calculates DNF as a null final time, never zero", async () => {
    const res = await request(app).post("/api/solves").set(authed(tokenA)).send({ scramble: VALID_SCRAMBLE, rawTimeMs: 15000, penalty: "DNF" });
    expect(res.body.solve.finalTimeMs).toBeNull();
  });

  it("ignores a client-supplied finalTimeMs and always derives it server-side", async () => {
    const res = await request(app)
      .post("/api/solves")
      .set(authed(tokenA))
      .send({ scramble: VALID_SCRAMBLE, rawTimeMs: 10000, penalty: "NONE", finalTimeMs: 1 });
    expect(res.body.solve.finalTimeMs).toBe(10000); // not 1
  });

  it("rejects an invalid/unparseable scramble", async () => {
    const res = await request(app).post("/api/solves").set(authed(tokenA)).send({ scramble: "this is not a scramble", rawTimeMs: 10000, penalty: "NONE" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_REQUEST");
  });

  it("rejects an empty scramble", async () => {
    const res = await request(app).post("/api/solves").set(authed(tokenA)).send({ scramble: "", rawTimeMs: 10000, penalty: "NONE" });
    expect(res.status).toBe(400);
  });

  it("rejects a negative rawTimeMs", async () => {
    const res = await request(app).post("/api/solves").set(authed(tokenA)).send({ scramble: VALID_SCRAMBLE, rawTimeMs: -1, penalty: "NONE" });
    expect(res.status).toBe(400);
  });

  it("rejects NaN/Infinity rawTimeMs", async () => {
    const nanRes = await request(app).post("/api/solves").set(authed(tokenA)).send({ scramble: VALID_SCRAMBLE, rawTimeMs: NaN, penalty: "NONE" });
    expect(nanRes.status).toBe(400);
    const infRes = await request(app)
      .post("/api/solves")
      .set(authed(tokenA))
      .send({ scramble: VALID_SCRAMBLE, rawTimeMs: Number.POSITIVE_INFINITY, penalty: "NONE" });
    expect(infRes.status).toBe(400);
  });

  it("rejects an invalid penalty value", async () => {
    const res = await request(app).post("/api/solves").set(authed(tokenA)).send({ scramble: VALID_SCRAMBLE, rawTimeMs: 10000, penalty: "PENALTY_BOX" });
    expect(res.status).toBe(400);
  });

  it("scopes the created solve to the authenticated user, ignoring a client-supplied userId", async () => {
    const res = await request(app)
      .post("/api/solves")
      .set(authed(tokenA))
      .send({ scramble: VALID_SCRAMBLE, rawTimeMs: 10000, penalty: "NONE", userId: "000000000000000000000000" });
    expect(res.status).toBe(201);
    const stored = await Solve.findById(res.body.solve._id);
    expect(String(stored!.userId)).not.toBe("000000000000000000000000");
  });
});

describe("GET /api/solves", () => {
  it("requires authentication", async () => {
    const res = await request(app).get("/api/solves");
    expect(res.status).toBe(401);
  });

  it("returns only the authenticated user's solves, newest first", async () => {
    await request(app).post("/api/solves").set(authed(tokenA)).send({ scramble: VALID_SCRAMBLE, rawTimeMs: 10000, penalty: "NONE", solvedAt: new Date(Date.now() - 10000).toISOString() });
    await request(app).post("/api/solves").set(authed(tokenA)).send({ scramble: VALID_SCRAMBLE, rawTimeMs: 9000, penalty: "NONE", solvedAt: new Date().toISOString() });
    await request(app).post("/api/solves").set(authed(tokenB)).send({ scramble: VALID_SCRAMBLE, rawTimeMs: 5000, penalty: "NONE" });

    const res = await request(app).get("/api/solves").set(authed(tokenA));
    expect(res.status).toBe(200);
    expect(res.body.solves).toHaveLength(2);
    expect(res.body.solves[0].rawTimeMs).toBe(9000); // newest first
    expect(res.body.solves[1].rawTimeMs).toBe(10000);
  });

  it("returns an empty list for a user with no solves", async () => {
    const res = await request(app).get("/api/solves").set(authed(tokenA));
    expect(res.body.solves).toEqual([]);
  });
});

describe("DELETE /api/solves/:id", () => {
  it("requires authentication", async () => {
    const created = await request(app).post("/api/solves").set(authed(tokenA)).send({ scramble: VALID_SCRAMBLE, rawTimeMs: 10000, penalty: "NONE" });
    const res = await request(app).delete(`/api/solves/${created.body.solve._id}`);
    expect(res.status).toBe(401);
  });

  it("deletes the caller's own solve", async () => {
    const created = await request(app).post("/api/solves").set(authed(tokenA)).send({ scramble: VALID_SCRAMBLE, rawTimeMs: 10000, penalty: "NONE" });
    const res = await request(app).delete(`/api/solves/${created.body.solve._id}`).set(authed(tokenA));
    expect(res.status).toBe(200);
    expect(await Solve.findById(created.body.solve._id)).toBeNull();
  });

  it("user A cannot delete user B's solve", async () => {
    const created = await request(app).post("/api/solves").set(authed(tokenB)).send({ scramble: VALID_SCRAMBLE, rawTimeMs: 10000, penalty: "NONE" });
    const res = await request(app).delete(`/api/solves/${created.body.solve._id}`).set(authed(tokenA));
    expect(res.status).toBe(404);
    expect(await Solve.findById(created.body.solve._id)).not.toBeNull(); // still there
  });

  it("rejects a malformed id", async () => {
    const res = await request(app).delete("/api/solves/not-an-id").set(authed(tokenA));
    expect(res.status).toBe(400);
  });

  it("404s for a nonexistent (but well-formed) id", async () => {
    const res = await request(app).delete("/api/solves/000000000000000000000000").set(authed(tokenA));
    expect(res.status).toBe(404);
  });
});

describe("ownership isolation", () => {
  it("user A cannot see user B's solves in the list", async () => {
    await request(app).post("/api/solves").set(authed(tokenB)).send({ scramble: VALID_SCRAMBLE, rawTimeMs: 10000, penalty: "NONE" });
    const res = await request(app).get("/api/solves").set(authed(tokenA));
    expect(res.body.solves).toEqual([]);
  });
});
