import { solve } from "@cube-coach/cube-engine";
import type { Request, Response } from "express";
import { ApiError } from "../middleware/errorHandler.js";
import { solveCubeRequestSchema } from "../validators/cube.validators.js";

/**
 * Trusts nothing from the client: re-validates the request shape, then hands the cube
 * to the exact same shared solve() the client's Web Worker uses -- there is no second,
 * server-only solving algorithm, and no client-submitted "solution" is ever accepted
 * as-is (the server always re-derives and re-verifies its own).
 */
export function postSolveCube(req: Request, res: Response): void {
  const parsed = solveCubeRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, "INVALID_REQUEST", parsed.error.issues.map((i) => i.message).join("; "));
  }

  const result = solve(parsed.data.cube);

  if (!result.success) {
    const statusCode = result.error.code === "INVALID_CUBE" ? 400 : 500;
    res.status(statusCode).json({ success: false, error: result.error, searchTimeMs: result.searchTimeMs });
    return;
  }

  res.json({
    success: true,
    moves: result.moves,
    moveCount: result.moveCount,
    verified: result.verified,
    searchTimeMs: result.searchTimeMs,
  });
}
