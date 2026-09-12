import { applyMoves, createSolvedCube, parseAlgorithm, validateCube } from "@cube-coach/cube-engine";
import { z } from "zod";

const MAX_RAW_TIME_MS = 24 * 60 * 60 * 1000; // sanity bound, not a WCA rule

/**
 * A scramble must be non-empty, parseable notation, and produce an actually-valid cube
 * state when applied to a solved cube -- using the exact same shared parser/move-apply
 * logic as everywhere else in the app (never a second, hand-rolled scramble check).
 */
const scrambleSchema = z
  .string()
  .trim()
  .min(1, "scramble cannot be empty")
  .refine(
    (value) => {
      try {
        const moves = parseAlgorithm(value);
        if (moves.length === 0) return false;
        const result = applyMoves(createSolvedCube(), moves);
        return validateCube(result).valid;
      } catch {
        return false;
      }
    },
    { message: "not a valid scramble" },
  );

export const createSolveSchema = z.object({
  puzzleType: z.literal("3x3").default("3x3"),
  scramble: scrambleSchema,
  rawTimeMs: z.number().finite().min(0).max(MAX_RAW_TIME_MS),
  penalty: z.enum(["NONE", "PLUS_TWO", "DNF"]),
  solvedAt: z.string().datetime().optional(),
});

export type CreateSolveRequest = z.infer<typeof createSolveSchema>;

export const listSolvesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(100),
});
