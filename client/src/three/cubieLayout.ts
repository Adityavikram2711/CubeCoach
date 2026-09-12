/**
 * The 26 visible cubie positions (everything except the empty center of the cube) and
 * which of the 6 face directions each one has a sticker on. Both are derived directly
 * from the cube engine's own FACELET_GEOMETRY (the same table the move engine and the
 * cubie conversions read from) rather than re-enumerated by hand, so the renderer's
 * layout can never silently drift from the logical model's.
 */
import { FACELET_GEOMETRY, type Vec3 } from "@cube-coach/cube-engine";

function vecKey(v: Vec3): string {
  return `${v[0]},${v[1]},${v[2]}`;
}

export const ALL_CUBIE_POSITIONS: Vec3[] = (() => {
  const seen = new Map<string, Vec3>();
  for (const { position } of FACELET_GEOMETRY) {
    seen.set(vecKey(position), position);
  }
  return Array.from(seen.values());
})();

/** True if the cubie at `position` has a sticker facing `normal` (one of the 6 unit face-normal vectors). */
export function hasStickerAt(position: Vec3, normal: Vec3): boolean {
  for (let axis = 0; axis < 3; axis++) {
    if (normal[axis] !== 0) return position[axis] === normal[axis];
  }
  return false;
}
