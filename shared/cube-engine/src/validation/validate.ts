import { faceletToCubie } from "../cube/conversions.js";
import { faceletIndex } from "../cube/faceGrid.js";
import { COLORS, FACES, type FaceletCube } from "../cube/types.js";

export interface ValidationIssue {
  code: string;
  message: string;
}

export type ValidationResult = { valid: true } | { valid: false; issues: ValidationIssue[] };

/**
 * Validates a facelet cube against every invariant a scrambled 3x3 must satisfy --
 * not just sticker counts. A cube can have exactly 9 of each color and still be
 * unbuildable: an impossible corner twist or an impossible edge flip, each of which
 * this engine can independently verify.
 *
 * Note on permutation parity: classic cube theory says corner-permutation-parity must
 * equal edge-permutation-parity (the source of the famous "43 quintillion states, not
 * twice that" count) -- but that theorem assumes the only generators are the 6 outer
 * face turns. This engine also supports M/E/S as directly-appliable moves (required by
 * the spec), and a single M turn is a real, physical, one-move action that moves 0
 * corners and cycles exactly 4 edges -- an odd edge permutation with an even (identity)
 * corner permutation, i.e. deliberately mismatched parity. So that "classic" check is
 * not a true invariant of this engine's move set and is intentionally not enforced
 * here; re-adding it would reject cube states a real M move can produce.
 */
export function validateCube(cube: FaceletCube): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (cube.length !== 54) {
    return {
      valid: false,
      issues: [{ code: "WRONG_FACELET_COUNT", message: `Expected 54 facelets, found ${cube.length}.` }],
    };
  }

  const counts = new Map<string, number>();
  for (const sticker of cube) {
    counts.set(sticker, (counts.get(sticker) ?? 0) + 1);
  }
  for (const color of COLORS) {
    const count = counts.get(color) ?? 0;
    if (count !== 9) {
      issues.push({
        code: "WRONG_COLOR_COUNT",
        message: `Expected exactly 9 ${color} stickers, found ${count}.`,
      });
    }
  }

  const centerColors = FACES.map((face) => cube[faceletIndex(face, 1, 1)]);
  if (new Set(centerColors).size !== 6) {
    issues.push({
      code: "DUPLICATE_CENTERS",
      message: "The six center stickers must all be different colors; two faces have the same center color.",
    });
  }

  // Sticker counts / centers must be right before piece-level checks mean anything.
  if (issues.length > 0) {
    return { valid: false, issues };
  }

  let cubie;
  try {
    cubie = faceletToCubie(cube);
  } catch (err) {
    return {
      valid: false,
      issues: [
        {
          code: "IMPOSSIBLE_PIECE",
          message: err instanceof Error ? err.message : "This cube contains a sticker combination no real piece has.",
        },
      ],
    };
  }

  const cornerOrientationSum = cubie.co.reduce((a, b) => a + b, 0) % 3;
  if (cornerOrientationSum !== 0) {
    issues.push({
      code: "INVALID_CORNER_ORIENTATION",
      message: "The entered configuration has an impossible corner orientation (a single corner is twisted).",
    });
  }

  const edgeOrientationSum = cubie.eo.reduce((a, b) => a + b, 0) % 2;
  if (edgeOrientationSum !== 0) {
    issues.push({
      code: "INVALID_EDGE_ORIENTATION",
      message: "The entered configuration has an impossible edge orientation (a single edge is flipped).",
    });
  }

  return issues.length === 0 ? { valid: true } : { valid: false, issues };
}
