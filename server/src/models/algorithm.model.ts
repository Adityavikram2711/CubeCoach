import { Schema, model, type InferSchemaType } from "mongoose";

/**
 * One shared shape for OLL, PLL, and F2L cases: `type` distinguishes the set,
 * `category`/`setup` are only meaningful for OLL/F2L (PLL cases leave them unset). This
 * mirrors shared/cube-engine's OLLCase/PLLCase/F2LCase types so the seed script can
 * write the generator output directly without a translation layer that could drift out
 * of sync with the verified data.
 */
const algorithmSchema = new Schema(
  {
    type: { type: String, enum: ["OLL", "PLL", "F2L"], required: true },
    caseId: { type: String, required: true, unique: true },
    number: { type: Number, required: true },
    name: { type: String, required: true },
    category: { type: String },
    setup: { type: String },
    recognition: { type: String, required: true },
    algorithm: { type: String, required: true },
    alternatives: { type: [String], default: [] },
    fingerTricks: { type: String, required: true },
    notes: { type: String, required: true },
    difficulty: { type: String, enum: ["Beginner", "Intermediate", "Advanced"], required: true },
    videoUrl: { type: String },
    scrambledState: {
      type: [String],
      required: true,
      validate: {
        validator: (v: string[]) => v.length === 54,
        message: "scrambledState must have exactly 54 facelets",
      },
    },
  },
  { timestamps: true },
);

algorithmSchema.index({ type: 1, number: 1 });
algorithmSchema.index({ name: "text", recognition: "text" });

export type AlgorithmDocument = InferSchemaType<typeof algorithmSchema>;
export const Algorithm = model("Algorithm", algorithmSchema);
