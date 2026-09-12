import { Schema, model, type InferSchemaType } from "mongoose";

/**
 * A user's personalization of one canonical Algorithm case, keyed by that Algorithm's
 * caseId (e.g. "oll-01") -- never a copy of the Algorithm document itself. The global
 * Algorithm collection (Phase 7's verified data) is never written to by this model;
 * "effective algorithm" is computed at presentation time by preferring
 * preferredAlgorithm when one exists, falling back to the global algorithm otherwise
 * (see client/src/features/algorithms/effectiveAlgorithm.ts).
 */
const userAlgorithmSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    algorithmId: { type: String, required: true },
    preferredAlgorithm: { type: String },
    personalAlternatives: { type: [String], default: [] },
    notes: { type: String, default: "" },
    favorite: { type: Boolean, default: false },
    learned: { type: Boolean, default: false },
    practiceCount: { type: Number, default: 0 },
    successCount: { type: Number, default: 0 },
    lastPracticedAt: { type: Date },
  },
  { timestamps: true },
);

userAlgorithmSchema.index({ userId: 1, algorithmId: 1 }, { unique: true });
userAlgorithmSchema.index({ userId: 1 });

export type UserAlgorithmDocument = InferSchemaType<typeof userAlgorithmSchema>;
export const UserAlgorithm = model<UserAlgorithmDocument>("UserAlgorithm", userAlgorithmSchema);
