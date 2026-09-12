import type { Request, Response } from "express";
import { Types } from "mongoose";
import { ApiError } from "../middleware/errorHandler.js";
import { Solve } from "../models/solve.model.js";
import { createSolveSchema, listSolvesQuerySchema } from "../validators/solve.validators.js";

const PLUS_TWO_MS = 2000;

/**
 * The server is the source of truth for the stored result: it always derives
 * finalTimeMs from rawTimeMs + penalty itself (a client-supplied finalTimeMs, if sent,
 * is silently ignored -- createSolveSchema doesn't even declare that field). This tiny
 * calculation intentionally mirrors client/src/features/timer/timeUtils.ts's
 * calculateFinalTime: duplicating five lines here is far simpler and lower-risk than
 * introducing a cross-workspace shared module for a single switch statement, and both
 * sides are independently unit-tested against the same documented rule.
 */
function calculateFinalTime(rawTimeMs: number, penalty: "NONE" | "PLUS_TWO" | "DNF"): number | null {
  switch (penalty) {
    case "NONE":
      return rawTimeMs;
    case "PLUS_TWO":
      return rawTimeMs + PLUS_TWO_MS;
    case "DNF":
      return null;
  }
}

export async function postSolve(req: Request, res: Response): Promise<void> {
  const parsed = createSolveSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, "INVALID_REQUEST", parsed.error.issues.map((i) => i.message).join("; "));
  }

  const { puzzleType, scramble, rawTimeMs, penalty, solvedAt } = parsed.data;
  const finalTimeMs = calculateFinalTime(rawTimeMs, penalty);

  const solve = await Solve.create({
    userId: req.user!.id,
    puzzleType,
    scramble,
    rawTimeMs,
    penalty,
    finalTimeMs,
    solvedAt: solvedAt ? new Date(solvedAt) : new Date(),
  });

  res.status(201).json({ success: true, solve: solve.toObject() });
}

export async function listSolves(req: Request, res: Response): Promise<void> {
  const parsed = listSolvesQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new ApiError(400, "INVALID_REQUEST", parsed.error.issues.map((i) => i.message).join("; "));
  }

  const solves = await Solve.find({ userId: req.user!.id })
    .sort({ solvedAt: -1 })
    .limit(parsed.data.limit)
    .lean();

  res.json({ success: true, count: solves.length, solves });
}

export async function deleteSolve(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string; // route is "/:id" -- never a repeated segment, always a plain string
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "INVALID_REQUEST", "Not a valid solve id.");
  }

  const result = await Solve.deleteOne({ _id: id, userId: req.user!.id });
  if (result.deletedCount === 0) {
    throw new ApiError(404, "NOT_FOUND", "No solve with that id belongs to you.");
  }
  res.json({ success: true });
}
