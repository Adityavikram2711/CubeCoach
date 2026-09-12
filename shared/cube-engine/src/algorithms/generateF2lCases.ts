/**
 * Generates F2L cases: the target corner+edge pair (canonically the front-right slot,
 * DFR+FR) sitting somewhere in the top layer, with the other 3 F2L slots solved.
 *
 * The corner is always placed at the same canonical top slot (URF); what actually
 * varies between cases is the EDGE's position *relative to* that corner (same slot,
 * each adjacent slot, or the opposite slot) and each piece's orientation -- this is
 * exactly the meaningful degree of freedom F2L cases differ by, and fixing the corner's
 * absolute slot means there is no rotational (AUF) redundancy to deduplicate: every
 * combination enumerated here is already a distinct relative arrangement, not four
 * copies of the same case at different rotations.
 *
 * SCOPE NOTE: this produces the 24 cases where BOTH the corner and edge are still in
 * the top layer, unpaired (3 corner orientations x 4 relative edge slots x 2 edge
 * orientations = 24) -- this is the largest and most fundamental subset of what
 * speedcubers commonly call "the 41 F2L cases," but the traditional 41-case sheet also
 * includes cases where one or both target pieces are already sitting (wrongly) in a
 * slot and must be extracted first. Per the project's own finding that 41 is a curated
 * convention rather than a derivable count, and per the hard rule against inventing
 * case taxonomy I can't verify against a trustworthy source, this generator is scoped
 * to the 24 mathematically well-defined "both pieces in the top layer" cases rather
 * than guessing at the remaining traditional subset. See the Phase 7 report's Known
 * Issues section for the rationale and the option to extend this later.
 */
import type { CubieCube } from "../cube/cubie.js";
import { cubieToFacelet } from "../cube/conversions.js";
import { findF2lAlgorithm } from "./f2lSearch.js";
import type { Difficulty, F2LCase } from "./types.js";

const TARGET_CORNER = 4;
const TARGET_EDGE = 8;
const CORNER_SLOT = 0; // URF, fixed canonical position for the displaced corner

interface F2lPlacement {
  cornerOrientation: number;
  edgeSlot: number;
  edgeOrientation: number;
}

function buildCaseCubie({ cornerOrientation, edgeSlot, edgeOrientation }: F2lPlacement): CubieCube {
  const cp = [0, 1, 2, 3, 4, 5, 6, 7];
  const co = [0, 0, 0, 0, 0, 0, 0, 0];
  [cp[TARGET_CORNER], cp[CORNER_SLOT]] = [cp[CORNER_SLOT]!, cp[TARGET_CORNER]!];
  co[CORNER_SLOT] = cornerOrientation;

  const ep = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const eo = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  [ep[TARGET_EDGE], ep[edgeSlot]] = [ep[edgeSlot]!, ep[TARGET_EDGE]!];
  eo[edgeSlot] = edgeOrientation;

  return { cp, co, ep, eo };
}

export function enumerateF2lPlacements(): F2lPlacement[] {
  const placements: F2lPlacement[] = [];
  for (let cornerOrientation = 0; cornerOrientation < 3; cornerOrientation++) {
    for (const edgeSlot of [0, 1, 2, 3]) {
      for (let edgeOrientation = 0; edgeOrientation < 2; edgeOrientation++) {
        placements.push({ cornerOrientation, edgeSlot, edgeOrientation });
      }
    }
  }
  return placements;
}

const RELATIVE_EDGE_POSITION: Record<number, string> = {
  0: "same slot as the corner",
  1: "the adjacent slot to the right",
  2: "the opposite slot",
  3: "the adjacent slot to the left",
};

function categoryFor(p: F2lPlacement): string {
  if (p.cornerOrientation === 0 && p.edgeOrientation === 0 && p.edgeSlot === 0) return "Basic";
  if (p.edgeSlot === 0) return "Corner in Slot";
  if (p.edgeOrientation === 1) return "Edge Orientation";
  return "Split Pair";
}

function difficultyFor(p: F2lPlacement): Difficulty {
  const complexity = p.cornerOrientation + p.edgeOrientation + (p.edgeSlot === 2 ? 1 : 0);
  if (complexity === 0) return "Beginner";
  if (complexity <= 2) return "Intermediate";
  return "Advanced";
}

export interface GeneratedF2LCase extends F2LCase {
  caseCubie: CubieCube;
}

export function generateF2lCases(): GeneratedF2LCase[] {
  const placements = enumerateF2lPlacements();
  return placements.map((placement, index) => {
    const number = index + 1;
    const caseCubie = buildCaseCubie(placement);
    const algorithmMoves = findF2lAlgorithm(caseCubie);
    if (!algorithmMoves) {
      throw new Error(`F2L case ${number} (${JSON.stringify(placement)}) has no algorithm within the search depth.`);
    }

    const category = categoryFor(placement);
    return {
      id: `f2l-${String(number).padStart(2, "0")}`,
      number,
      name: `F2L ${number} (${category})`,
      category,
      recognition: `The corner sits in the top layer; the edge is in ${RELATIVE_EDGE_POSITION[placement.edgeSlot]}. Check which direction the corner's outer sticker faces and whether the edge is flipped.`,
      algorithm: algorithmMoves.join(" "),
      alternatives: [],
      fingerTricks: "Track the pair with your eyes throughout; avoid regripping mid-algorithm where possible.",
      notes: "Generated and verified against the CubeCoach cube engine: solves this exact pair placement into the front-right slot.",
      difficulty: difficultyFor(placement),
      scrambledState: cubieToFacelet(caseCubie),
      caseCubie,
    };
  });
}
