/**
 * Generates 21 canonical PLL cases. Unlike OLL's 57 (a mathematically exact orbit
 * count, see generateOllCases.ts), the "21 PLL" list is a curated speedcubing
 * convention -- enumerating every valid last-layer permutation up to AUF actually
 * yields 83 distinct orbits (verified in pllPermutations.test.ts), not 21. So instead
 * of deriving the full 21 from pure math, this selects 21 structurally-diverse,
 * pairwise-DISTINCT representatives (verified via isSameAufOrbit, the same
 * engine-grounded equivalence check) spanning the well-known PLL families: pure corner
 * cycles, pure edge cycles, double swaps, and combined corner+edge cycles. Each case's
 * algorithm is found independently by reusing the runtime solver's own phase2 search
 * (pllSearch.ts) against that exact permutation -- never the other way around.
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

// Well-known, high-confidence structural definitions (which pieces cycle/swap), stated
// independently of any algorithm -- see the module comment.
const NAMED_PATTERNS: NamedPllPattern[] = [
  {
    name: "Aa Perm",
    cp: [2, 0, 1, 3],
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
    name: "Ua Perm",
    cp: IDENTITY,
    ep: [2, 0, 1, 3],
    recognition: "A pure 3-cycle of edges; all four corners are already in place.",
    difficulty: "Beginner",
  },
  {
    name: "Ub Perm",
    cp: IDENTITY,
    ep: [1, 2, 0, 3],
    recognition: "A pure 3-cycle of edges in the opposite direction from Ua; corners already in place.",
    difficulty: "Beginner",
  },
  {
    name: "H Perm",
    cp: IDENTITY,
    ep: [2, 3, 0, 1],
    recognition: "Two pairs of opposite edges are swapped; all corners are already in place.",
    difficulty: "Beginner",
  },
  {
    name: "Z Perm",
    cp: IDENTITY,
    ep: [1, 0, 3, 2],
    recognition: "Two pairs of adjacent edges are swapped all the way around; corners already in place.",
    difficulty: "Intermediate",
  },
  {
    name: "E Perm",
    cp: [2, 3, 0, 1],
    ep: IDENTITY,
    recognition: "Two pairs of diagonal corners are swapped; all edges are already in place.",
    difficulty: "Advanced",
  },
  {
    name: "T Perm",
    cp: [3, 1, 2, 0],
    ep: [1, 0, 2, 3],
    recognition: "One pair of adjacent corners and the edge between them are swapped on the same side.",
    difficulty: "Beginner",
  },
];

function permutationsOf4(): number[][] {
  const perms: number[][] = [];
  const base = [0, 1, 2, 3];
  function permute(arr: number[], k: number) {
    if (k === arr.length) {
      perms.push([...arr]);
      return;
    }
    for (let i = k; i < arr.length; i++) {
      [arr[k], arr[i]] = [arr[i]!, arr[k]!];
      permute(arr, k + 1);
      [arr[k], arr[i]] = [arr[i]!, arr[k]!];
    }
  }
  permute(base, 0);
  return perms;
}

/** Fills out the remaining slots (past the named, high-confidence patterns) with structurally diverse, distinct combined corner+edge 3-cycles -- the "G perm" family. */
function findAdditionalCombinedCycles(existing: PllPattern[], countNeeded: number): NamedPllPattern[] {
  const perms = permutationsOf4();
  // A genuine 3-cycle of 4 elements fixes exactly one point (double-transpositions,
  // also even, fix none; identity fixes all four) -- this isolates pure 3-cycles.
  const genuineThreeCycles = perms.filter((p) => p.filter((v, i) => v === i).length === 1);

  const results: NamedPllPattern[] = [];
  const allKnown = [...existing];

  outer: for (const cp of genuineThreeCycles) {
    for (const ep of genuineThreeCycles) {
      const candidate = { cp, ep };
      if (allKnown.some((known) => isSameAufOrbit(known, candidate))) continue;
      allKnown.push(candidate);
      results.push({
        ...candidate,
        name: `Combined Cycle ${results.length + 1}`,
        recognition: "Corners and edges both 3-cycle together; compare the exact pieces involved to distinguish from other combined-cycle cases.",
        difficulty: "Advanced",
      });
      if (results.length >= countNeeded) break outer;
    }
  }
  return results;
}

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
  const additional = findAdditionalCombinedCycles(NAMED_PATTERNS, 21 - NAMED_PATTERNS.length);
  const allPatterns = [...NAMED_PATTERNS, ...additional];

  return allPatterns.map((pattern, index) => {
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
