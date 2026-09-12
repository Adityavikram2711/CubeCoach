import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { Algorithm } from "../models/algorithm.model.js";
import { User } from "../models/user.model.js";
import { UserAlgorithm } from "../models/userAlgorithm.model.js";

const SCRAMBLED_STATE = new Array(54).fill("white");

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

beforeEach(async () => {
  await Promise.all([User.deleteMany({}), UserAlgorithm.deleteMany({}), Algorithm.deleteMany({})]);
  await Algorithm.create({
    type: "OLL",
    caseId: "oll-01",
    number: 1,
    name: "OLL 1 (Dot)",
    category: "Dot",
    recognition: "No edges oriented.",
    algorithm: "R U R' U' R' F R F'",
    alternatives: [],
    fingerTricks: "Take it slow.",
    notes: "Verified.",
    difficulty: "Beginner",
    scrambledState: SCRAMBLED_STATE,
  });

  app = createApp();
  const resA = await request(app).post("/api/auth/register").send({ email: "a@example.com", username: "userA", password: "password123" });
  tokenA = resA.body.token;
  const resB = await request(app).post("/api/auth/register").send({ email: "b@example.com", username: "userB", password: "password123" });
  tokenB = resB.body.token;
});

function authed(token: string) {
  return { Authorization: `Bearer ${token}` };
}

describe("GET /api/user/algorithms", () => {
  it("requires authentication", async () => {
    const res = await request(app).get("/api/user/algorithms");
    expect(res.status).toBe(401);
  });

  it("returns an empty list when nothing is personalized yet", async () => {
    const res = await request(app).get("/api/user/algorithms").set(authed(tokenA));
    expect(res.status).toBe(200);
    expect(res.body.records).toEqual([]);
  });
});

describe("PUT /api/user/algorithms/:algorithmId", () => {
  it("creates personalization with a valid preferred algorithm", async () => {
    const res = await request(app)
      .put("/api/user/algorithms/oll-01")
      .set(authed(tokenA))
      .send({ preferredAlgorithm: "R U R' U'", notes: "left hand grip" });

    expect(res.status).toBe(200);
    expect(res.body.record.algorithmId).toBe("oll-01");
    expect(res.body.record.preferredAlgorithm).toBe("R U R' U'");
    expect(res.body.record.notes).toBe("left hand grip");
  });

  it("updates existing personalization rather than duplicating it", async () => {
    await request(app).put("/api/user/algorithms/oll-01").set(authed(tokenA)).send({ notes: "first" });
    const res = await request(app).put("/api/user/algorithms/oll-01").set(authed(tokenA)).send({ notes: "second" });

    expect(res.status).toBe(200);
    expect(res.body.record.notes).toBe("second");
    const count = await UserAlgorithm.countDocuments({});
    expect(count).toBe(1);
  });

  it("rejects an invalid/malformed algorithm notation", async () => {
    const res = await request(app)
      .put("/api/user/algorithms/oll-01")
      .set(authed(tokenA))
      .send({ preferredAlgorithm: "this is not an algorithm" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_REQUEST");
  });

  it("rejects an unknown algorithmId", async () => {
    const res = await request(app).put("/api/user/algorithms/does-not-exist").set(authed(tokenA)).send({ notes: "x" });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("ALGORITHM_NOT_FOUND");
  });

  it("never modifies the global Algorithm document", async () => {
    await request(app)
      .put("/api/user/algorithms/oll-01")
      .set(authed(tokenA))
      .send({ preferredAlgorithm: "F R U R' U' F'" });

    const globalCase = await Algorithm.findOne({ caseId: "oll-01" }).lean();
    expect(globalCase!.algorithm).toBe("R U R' U' R' F R F'");
  });

  it("ignores a client-supplied userId and always scopes to the authenticated user", async () => {
    const res = await request(app)
      .put("/api/user/algorithms/oll-01")
      .set(authed(tokenA))
      .send({ userId: "000000000000000000000000", notes: "mine" });
    expect(res.status).toBe(200);

    const records = await UserAlgorithm.find({}).lean();
    expect(records).toHaveLength(1);
    expect(String(records[0]!.userId)).not.toBe("000000000000000000000000");
  });

  it("requires authentication", async () => {
    const res = await request(app).put("/api/user/algorithms/oll-01").send({ notes: "x" });
    expect(res.status).toBe(401);
  });

  it("clears preferredAlgorithm when explicitly set to null, without touching other fields", async () => {
    await request(app)
      .put("/api/user/algorithms/oll-01")
      .set(authed(tokenA))
      .send({ preferredAlgorithm: "F R U R' U' F'", notes: "keep me" });

    const res = await request(app).put("/api/user/algorithms/oll-01").set(authed(tokenA)).send({ preferredAlgorithm: null });

    expect(res.status).toBe(200);
    expect(res.body.record.preferredAlgorithm).toBeUndefined();
    expect(res.body.record.notes).toBe("keep me");
  });
});

describe("GET /api/user/algorithms/:algorithmId", () => {
  it("returns 200 with a null record when no personalization exists yet (not an error)", async () => {
    const res = await request(app).get("/api/user/algorithms/oll-01").set(authed(tokenA));
    expect(res.status).toBe(200);
    expect(res.body.record).toBeNull();
  });

  it("returns the personalization once created", async () => {
    await request(app).put("/api/user/algorithms/oll-01").set(authed(tokenA)).send({ notes: "hello" });
    const res = await request(app).get("/api/user/algorithms/oll-01").set(authed(tokenA));
    expect(res.status).toBe(200);
    expect(res.body.record.notes).toBe("hello");
  });
});

describe("DELETE /api/user/algorithms/:algorithmId", () => {
  it("deletes an existing personalization", async () => {
    await request(app).put("/api/user/algorithms/oll-01").set(authed(tokenA)).send({ notes: "hello" });
    const res = await request(app).delete("/api/user/algorithms/oll-01").set(authed(tokenA));
    expect(res.status).toBe(200);

    const stillThere = await UserAlgorithm.findOne({ algorithmId: "oll-01" });
    expect(stillThere).toBeNull();
  });

  it("404s when nothing to delete", async () => {
    const res = await request(app).delete("/api/user/algorithms/oll-01").set(authed(tokenA));
    expect(res.status).toBe(404);
  });
});

describe("POST /api/user/algorithms/:algorithmId/favorite and /learned", () => {
  it("toggles favorite on then off", async () => {
    const on = await request(app).post("/api/user/algorithms/oll-01/favorite").set(authed(tokenA));
    expect(on.status).toBe(200);
    expect(on.body.record.favorite).toBe(true);

    const off = await request(app).post("/api/user/algorithms/oll-01/favorite").set(authed(tokenA));
    expect(off.body.record.favorite).toBe(false);
  });

  it("toggles learned independently of favorite", async () => {
    const res = await request(app).post("/api/user/algorithms/oll-01/learned").set(authed(tokenA));
    expect(res.status).toBe(200);
    expect(res.body.record.learned).toBe(true);
    expect(res.body.record.favorite).toBe(false);
  });
});

describe("POST /api/user/algorithms/:algorithmId/practice", () => {
  it("requires authentication", async () => {
    const res = await request(app).post("/api/user/algorithms/oll-01/practice").send({ success: true });
    expect(res.status).toBe(401);
  });

  it("rejects an invalid/missing body", async () => {
    const res = await request(app).post("/api/user/algorithms/oll-01/practice").set(authed(tokenA)).send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_REQUEST");
  });

  it("rejects a nonexistent algorithm", async () => {
    const res = await request(app).post("/api/user/algorithms/does-not-exist/practice").set(authed(tokenA)).send({ success: true });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("ALGORITHM_NOT_FOUND");
  });

  it("increments practiceCount and successCount on a successful attempt, and sets lastPracticedAt", async () => {
    const before = new Date();
    const res = await request(app).post("/api/user/algorithms/oll-01/practice").set(authed(tokenA)).send({ success: true });

    expect(res.status).toBe(200);
    expect(res.body.record.practiceCount).toBe(1);
    expect(res.body.record.successCount).toBe(1);
    expect(new Date(res.body.record.lastPracticedAt).getTime()).toBeGreaterThanOrEqual(before.getTime());
  });

  it("increments practiceCount but not successCount on a failed attempt", async () => {
    const res = await request(app).post("/api/user/algorithms/oll-01/practice").set(authed(tokenA)).send({ success: false });
    expect(res.status).toBe(200);
    expect(res.body.record.practiceCount).toBe(1);
    expect(res.body.record.successCount).toBe(0);
  });

  it("accumulates counts across repeated submissions", async () => {
    await request(app).post("/api/user/algorithms/oll-01/practice").set(authed(tokenA)).send({ success: true });
    await request(app).post("/api/user/algorithms/oll-01/practice").set(authed(tokenA)).send({ success: false });
    const res = await request(app).post("/api/user/algorithms/oll-01/practice").set(authed(tokenA)).send({ success: true });

    expect(res.body.record.practiceCount).toBe(3);
    expect(res.body.record.successCount).toBe(2);
  });

  it("concurrent/rapid submissions do not lose an increment (atomic $inc, not read-modify-write)", async () => {
    const submissions = Array.from({ length: 10 }, (_, i) =>
      request(app)
        .post("/api/user/algorithms/oll-01/practice")
        .set(authed(tokenA))
        .send({ success: i % 2 === 0 }),
    );
    await Promise.all(submissions);

    const final = await UserAlgorithm.findOne({ algorithmId: "oll-01" });
    expect(final!.practiceCount).toBe(10);
    expect(final!.successCount).toBe(5);
  });

  it("ignores a client-supplied userId and never modifies the global Algorithm document", async () => {
    await request(app)
      .post("/api/user/algorithms/oll-01/practice")
      .set(authed(tokenA))
      .send({ success: true, userId: "000000000000000000000000" });

    const records = await UserAlgorithm.find({ algorithmId: "oll-01" });
    expect(records).toHaveLength(1);
    expect(String(records[0]!.userId)).not.toBe("000000000000000000000000");

    const globalCase = await Algorithm.findOne({ caseId: "oll-01" }).lean();
    expect(globalCase!.algorithm).toBe("R U R' U' R' F R F'");
  });
});

describe("ownership isolation between users", () => {
  it("user A cannot read user B's personalization", async () => {
    await request(app).put("/api/user/algorithms/oll-01").set(authed(tokenB)).send({ notes: "B's secret note" });

    const res = await request(app).get("/api/user/algorithms/oll-01").set(authed(tokenA));
    expect(res.status).toBe(200);
    expect(res.body.record).toBeNull(); // A has no personalization of their own

    const listA = await request(app).get("/api/user/algorithms").set(authed(tokenA));
    expect(listA.body.records).toEqual([]);
  });

  it("user A cannot modify or delete user B's personalization", async () => {
    await request(app).put("/api/user/algorithms/oll-01").set(authed(tokenB)).send({ notes: "B's note" });

    await request(app).put("/api/user/algorithms/oll-01").set(authed(tokenA)).send({ notes: "A's note" });
    await request(app).delete("/api/user/algorithms/oll-01").set(authed(tokenA));

    const bsRecord = await UserAlgorithm.findOne({ algorithmId: "oll-01" }).populate<{ userId: { email: string } }>("userId");
    expect(bsRecord).not.toBeNull();
    expect(bsRecord!.notes).toBe("B's note");
  });

  it("each user gets their own independent favorite/learned state", async () => {
    await request(app).post("/api/user/algorithms/oll-01/favorite").set(authed(tokenA));

    const bView = await request(app).get("/api/user/algorithms/oll-01").set(authed(tokenB));
    expect(bView.status).toBe(200);
    expect(bView.body.record).toBeNull();
  });
});
