/**
 * The coordinate representations the two-phase solver searches over, plus the generic
 * combinatorics (permutation ranking, combination ranking) they're built from. Every
 * coordinate has an encode() and a matching decode() that reconstructs a *representative*
 * value for the piece of state that coordinate ignores (see each function's comment) --
 * decode() is only used to build move-transition and pruning tables (see moveTables.ts /
 * pruningTables.ts), never during the search itself, so its performance doesn't matter.
 *
 * Round-trip correctness (encode(decode(x)) === x) is covered by coordinates.test.ts.
 */
import type { CubieCube } from "../cube/cubie.js";

// ---------------------------------------------------------------------------
// Generic combinatorics
// ---------------------------------------------------------------------------

const FACTORIAL: number[] = [1];
for (let i = 1; i <= 12; i++) FACTORIAL.push(FACTORIAL[i - 1]! * i);

export function factorial(n: number): number {
  return FACTORIAL[n]!;
}

export function nCr(n: number, r: number): number {
  if (r < 0 || r > n) return 0;
  let result = 1;
  for (let i = 0; i < r; i++) result = (result * (n - i)) / (i + 1);
  return Math.round(result);
}

/** Lehmer-code rank of `perm` (a permutation of n distinct comparable values) among all n! orderings of that same value set. */
export function permutationRank(perm: readonly number[]): number {
  const n = perm.length;
  let rank = 0;
  for (let i = 0; i < n; i++) {
    let smaller = 0;
    for (let j = i + 1; j < n; j++) {
      if (perm[j]! < perm[i]!) smaller++;
    }
    rank += smaller * factorial(n - 1 - i);
  }
  return rank;
}

/** Inverse of permutationRank: the `rank`-th ordering of `elements` (sorted ascending), Lehmer-code order. */
export function permutationUnrank(rank: number, elements: readonly number[]): number[] {
  const n = elements.length;
  const avail = elements.slice();
  const result: number[] = [];
  let r = rank;
  for (let i = 0; i < n; i++) {
    const f = factorial(n - 1 - i);
    const idx = Math.floor(r / f);
    r -= idx * f;
    result.push(avail[idx]!);
    avail.splice(idx, 1);
  }
  return result;
}

/**
 * Combinatorial-number-system rank of a k-element subset (given as its members, any
 * order) of {0,1,2,...}. Together with combinationUnrank this is a bijection between
 * k-subsets and [0, C(n,k)) for whatever n the members happen to range over.
 */
export function combinationRank(members: readonly number[]): number {
  const sorted = members.slice().sort((a, b) => a - b);
  let rank = 0;
  for (let i = 0; i < sorted.length; i++) {
    rank += nCr(sorted[i]!, i + 1);
  }
  return rank;
}

/** Inverse of combinationRank: the k ascending member positions for a given rank. */
export function combinationUnrank(rank: number, k: number): number[] {
  const result: number[] = new Array(k);
  let remaining = rank;
  for (let i = k; i >= 1; i--) {
    let c = i - 1;
    while (nCr(c + 1, i) <= remaining) c++;
    result[i - 1] = c;
    remaining -= nCr(c, i);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Corner orientation: 3^7 = 2187 states (the 8th corner's twist is determined
// by the invariant that the sum of all 8 must be 0 mod 3).
// ---------------------------------------------------------------------------

export const CORNER_ORIENTATION_STATES = 2187;

export function encodeCornerOrientation(co: readonly number[]): number {
  let coord = 0;
  for (let i = 0; i < 7; i++) coord = coord * 3 + co[i]!;
  return coord;
}

/** Reconstructs a full 8-entry co array; co[7] is whatever makes the sum 0 mod 3. */
export function decodeCornerOrientation(coord: number): number[] {
  const co = new Array(8).fill(0);
  let sum = 0;
  let c = coord;
  for (let i = 6; i >= 0; i--) {
    co[i] = c % 3;
    c = Math.floor(c / 3);
    sum += co[i];
  }
  co[7] = (3 - (sum % 3)) % 3;
  return co;
}

// ---------------------------------------------------------------------------
// Edge orientation: 2^11 = 2048 states (12th edge's flip is determined by the
// sum-0-mod-2 invariant).
// ---------------------------------------------------------------------------

export const EDGE_ORIENTATION_STATES = 2048;

export function encodeEdgeOrientation(eo: readonly number[]): number {
  let coord = 0;
  for (let i = 0; i < 11; i++) coord = coord * 2 + eo[i]!;
  return coord;
}

export function decodeEdgeOrientation(coord: number): number[] {
  const eo = new Array(12).fill(0);
  let sum = 0;
  let c = coord;
  for (let i = 10; i >= 0; i--) {
    eo[i] = c % 2;
    c = Math.floor(c / 2);
    sum += eo[i];
  }
  eo[11] = sum % 2;
  return eo;
}

// ---------------------------------------------------------------------------
// UD-slice membership: which C(12,4) = 495 combination of the 12 edge slots
// currently holds the 4 "equator" edge identities (FR/FL/BR/BL = identities
// 8-11 in EDGE_NAMES). Phase 1's third goal is driving this to 0 (those 4
// identities sitting in slots 8-11, in any order -- exact order is phase 2's job).
// ---------------------------------------------------------------------------

export const UD_SLICE_STATES = 495;

export function encodeUdSlice(ep: readonly number[]): number {
  const members: number[] = [];
  for (let slot = 0; slot < 12; slot++) {
    if (ep[slot]! >= 8) members.push(slot);
  }
  return combinationRank(members);
}

/** A representative full ep array for this combination class (specific identity assignment within each group doesn't affect the coordinate). */
export function decodeUdSlice(coord: number): number[] {
  const sliceSlots = new Set(combinationUnrank(coord, 4));
  const ep = new Array(12).fill(0);
  let nextSlice = 8;
  let nextOther = 0;
  for (let slot = 0; slot < 12; slot++) {
    ep[slot] = sliceSlots.has(slot) ? nextSlice++ : nextOther++;
  }
  return ep;
}

// ---------------------------------------------------------------------------
// Corner permutation: full 8! = 40320 orderings.
// ---------------------------------------------------------------------------

export const CORNER_PERMUTATION_STATES = 40320;

export function encodeCornerPermutation(cp: readonly number[]): number {
  return permutationRank(cp);
}

export function decodeCornerPermutation(coord: number): number[] {
  return permutationUnrank(coord, [0, 1, 2, 3, 4, 5, 6, 7]);
}

// ---------------------------------------------------------------------------
// Phase-2 edge permutation of the 8 UD-layer edges (identities 0-7, valid only
// once phase 1's UD-slice goal is met, i.e. they occupy exactly slots 0-7): 8! = 40320.
// ---------------------------------------------------------------------------

export const EDGE_PERMUTATION_8_STATES = 40320;

export function encodeEdgePermutation8(ep: readonly number[]): number {
  return permutationRank(ep.slice(0, 8));
}

/** Reconstructs a full 12-entry ep with slots 0-7 holding this permutation and slots 8-11 holding identities 8-11 in order. */
export function decodeEdgePermutation8(coord: number): number[] {
  const first8 = permutationUnrank(coord, [0, 1, 2, 3, 4, 5, 6, 7]);
  return [...first8, 8, 9, 10, 11];
}

// ---------------------------------------------------------------------------
// Phase-2 permutation of the 4 UD-slice edges (identities 8-11) among slots
// 8-11: 4! = 24.
// ---------------------------------------------------------------------------

export const UD_SLICE_PERMUTATION_STATES = 24;

export function encodeUdSlicePermutation(ep: readonly number[]): number {
  return permutationRank(ep.slice(8, 12).map((v) => v - 8));
}

/** Reconstructs a full 12-entry ep with slots 0-7 holding identities 0-7 in order and slots 8-11 holding this permutation. */
export function decodeUdSlicePermutation(coord: number): number[] {
  const last4 = permutationUnrank(coord, [0, 1, 2, 3]).map((v) => v + 8);
  return [0, 1, 2, 3, 4, 5, 6, 7, ...last4];
}

// ---------------------------------------------------------------------------
// Whole-cube convenience: encode all three phase-1 coordinates from one CubieCube.
// ---------------------------------------------------------------------------

export interface Phase1Coordinates {
  cornerOrientation: number;
  edgeOrientation: number;
  udSlice: number;
}

export function encodePhase1(cubie: CubieCube): Phase1Coordinates {
  return {
    cornerOrientation: encodeCornerOrientation(cubie.co),
    edgeOrientation: encodeEdgeOrientation(cubie.eo),
    udSlice: encodeUdSlice(cubie.ep),
  };
}

export interface Phase2Coordinates {
  cornerPermutation: number;
  edgePermutation8: number;
  udSlicePermutation: number;
}

export function encodePhase2(cubie: CubieCube): Phase2Coordinates {
  return {
    cornerPermutation: encodeCornerPermutation(cubie.cp),
    edgePermutation8: encodeEdgePermutation8(cubie.ep),
    udSlicePermutation: encodeUdSlicePermutation(cubie.ep),
  };
}
