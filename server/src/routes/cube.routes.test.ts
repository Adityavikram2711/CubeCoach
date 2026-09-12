import { applyMoves, createSolvedCube, generateScramble, isSolved } from "@cube-coach/cube-engine";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../app.js";

describe("POST /api/cube/solve", () => {
  it("solves and verifies a scrambled cube, matching the shared engine's own verification", async () => {
    const app = createApp();
    const scramble = generateScramble(20);
    const cube = applyMoves(createSolvedCube(), scramble);

    const res = await request(app).post("/api/cube/solve").send({ cube });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.verified).toBe(true);
    expect(res.body.moveCount).toBe(res.body.moves.length);

    const replayed = applyMoves(cube, res.body.moves);
    expect(isSolved(replayed)).toBe(true);
  });

  it("returns zero moves for an already-solved cube", async () => {
    const app = createApp();
    const res = await request(app).post("/api/cube/solve").send({ cube: createSolvedCube() });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, moves: [], moveCount: 0, verified: true });
  });

  it("rejects a request with the wrong facelet count", async () => {
    const app = createApp();
    const res = await request(app)
      .post("/api/cube/solve")
      .send({ cube: createSolvedCube().slice(0, 53) });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INVALID_REQUEST");
  });

  it("rejects a request with invalid color values", async () => {
    const app = createApp();
    const cube = createSolvedCube();
    // @ts-expect-error -- intentionally sending an invalid color to test request validation
    cube[0] = "purple";
    const res = await request(app).post("/api/cube/solve").send({ cube });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_REQUEST");
  });

  it("rejects a structurally valid but physically impossible cube", async () => {
    const app = createApp();
    const cube = createSolvedCube();
    cube[0] = "yellow"; // breaks the 9-of-each-color invariant
    const res = await request(app).post("/api/cube/solve").send({ cube });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("INVALID_CUBE");
  });

  it("never trusts a client-submitted solution -- there is no such field to submit", async () => {
    const app = createApp();
    const cube = applyMoves(createSolvedCube(), ["R", "U"]);
    const res = await request(app)
      .post("/api/cube/solve")
      .send({ cube, moves: ["totally", "fake"] }); // extra field should just be ignored
    expect(res.status).toBe(200);
    expect(res.body.moves).not.toEqual(["totally", "fake"]);
    expect(isSolved(applyMoves(cube, res.body.moves))).toBe(true);
  });
});
