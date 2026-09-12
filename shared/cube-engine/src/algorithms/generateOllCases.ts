/**
 * Generates the canonical 57 OLL cases. The case SET is derived mathematically (every
 * valid last-layer corner/edge orientation pattern, deduplicated by which patterns are
 * "the same case rotated" -- verified in generateOllCases.test.ts to be exactly 57,
 * matching the well-known count independently), not copied from an external list. Each
 * case's algorithm is found by an independent search (ollSearch.ts) against that exact
 * pattern -- the algorithm is never used to define the case it solves.
 */
import type { CubieCube } from "../cube/cubie.js";
import { cubieToFacelet } from "../cube/conversions.js";
import { findOllAlgorithm, rotateOllPattern } from "./ollSearch.js";
import type { Difficulty, OLLCase } from "./types.js";

function validCornerOrientations(): number[][] {
  const combos: number[][] = [];
  for (let a = 0; a < 3; a++)
    for (let b = 0; b < 3; b++)
      for (let c = 0; c < 3; c++)
        for (let d = 0; d < 3; d++) if ((a + b + c + d) % 3 === 0) combos.push([a, b, c, d]);
  return combos;
}

function validEdgeOrientations(): number[][] {
  const combos: number[][] = [];
  for (let a = 0; a < 2; a++)
    for (let b = 0; b < 2; b++)
      for (let c = 0; c < 2; c++)
        for (let d = 0; d < 2; d++) if ((a + b + c + d) % 2 === 0) combos.push([a, b, c, d]);
  return combos;
}

function key(co: number[], eo: number[]): string {
  return `${co.join(",")}|${eo.join(",")}`;
}

/** The 57 canonical (co, eo) patterns, one representative per rotation-orbit, in a deterministic order. */
export function enumerateOllPatterns(): Array<{ co: number[]; eo: number[] }> {
  const seen = new Set<string>();
  const representatives: Array<{ co: number[]; eo: number[] }> = [];

  for (const co of validCornerOrientations()) {
    for (const eo of validEdgeOrientations()) {
      if (co.every((c) => c === 0) && eo.every((e) => e === 0)) continue; // solved, not a case
      const k = key(co, eo);
      if (seen.has(k)) continue;

      // Mark this whole rotation-orbit as seen, and record the lexicographically
      // smallest member as the deterministic canonical representative.
      let orbit: Array<{ co: number[]; eo: number[] }> = [{ co, eo }];
      let curCo = co,
        curEo = eo;
      for (let i = 0; i < 3; i++) {
        [curCo, curEo] = rotateOllPattern(curCo, curEo);
        orbit.push({ co: curCo, eo: curEo });
      }
      for (const state of orbit) seen.add(key(state.co, state.eo));
      orbit.sort((a, b) => key(a.co, a.eo).localeCompare(key(b.co, b.eo)));
      representatives.push(orbit[0]!);
    }
  }

  representatives.sort((a, b) => key(a.co, a.eo).localeCompare(key(b.co, b.eo)));
  return representatives;
}

function categoryFor(eo: number[]): string {
  const orientedIndices = eo.reduce<number[]>((acc, v, i) => (v === 0 ? [...acc, i] : acc), []);
  if (orientedIndices.length === 0) return "Dot";
  if (orientedIndices.length === 4) return "Corners Only";
  // length 2: opposite pair (0,2) or (1,3) forms a "Line"; any adjacent pair forms an "L"
  const [a, b] = orientedIndices;
  const isOpposite = Math.abs(a! - b!) === 2;
  return isOpposite ? "Line" : "L-Shape";
}

function difficultyFor(co: number[], eo: number[]): Difficulty {
  const twistedCorners = co.filter((c) => c !== 0).length;
  const flippedEdges = eo.filter((e) => e !== 0).length;
  const complexity = twistedCorners + flippedEdges;
  if (complexity <= 2) return "Beginner";
  if (complexity <= 4) return "Intermediate";
  return "Advanced";
}

function buildCaseCubie(co4: number[], eo4: number[]): CubieCube {
  return {
    cp: [0, 1, 2, 3, 4, 5, 6, 7],
    co: [...co4, 0, 0, 0, 0],
    ep: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    eo: [...eo4, 0, 0, 0, 0, 0, 0, 0, 0],
  };
}

export interface GeneratedOllCase extends OLLCase {
  /** The exact canonical case pattern this entry was generated from -- used by tests to re-verify. */
  caseCubie: CubieCube;
}

export function generateOllCases(): GeneratedOllCase[] {
  const patterns = enumerateOllPatterns();
  const cases: GeneratedOllCase[] = [];

  patterns.forEach((pattern, index) => {
    const number = index + 1;
    const caseCubie = buildCaseCubie(pattern.co, pattern.eo);
    const algorithmMoves = findOllAlgorithm(caseCubie);
    if (!algorithmMoves) {
      throw new Error(`OLL case ${number} (${JSON.stringify(pattern)}) has no algorithm within the search depth.`);
    }

    const category = categoryFor(pattern.eo);
    cases.push({
      id: `oll-${String(number).padStart(2, "0")}`,
      number,
      name: `OLL ${number} (${category})`,
      category,
      recognition: `${
        pattern.eo.every((e) => e === 0)
          ? "All four top edges are already correctly oriented; only the corners need twisting."
          : pattern.eo.every((e) => e === 1)
            ? "None of the top edges are oriented -- no yellow (or top-color) shows on top from any edge."
            : "Two top edges are oriented and two are flipped; check which two form the visible line or corner shape."
      }`,
      algorithm: algorithmMoves.join(" "),
      alternatives: [],
      fingerTricks: "Practice this algorithm slowly first, then build speed with consistent regrips.",
      notes: "Generated and verified against the CubeCoach cube engine: solves this exact orientation pattern.",
      difficulty: difficultyFor(pattern.co, pattern.eo),
      scrambledState: cubieToFacelet(caseCubie),
      caseCubie,
    });
  });

  return cases;
}
