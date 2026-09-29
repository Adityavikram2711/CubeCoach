/**
 * Generates the 21 canonical PLL cases (Aa, Ab, E, F, Ga, Gb, Gc, Gd, H, Ja, Jb, Na, Nb,
 * Ra, Rb, T, Ua, Ub, V, Y, Z). Unlike OLL's 57 (a mathematically exact orbit count, see
 * generateOllCases.ts), the "21 PLL" list is a curated speedcubing convention --
 * enumerating every valid last-layer permutation up to AUF actually yields 72 distinct
 * orbits (verified in pllPermutations.test.ts), not 21.
 *
 * Every pattern below was independently verified by executing a real, published
 * algorithm for that named case (sourced from jperm.net/algs/pll) through this engine's
 * own move parser/applier from a solved cube, then reading back which last-layer
 * permutation actually resulted -- never hand-derived or assumed from a name or picture.
 * Each is stored as its "canonical" AUF representative (corners at identity for a
 * pure-edge case, edges at identity for a pure-corner case) for readability; the
 * specific representative doesn't matter for correctness since the generated
 * scrambledState/algorithm always correspond to whichever one is stored.
 *
 * A prior version of this file had only 8 of these 21 patterns hand-specified, filling
 * the rest with arbitrary auto-picked "combined cycle" permutations under generic names.
 * That approach also relied on a since-fixed bug in pllPermutations.ts's AUF-equivalence
 * check (it conjugated by a whole-cube "y" rotation instead of a real "U" turn), which
 * silently let two pairs of genuinely-identical cases through as if they were distinct
 * (the stored "E Perm" was an exact duplicate of "H Perm"; "T Perm" was an exact
 * duplicate of one of the auto-picked fillers). Both problems are fixed here: all 21
 * real identities are now explicit, and the equivalence check they (and this file's own
 * dedup) rely on is correct.
 *
 * Each case's algorithm is found independently by reusing the runtime solver's own
 * phase2 search (pllSearch.ts) against that exact permutation -- this file never copies
 * jperm's algorithm text into the shipped data, only the verified case IDENTITY.
 */
import type { CubieCube } from "../cube/cubie.js";
import { cubieToFacelet } from "../cube/conversions.js";
import { isSameAufOrbit, type PllPattern } from "./pllPermutations.js";
import { findPllAlgorithm } from "./pllSearch.js";
import type { Difficulty, PLLCase } from "./types.js";

interface NamedPllPattern extends PllPattern {
  name: string;
  recognition: string;
  difficulty: Difficulty;
}

const IDENTITY = [0, 1, 2, 3];

// All 21 canonical identities, alphabetically ordered, each verified against a real
// published algorithm for that case -- see the module comment above.
const NAMED_PATTERNS: NamedPllPattern[] = [
  {
    name: "Aa Perm",
    cp: [0, 3, 1, 2],
    ep: IDENTITY,
    recognition: "A pure 3-cycle of corners; all four edges are already in place.",
    difficulty: "Intermediate",
  },
  {
    name: "Ab Perm",
    cp: [1, 2, 0, 3],
    ep: IDENTITY,
    recognition: "A pure 3-cycle of corners in the opposite direction from Aa; edges already in place.",
    difficulty: "Intermediate",
  },
  {
    name: "E Perm",
    cp: [3, 2, 1, 0],
    ep: IDENTITY,
    recognition: "Two pairs of corners are swapped; all four edges are already in place.",
    difficulty: "Advanced",
  },
  {
    name: "F Perm",
    cp: [3, 1, 2, 0],
    ep: [2, 1, 0, 3],
    recognition: "One pair of corners is swapped, and one pair of edges is swapped elsewhere in the layer.",
    difficulty: "Intermediate",
  },
  {
    name: "Ga Perm",
    cp: [3, 1, 2, 0],
    ep: [2, 0, 3, 1],
    recognition: "One pair of corners is swapped while all four edges 4-cycle together.",
    difficulty: "Advanced",
  },
  {
    name: "Gb Perm",
    cp: [3, 1, 2, 0],
    ep: [1, 3, 0, 2],
    recognition: "One pair of corners is swapped while all four edges 4-cycle together, the opposite rotational sense from Ga.",
    difficulty: "Advanced",
  },
  {
    name: "Gc Perm",
    cp: [3, 1, 2, 0],
    ep: [3, 2, 0, 1],
    recognition: "One pair of corners is swapped while all four edges 4-cycle together (a distinct 4-cycle pattern from Ga/Gb).",
    difficulty: "Advanced",
  },
  {
    name: "Gd Perm",
    cp: [3, 1, 2, 0],
    ep: [2, 3, 1, 0],
    recognition: "One pair of corners is swapped while all four edges 4-cycle together (a distinct 4-cycle pattern from Ga/Gb/Gc).",
    difficulty: "Advanced",
  },
  {
    name: "H Perm",
    cp: IDENTITY,
    ep: [2, 3, 0, 1],
    recognition: "Two pairs of opposite edges are swapped; all corners are already in place.",
    difficulty: "Beginner",
  },
  {
    name: "Ja Perm",
    cp: [3, 1, 2, 0],
    ep: [0, 2, 1, 3],
    recognition: "One pair of corners is swapped, and a different pair of edges is swapped -- compare the exact edges involved to distinguish from Jb.",
    difficulty: "Intermediate",
  },
  {
    name: "Jb Perm",
    cp: [0, 3, 1, 2],
    ep: [0, 2, 3, 1],
    recognition: "One pair of corners is swapped while three edges 3-cycle together.",
    difficulty: "Intermediate",
  },
  {
    name: "Na Perm",
    cp: [0, 3, 2, 1],
    ep: [0, 3, 2, 1],
    recognition: "One pair of corners is swapped, and the matching pair of edges is swapped in the same two slots.",
    difficulty: "Advanced",
  },
  {
    name: "Nb Perm",
    cp: [2, 1, 0, 3],
    ep: [0, 3, 2, 1],
    recognition: "One pair of corners is swapped, and a different pair of edges is swapped in the other two slots -- compare to Na.",
    difficulty: "Advanced",
  },
  {
    name: "Ra Perm",
    cp: [0, 3, 1, 2],
    ep: [1, 3, 2, 0],
    recognition: "Three corners 3-cycle together, and three edges 3-cycle together in a different grouping.",
    difficulty: "Advanced",
  },
  {
    name: "Rb Perm",
    cp: [1, 2, 0, 3],
    ep: [0, 3, 1, 2],
    recognition: "Three corners 3-cycle together, and three edges 3-cycle together in a different grouping (mirrored from Ra).",
    difficulty: "Advanced",
  },
  {
    name: "T Perm",
    cp: [3, 1, 2, 0],
    ep: [0, 3, 2, 1],
    recognition: "One pair of corners is swapped, and one pair of edges is swapped -- compare the exact pieces involved to distinguish from F.",
    difficulty: "Beginner",
  },
  {
    name: "Ua Perm",
    cp: IDENTITY,
    ep: [3, 0, 2, 1],
    recognition: "A pure 3-cycle of edges; all four corners are already in place.",
    difficulty: "Beginner",
  },
  {
    name: "Ub Perm",
    cp: IDENTITY,
    ep: [1, 3, 2, 0],
    recognition: "A pure 3-cycle of edges in the opposite direction from Ua; corners already in place.",
    difficulty: "Beginner",
  },
  {
    name: "V Perm",
    cp: [2, 1, 0, 3],
    ep: [0, 2, 1, 3],
    recognition: "One pair of corners is swapped, and one pair of edges is swapped -- compare the exact pieces involved to distinguish from Y.",
    difficulty: "Advanced",
  },
  {
    name: "Y Perm",
    cp: [2, 1, 0, 3],
    ep: [0, 1, 3, 2],
    recognition: "One pair of corners is swapped, and one pair of edges is swapped -- compare the exact pieces involved to distinguish from V.",
    difficulty: "Intermediate",
  },
  {
    name: "Z Perm",
    cp: IDENTITY,
    ep: [3, 2, 1, 0],
    recognition: "Two pairs of adjacent edges are swapped all the way around; corners already in place.",
    difficulty: "Intermediate",
  },
];

function buildCaseCubie(cp4: number[], ep4: number[]): CubieCube {
  return {
    cp: [...cp4, 4, 5, 6, 7],
    co: [0, 0, 0, 0, 0, 0, 0, 0],
    ep: [...ep4, 4, 5, 6, 7, 8, 9, 10, 11],
    eo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  };
}

export interface GeneratedPllCase extends PLLCase {
  caseCubie: CubieCube;
}

export function generatePllCases(): GeneratedPllCase[] {
  // Defensive check, not a fallback: every one of the 21 identities above must be
  // genuinely distinct. If this ever fails, it means a NAMED_PATTERNS entry above is
  // wrong (a typo, or a duplicate of another case) -- it must be fixed there, not
  // papered over here.
  for (let i = 0; i < NAMED_PATTERNS.length; i++) {
    for (let j = i + 1; j < NAMED_PATTERNS.length; j++) {
      const a = NAMED_PATTERNS[i]!;
      const b = NAMED_PATTERNS[j]!;
      if (isSameAufOrbit(a, b)) {
        throw new Error(`generatePllCases: "${a.name}" and "${b.name}" are the same permutation up to AUF -- fix NAMED_PATTERNS.`);
      }
    }
  }

  return NAMED_PATTERNS.map((pattern, index) => {
    const number = index + 1;
    const caseCubie = buildCaseCubie(pattern.cp, pattern.ep);
    const algorithmMoves = findPllAlgorithm(caseCubie);
    if (!algorithmMoves) {
      throw new Error(`PLL case ${number} (${pattern.name}) has no algorithm (phase2 search failed).`);
    }

    return {
      id: `pll-${String(number).padStart(2, "0")}`,
      number,
      name: pattern.name,
      recognition: pattern.recognition,
      algorithm: algorithmMoves.join(" "),
      alternatives: [],
      fingerTricks: "Keep your hands relaxed and look ahead to the next case while executing.",
      notes: "Generated and verified against the CubeCoach cube engine: solves this exact permutation.",
      difficulty: pattern.difficulty,
      scrambledState: cubieToFacelet(caseCubie),
      caseCubie,
    };
  });
}
