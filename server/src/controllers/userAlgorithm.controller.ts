import type { Request, Response } from "express";
import { ApiError } from "../middleware/errorHandler.js";
import { Algorithm } from "../models/algorithm.model.js";
import { UserAlgorithm } from "../models/userAlgorithm.model.js";
import { recordPracticeSchema } from "../validators/practice.validators.js";
import { upsertUserAlgorithmSchema } from "../validators/userAlgorithm.validators.js";

/**
 * Every query/update in this file is scoped by req.user.id (set only by requireAuth
 * from a verified JWT) -- never by anything the client sends in the body or params, so
 * one user can never read or modify another user's personalization.
 */

async function assertAlgorithmExists(algorithmId: string): Promise<void> {
  const exists = await Algorithm.exists({ caseId: algorithmId });
  if (!exists) {
    throw new ApiError(404, "ALGORITHM_NOT_FOUND", `No algorithm case with id "${algorithmId}".`);
  }
}

export async function listUserAlgorithms(req: Request, res: Response): Promise<void> {
  const records = await UserAlgorithm.find({ userId: req.user!.id }).lean();
  res.json({ success: true, count: records.length, records });
}

export async function getUserAlgorithm(req: Request, res: Response): Promise<void> {
  // "No personalization yet" is an expected, common state (most cases for most users),
  // not an error -- returning 200 with record: null keeps the browser network log and
  // client error-handling free of noise for something that isn't actually a failure.
  const record = await UserAlgorithm.findOne({ userId: req.user!.id, algorithmId: req.params.algorithmId }).lean();
  res.json({ success: true, record: record ?? null });
}

export async function putUserAlgorithm(req: Request, res: Response): Promise<void> {
  const algorithmId = req.params.algorithmId as string; // route is "/:algorithmId" -- never a repeated segment, always a plain string
  await assertAlgorithmExists(algorithmId);

  const parsed = upsertUserAlgorithmSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, "INVALID_REQUEST", parsed.error.issues.map((i) => i.message).join("; "));
  }

  // preferredAlgorithm: null means "clear the override" -- $set can't represent that
  // (it would store a literal null), so route it to $unset instead.
  const { preferredAlgorithm, ...rest } = parsed.data;
  const update: Record<string, unknown> = { $set: rest };
  if (preferredAlgorithm === null) {
    update.$unset = { preferredAlgorithm: "" };
  } else if (preferredAlgorithm !== undefined) {
    (update.$set as Record<string, unknown>).preferredAlgorithm = preferredAlgorithm;
  }

  const record = await UserAlgorithm.findOneAndUpdate({ userId: req.user!.id, algorithmId }, update, {
    upsert: true,
    new: true,
    runValidators: true,
  }).lean();

  res.json({ success: true, record });
}

export async function deleteUserAlgorithm(req: Request, res: Response): Promise<void> {
  const result = await UserAlgorithm.deleteOne({ userId: req.user!.id, algorithmId: req.params.algorithmId });
  if (result.deletedCount === 0) {
    throw new ApiError(404, "NOT_FOUND", "No personalization exists for this algorithm.");
  }
  res.json({ success: true });
}

async function toggleField(req: Request, res: Response, field: "favorite" | "learned"): Promise<void> {
  const algorithmId = req.params.algorithmId as string;
  await assertAlgorithmExists(algorithmId);

  const existing = await UserAlgorithm.findOne({ userId: req.user!.id, algorithmId });
  const nextValue = !existing?.[field];

  const record = await UserAlgorithm.findOneAndUpdate(
    { userId: req.user!.id, algorithmId },
    { $set: { [field]: nextValue } },
    { upsert: true, new: true, runValidators: true },
  ).lean();

  res.json({ success: true, record });
}

export const postToggleFavorite = (req: Request, res: Response) => toggleField(req, res, "favorite");
export const postToggleLearned = (req: Request, res: Response) => toggleField(req, res, "learned");

/**
 * Records one completed practice attempt (Phase 9 trainer). Uses a single atomic
 * findOneAndUpdate with $inc rather than read-modify-write, so two concurrent
 * submissions for the same case always both land correctly instead of one clobbering
 * the other's read-based increment.
 */
export async function postRecordPractice(req: Request, res: Response): Promise<void> {
  const algorithmId = req.params.algorithmId as string;
  await assertAlgorithmExists(algorithmId);

  const parsed = recordPracticeSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, "INVALID_REQUEST", parsed.error.issues.map((i) => i.message).join("; "));
  }

  const inc: Record<string, number> = { practiceCount: 1 };
  if (parsed.data.success) inc.successCount = 1;

  const record = await UserAlgorithm.findOneAndUpdate(
    { userId: req.user!.id, algorithmId },
    { $inc: inc, $set: { lastPracticedAt: new Date() } },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
  ).lean();

  res.json({ success: true, record });
}
