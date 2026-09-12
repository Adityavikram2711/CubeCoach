/**
 * The 8 corner and 12 edge cubie "slots", identified by their 3D position (see
 * coordinates/rotations.ts for the axis convention: x=R, y=U, z=F).
 *
 * A corner touches all three axis-pairs (U/D, L/R, F/B); an edge touches exactly two
 * of them (its zero coordinate marks the pair it doesn't touch). These helpers split a
 * slot's position into its axis-typed facing vectors, which conversions.ts uses to read
 * off (and write back) sticker colors without any hand-typed facelet-index table.
 */
import type { Vec3 } from "../coordinates/rotations.js";

export const CORNER_POSITIONS: Vec3[] = [
  [1, 1, 1], // URF
  [-1, 1, 1], // UFL
  [-1, 1, -1], // ULB
  [1, 1, -1], // UBR
  [1, -1, 1], // DFR
  [-1, -1, 1], // DLF
  [-1, -1, -1], // DBL
  [1, -1, -1], // DRB
];
export const CORNER_NAMES = ["URF", "UFL", "ULB", "UBR", "DFR", "DLF", "DBL", "DRB"] as const;

export const EDGE_POSITIONS: Vec3[] = [
  [0, 1, 1], // UF
  [1, 1, 0], // UR
  [0, 1, -1], // UB
  [-1, 1, 0], // UL
  [0, -1, 1], // DF
  [1, -1, 0], // DR
  [0, -1, -1], // DB
  [-1, -1, 0], // DL
  [1, 0, 1], // FR
  [-1, 0, 1], // FL
  [1, 0, -1], // BR
  [-1, 0, -1], // BL
];
export const EDGE_NAMES = ["UF", "UR", "UB", "UL", "DF", "DR", "DB", "DL", "FR", "FL", "BR", "BL"] as const;

/** A corner's 3 facing axes, U/D-axis first (the axis used as the orientation reference). */
export function cornerAxes(position: Vec3): { ud: Vec3; lr: Vec3; fb: Vec3 } {
  const [x, y, z] = position;
  return { ud: [0, y, 0], lr: [x, 0, 0], fb: [0, 0, z] };
}

/**
 * A corner's 3 facing axes in a *physically consistent* cyclic order: ud -> second ->
 * third -> ud, chosen so that (ud x second) == third, i.e. the triple is always
 * right-handed. A fixed "ud, lr, fb" label order is NOT physically consistent across
 * corners -- which of lr/fb continues the true rotational cycle after ud flips between
 * octants (it depends on the sign of x*y*z) because a rigid corner only has 3
 * rotational states, and orientation 1/2 must follow the corner's own fixed handedness,
 * not an arbitrary per-axis label. This is what conversions.ts uses for orientation.
 */
export function cornerCycle(position: Vec3): { ud: Vec3; second: Vec3; third: Vec3 } {
  const { ud, lr, fb } = cornerAxes(position);
  const [x, y, z] = position;
  return x * y * z === -1 ? { ud, second: lr, third: fb } : { ud, second: fb, third: lr };
}

/**
 * An edge's 2 facing axes. Edges with a U/D component use it as the orientation
 * reference; the 4 "equator" edges (FR/FL/BR/BL) have no U/D component, so they use
 * their F/B component instead.
 */
export function edgeAxes(position: Vec3): { primary: Vec3; secondary: Vec3 } {
  const [x, y, z] = position;
  if (y !== 0) {
    return { primary: [0, y, 0], secondary: x !== 0 ? [x, 0, 0] : [0, 0, z] };
  }
  return { primary: [0, 0, z], secondary: [x, 0, 0] };
}
