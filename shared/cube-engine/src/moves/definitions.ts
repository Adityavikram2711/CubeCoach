import { bRotate, dRotate, fRotate, lRotate, rRotate, uRotate, type RotationFn, type Vec3 } from "../coordinates/rotations.js";

export const BASE_MOVE_NAMES = [
  "U", "D", "L", "R", "F", "B",
  "M", "E", "S",
  "Uw", "Dw", "Lw", "Rw", "Fw", "Bw",
  "x", "y", "z",
] as const;

export type BaseMoveName = (typeof BASE_MOVE_NAMES)[number];

export interface MoveDefinition {
  rotate: RotationFn;
  /** Which cubies (by position) this move's layer(s) affect. */
  inLayer: (position: Vec3) => boolean;
}

/**
 * A center sticker's cubie has exactly one nonzero coordinate. Centers are mounted on
 * fixed spindles attached to the cube's core: a single- or double-layer turn along
 * another axis never moves them, even though their position happens to satisfy that
 * turn's coordinate filter (e.g. the U-center sits at x=0, the same coordinate as the
 * M-slice and the Rw layer). Only a whole-cube rotation (x/y/z) actually moves a
 * center, since that's the only "move" that reorients the core itself.
 */
const isCenter = (position: Vec3) => position.filter((c) => c !== 0).length === 1;

const notCenter = (predicate: (position: Vec3) => boolean) => (position: Vec3) =>
  predicate(position) && !isCenter(position);

const axis = (component: 0 | 1 | 2, value: number) => notCenter((position) => position[component] === value);
const axisAtLeast = (component: 0 | 1 | 2, value: number) => notCenter((position) => position[component] >= value);
const axisAtMost = (component: 0 | 1 | 2, value: number) => notCenter((position) => position[component] <= value);
/**
 * Whole-cube rotations (x/y/z) pick up and turn the entire physical cube, core
 * included, so -- unlike a slice or wide move -- they carry all 6 centers along too.
 * A solved cube stays "solved" after x/y/z (each face still shows one uniform color,
 * matching its own center); see facelet.ts's isSolved, which checks against each
 * face's *current* center rather than a fixed color, for exactly this reason.
 */
const all = () => true;

/**
 * One quarter-turn definition per base move name.
 *
 * Wide moves turn two layers in the face's own direction (Rw = R + M-layer, both
 * rotating the R way). Slice moves follow the WCA convention of matching the nearer
 * "opposite-ish" face's direction: M follows L, E follows D, S follows F. Whole-cube
 * rotations (x/y/z) apply the face rotation to every cubie: x follows R, y follows U,
 * z follows F.
 */
export const MOVE_DEFINITIONS: Record<BaseMoveName, MoveDefinition> = {
  U: { rotate: uRotate, inLayer: axis(1, 1) },
  D: { rotate: dRotate, inLayer: axis(1, -1) },
  R: { rotate: rRotate, inLayer: axis(0, 1) },
  L: { rotate: lRotate, inLayer: axis(0, -1) },
  F: { rotate: fRotate, inLayer: axis(2, 1) },
  B: { rotate: bRotate, inLayer: axis(2, -1) },

  M: { rotate: lRotate, inLayer: axis(0, 0) },
  E: { rotate: dRotate, inLayer: axis(1, 0) },
  S: { rotate: fRotate, inLayer: axis(2, 0) },

  Uw: { rotate: uRotate, inLayer: axisAtLeast(1, 0) },
  Dw: { rotate: dRotate, inLayer: axisAtMost(1, 0) },
  Rw: { rotate: rRotate, inLayer: axisAtLeast(0, 0) },
  Lw: { rotate: lRotate, inLayer: axisAtMost(0, 0) },
  Fw: { rotate: fRotate, inLayer: axisAtLeast(2, 0) },
  Bw: { rotate: bRotate, inLayer: axisAtMost(2, 0) },

  x: { rotate: rRotate, inLayer: all },
  y: { rotate: uRotate, inLayer: all },
  z: { rotate: fRotate, inLayer: all },
};
