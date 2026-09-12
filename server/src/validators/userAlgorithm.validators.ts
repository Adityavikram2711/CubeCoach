import { parseAlgorithm } from "@cube-coach/cube-engine";
import { z } from "zod";

/**
 * Validates that a string is genuinely a parseable move sequence using the SAME shared
 * parser the rest of the app trusts (never a second, hand-rolled notation check) --
 * this is what stops a user from saving "this is not an algorithm" as their preferred
 * algorithm.
 */
const algorithmNotationSchema = z.string().trim().min(1, "algorithm cannot be empty").refine(
  (value) => {
    try {
      parseAlgorithm(value);
      return true;
    } catch {
      return false;
    }
  },
  { message: "not a valid move sequence" },
);

export const upsertUserAlgorithmSchema = z.object({
  // null means "clear this override and fall back to the official algorithm" (see
  // putUserAlgorithm's $unset handling) -- distinct from omitting the field, which
  // leaves whatever was already saved untouched.
  preferredAlgorithm: algorithmNotationSchema.nullable().optional(),
  personalAlternatives: z.array(algorithmNotationSchema).max(20).optional(),
  notes: z.string().max(2000).optional(),
  favorite: z.boolean().optional(),
  learned: z.boolean().optional(),
});

export type UpsertUserAlgorithmRequest = z.infer<typeof upsertUserAlgorithmSchema>;
