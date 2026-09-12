/**
 * The cube lives in a right-handed coordinate system: x=+1 is the R side, y=+1 is the
 * U side, z=+1 is the F side (so D=y-1, L=x-1, B=z-1). Every cubie sits at a point
 * (x,y,z) with each coordinate in {-1,0,1}; every sticker's outward-facing direction is
 * one of the 6 unit vectors below.
 *
 * A quarter-turn of a face, viewed from outside that face, is a 90-degree rotation of
 * the affected layer about the face's axis. These six formulas were derived from the
 * standard "camera looks down -z, up=+y, right=+x" basis (forward x up = right) applied
 * to each face in turn, and cross-checked against the well-known behavior that a U turn
 * carries the front edge to the left (U-F -> U-L). D/L/B are the algebraic inverses of
 * U/R/F respectively, since turning the opposite face "clockwise from its own outside"
 * is the same axis but the opposite absolute rotation.
 *
 * Both cubie positions and sticker-facing vectors transform under the same formula,
 * since a facing direction is just a vector attached to the cubie.
 */

export type Vec3 = readonly [number, number, number];

export type RotationFn = (v: Vec3) => Vec3;

export const uRotate: RotationFn = ([x, y, z]) => [-z, y, x];
export const dRotate: RotationFn = ([x, y, z]) => [z, y, -x];
export const rRotate: RotationFn = ([x, y, z]) => [x, z, -y];
export const lRotate: RotationFn = ([x, y, z]) => [x, -z, y];
export const fRotate: RotationFn = ([x, y, z]) => [y, -x, z];
export const bRotate: RotationFn = ([x, y, z]) => [-y, x, z];

/** Applies a rotation `n` times (n in {1,2,3}), where 3 is the inverse quarter turn. */
export function applyRotation(rotate: RotationFn, v: Vec3, times: number): Vec3 {
  let result = v;
  const n = ((times % 4) + 4) % 4;
  for (let i = 0; i < n; i++) {
    result = rotate(result);
  }
  return result;
}

export function vecEquals(a: Vec3, b: Vec3): boolean {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}

export function vecKey(v: Vec3): string {
  return `${v[0]},${v[1]},${v[2]}`;
}
