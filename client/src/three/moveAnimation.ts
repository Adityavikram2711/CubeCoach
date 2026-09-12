/**
 * Maps a cube-engine Move to what the 3D renderer needs to animate it: a rotation axis,
 * a signed angle (radians, Three.js right-hand-rule convention), and the exact layer
 * predicate the logical engine itself uses.
 *
 * The axis/angle for each of the 6 underlying rotations was derived once (see
 * coordinates/rotations.ts in the cube engine) and verified to correspond to a signed
 * +/-90 degree turn about the matching Three.js axis (Y for U/D, X for R/L, Z for F/B).
 * Every other move (M/E/S, wide, x/y/z) reuses one of those same 6 rotation functions
 * by reference -- e.g. Rw's `rotate` is literally `rRotate` -- so looking that function
 * reference up in AXIS_ANGLE_BY_ROTATION derives the correct axis/angle for all 18 base
 * moves from a single 6-entry table, instead of re-deciding "which way does Rw spin"
 * by hand and risking it drifting out of sync with the engine.
 */
import {
  MOVE_DEFINITIONS,
  bRotate,
  dRotate,
  fRotate,
  lRotate,
  parseMoveToken,
  rRotate,
  uRotate,
  type Move,
  type RotationFn,
  type Vec3,
} from "@cube-coach/cube-engine";

export type Axis = readonly [number, number, number];

interface AxisAngle {
  axis: Axis;
  /** Signed radians for a single quarter turn about `axis` (Three.js right-hand rule). */
  quarterAngle: number;
}

const AXIS_ANGLE_BY_ROTATION = new Map<RotationFn, AxisAngle>([
  [uRotate, { axis: [0, 1, 0], quarterAngle: -Math.PI / 2 }],
  [dRotate, { axis: [0, 1, 0], quarterAngle: Math.PI / 2 }],
  [rRotate, { axis: [1, 0, 0], quarterAngle: -Math.PI / 2 }],
  [lRotate, { axis: [1, 0, 0], quarterAngle: Math.PI / 2 }],
  [fRotate, { axis: [0, 0, 1], quarterAngle: -Math.PI / 2 }],
  [bRotate, { axis: [0, 0, 1], quarterAngle: Math.PI / 2 }],
]);

export interface MoveAnimationPlan {
  move: Move;
  /** Rotation axis in the same x=R/y=U/z=F frame the cube engine and renderer share. */
  axis: Axis;
  /** Total signed rotation for this exact move, shortest visual path (a prime turn animates as -1 quarter turn, not +3). */
  angle: number;
  /** The exact predicate the logical engine uses to decide which cubies this move affects. */
  inLayer: (position: Vec3) => boolean;
}

/** Turns as the engine stores them (1/2/3, where 3 means "prime") to the shortest signed path (1/2/-1). */
function signedTurns(turns: 1 | 2 | 3): 1 | 2 | -1 {
  return turns === 3 ? -1 : turns;
}

export function planMoveAnimation(move: Move): MoveAnimationPlan {
  const parsed = parseMoveToken(move);
  if (!parsed) {
    throw new Error(`Cannot animate "${move}": not a recognized move.`);
  }
  const definition = MOVE_DEFINITIONS[parsed.base];
  const axisAngle = AXIS_ANGLE_BY_ROTATION.get(definition.rotate);
  if (!axisAngle) {
    // Unreachable for any BaseMoveName today -- every move's `rotate` is one of the 6
    // above -- but fail loudly instead of silently animating nothing if that ever changes.
    throw new Error(`No 3D animation mapping for move "${move}": unrecognized rotation.`);
  }

  return {
    move,
    axis: axisAngle.axis,
    angle: axisAngle.quarterAngle * signedTurns(parsed.turns),
    inLayer: definition.inLayer,
  };
}
