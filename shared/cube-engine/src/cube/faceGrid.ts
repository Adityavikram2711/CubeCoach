/**
 * Maps each of the 54 facelet indices to a 3D cubie position and outward-facing
 * direction, and back. This is the single geometric source of truth that the move
 * engine, the cubie conversions, and (later) the 3D renderer all read from -- there is
 * no separate, independently-hand-tuned sticker-index table anywhere else in the engine.
 *
 * Each face's 3x3 grid was derived by "unfolding" it from Front in a standard net
 * (U above F, L left of F, R right of F, D below F, B beyond R/L), so row 0 is always
 * the edge nearest the hinge face and the formulas agree at every seam. See
 * coordinates/rotations.ts for the turn formulas that operate on these same positions.
 */
import { applyRotation, type RotationFn, type Vec3, vecKey } from "../coordinates/rotations.js";
import { FACES, type Face } from "./types.js";

export const FACE_NORMAL: Record<Face, Vec3> = {
  U: [0, 1, 0],
  D: [0, -1, 0],
  R: [1, 0, 0],
  L: [-1, 0, 0],
  F: [0, 0, 1],
  B: [0, 0, -1],
};

function gridPosition(face: Face, row: number, col: number): Vec3 {
  switch (face) {
    case "U":
      return [col - 1, 1, row - 1];
    case "D":
      return [col - 1, -1, 1 - row];
    case "F":
      return [col - 1, 1 - row, 1];
    case "B":
      return [1 - col, 1 - row, -1];
    case "L":
      return [-1, 1 - row, col - 1];
    case "R":
      return [1, 1 - row, 1 - col];
  }
}

export function faceletIndex(face: Face, row: number, col: number): number {
  return FACES.indexOf(face) * 9 + row * 3 + col;
}

export interface FaceletGeometry {
  face: Face;
  row: number;
  col: number;
  position: Vec3;
  facing: Vec3;
}

/** Indexed 0-53, matching FaceletCube's index order (U R F D L B, row-major). */
export const FACELET_GEOMETRY: FaceletGeometry[] = [];

const facingAndPositionToIndex = new Map<string, number>();

for (const face of FACES) {
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const index = faceletIndex(face, row, col);
      const position = gridPosition(face, row, col);
      const facing = FACE_NORMAL[face];
      FACELET_GEOMETRY[index] = { face, row, col, position, facing };
      facingAndPositionToIndex.set(`${vecKey(position)}|${vecKey(facing)}`, index);
    }
  }
}

const normalToFace = new Map<string, Face>(FACES.map((face) => [vecKey(FACE_NORMAL[face]), face]));

export function faceForNormal(normal: Vec3): Face {
  const face = normalToFace.get(vecKey(normal));
  if (!face) throw new Error(`(${normal.join(",")}) is not a face-normal vector.`);
  return face;
}

export function faceletIndexAt(position: Vec3, facing: Vec3): number {
  const index = facingAndPositionToIndex.get(`${vecKey(position)}|${vecKey(facing)}`);
  if (index === undefined) {
    throw new Error(`No facelet at position (${position.join(",")}) facing (${facing.join(",")}).`);
  }
  return index;
}

/**
 * Rotates every facelet whose cubie position satisfies `inLayer`, `times` quarter turns
 * (1-3) about `rotate`. Both the position and the facing direction of a sticker rotate
 * by the same formula, since facing is just a vector fixed to its cubie.
 */
export function rotateFacelets<T>(
  cube: readonly T[],
  rotate: RotationFn,
  inLayer: (position: Vec3) => boolean,
  times: number,
): T[] {
  const next = cube.slice();
  for (const { position, facing } of FACELET_GEOMETRY) {
    if (!inLayer(position)) continue;
    const newPosition = applyRotation(rotate, position, times);
    const newFacing = applyRotation(rotate, facing, times);
    const sourceIndex = faceletIndexAt(position, facing);
    const destIndex = faceletIndexAt(newPosition, newFacing);
    next[destIndex] = cube[sourceIndex]!;
  }
  return next;
}
