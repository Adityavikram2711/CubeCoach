import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { Algorithm } from "../models/algorithm.model.js";

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

beforeEach(async () => {
  await Algorithm.deleteMany({});
  await Algorithm.insertMany([
    {
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
    },
    {
      type: "PLL",
      caseId: "pll-01",
      number: 1,
      name: "Aa Perm",
      recognition: "A pure 3-cycle of corners.",
      algorithm: "R' F R' B2 R F' R' B2 R2",
      alternatives: [],
      fingerTricks: "Keep it smooth.",
      notes: "Verified.",
      difficulty: "Intermediate",
      scrambledState: SCRAMBLED_STATE,
    },
  ]);
});

describe("GET /api/algorithms", () => {
  it("lists all cases when no filter is given", async () => {
    const app = createApp();
    const res = await request(app).get("/api/algorithms");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(2);
  });

  it("filters by type", async () => {
    const app = createApp();
    const res = await request(app).get("/api/algorithms").query({ type: "OLL" });
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.cases[0].caseId).toBe("oll-01");
  });

  it("filters by difficulty", async () => {
    const app = createApp();
    const res = await request(app).get("/api/algorithms").query({ difficulty: "Intermediate" });
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.cases[0].caseId).toBe("pll-01");
  });

  it("rejects an invalid type filter", async () => {
    const app = createApp();
    const res = await request(app).get("/api/algorithms").query({ type: "XYZ" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_REQUEST");
  });
});

describe("GET /api/algorithms/:id", () => {
  it("returns the matching case", async () => {
    const app = createApp();
    const res = await request(app).get("/api/algorithms/oll-01");
    expect(res.status).toBe(200);
    expect(res.body.case.name).toBe("OLL 1 (Dot)");
  });

  it("404s for an unknown id", async () => {
    const app = createApp();
    const res = await request(app).get("/api/algorithms/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });
});
