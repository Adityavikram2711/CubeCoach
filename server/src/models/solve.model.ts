import { Schema, model, type InferSchemaType } from "mongoose";

/**
 * One recorded solve for an authenticated user. Timing is stored exclusively in whole
 * milliseconds (never a formatted string, never floating-point seconds) -- rawTimeMs is
 * the actual measured elapsed time, penalty is stored separately, and finalTimeMs is
 * the server-calculated effective result (null iff penalty is DNF). The server always
 * recomputes finalTimeMs from rawTimeMs + penalty itself; a client-supplied finalTimeMs
 * is never trusted (see solve.validators.ts / solve.controller.ts).
 */
const solveSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    puzzleType: { type: String, enum: ["3x3"], required: true, default: "3x3" },
    scramble: { type: String, required: true },
    rawTimeMs: { type: Number, required: true, min: 0 },
    penalty: { type: String, enum: ["NONE", "PLUS_TWO", "DNF"], required: true, default: "NONE" },
    finalTimeMs: { type: Number, default: null },
    solvedAt: { type: Date, required: true },
  },
  { timestamps: true },
);

// Every list/stats query is "this user's solves, most recent first" -- a compound
// index on exactly that shape keeps it a cheap indexed scan rather than a collection scan.
solveSchema.index({ userId: 1, solvedAt: -1 });

export type SolveDocument = InferSchemaType<typeof solveSchema>;
export const Solve = model<SolveDocument>("Solve", solveSchema);
