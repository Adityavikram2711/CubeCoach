import type { Request, Response } from "express";
import { ApiError } from "../middleware/errorHandler.js";
import { Algorithm } from "../models/algorithm.model.js";
import { listAlgorithmsQuerySchema } from "../validators/algorithm.validators.js";

export async function getAlgorithms(req: Request, res: Response): Promise<void> {
  const parsed = listAlgorithmsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new ApiError(400, "INVALID_REQUEST", parsed.error.issues.map((i) => i.message).join("; "));
  }
  const { type, difficulty, category, search } = parsed.data;

  const filter: Record<string, unknown> = {};
  if (type) filter.type = type;
  if (difficulty) filter.difficulty = difficulty;
  if (category) filter.category = category;
  if (search) filter.$text = { $search: search };

  const cases = await Algorithm.find(filter).sort({ type: 1, number: 1 }).lean();
  res.json({ success: true, count: cases.length, cases });
}

export async function getAlgorithmById(req: Request, res: Response): Promise<void> {
  const algorithmCase = await Algorithm.findOne({ caseId: req.params.id }).lean();
  if (!algorithmCase) {
    throw new ApiError(404, "NOT_FOUND", `No algorithm case with id "${req.params.id}".`);
  }
  res.json({ success: true, case: algorithmCase });
}
