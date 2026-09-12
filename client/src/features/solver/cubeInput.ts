/**
 * The interactive cube input's data model. This is deliberately NOT a second cube
 * representation: an EditableFacelets array is exactly a FaceletCube (same 54-slot
 * indexing, same FACES order, same faceletIndex helper from the shared engine) with
 * one addition -- a slot can be `null` while the user hasn't painted it yet. Once every
 * non-center slot is filled, an EditableFacelets is a real FaceletCube (see
 * toFaceletCube), ready to hand straight to the shared engine's own validateCube().
 */
import {
  COLORS,
  FACES,
  FACE_COLOR,
  createSolvedCube,
  faceletIndex,
  type Color,
  type Face,
  type FaceletCube,
} from "@cube-coach/cube-engine";

export type EditableColor = Color | null;
export type EditableFacelets = EditableColor[];

/** The 6 center indices -- fixed by the engine's color scheme, never user-editable. */
export const CENTER_INDICES: number[] = FACES.map((face) => faceletIndex(face, 1, 1));
const CENTER_INDEX_SET = new Set(CENTER_INDICES);

/** The 48 stickers a user actually paints (54 facelets minus the 6 fixed centers). */
export const EDITABLE_INDICES: number[] = Array.from({ length: 54 }, (_, i) => i).filter(
  (i) => !CENTER_INDEX_SET.has(i),
);

export function isCenterIndex(index: number): boolean {
  return CENTER_INDEX_SET.has(index);
}

export function centerColorFor(index: number): Color | undefined {
  for (const face of FACES) {
    if (faceletIndex(face, 1, 1) === index) return FACE_COLOR[face];
  }
  return undefined;
}

/** Starts from the solved cube -- every slot filled, matching the engine's own createSolvedCube(). */
export function solvedEditableFacelets(): EditableFacelets {
  return createSolvedCube();
}

/** Centers stay fixed (they establish orientation); every editable sticker becomes unfilled. */
export function emptyEditableFacelets(): EditableFacelets {
  const facelets: EditableFacelets = new Array(54).fill(null);
  for (const face of FACES) {
    facelets[faceletIndex(face, 1, 1)] = FACE_COLOR[face];
  }
  return facelets;
}

export function countFilled(facelets: EditableFacelets): number {
  return EDITABLE_INDICES.reduce((count, i) => count + (facelets[i] !== null ? 1 : 0), 0);
}

export function isComplete(facelets: EditableFacelets): boolean {
  return countFilled(facelets) === EDITABLE_INDICES.length;
}

/** Only call once isComplete(facelets) is true -- every slot is guaranteed non-null then. */
export function toFaceletCube(facelets: EditableFacelets): FaceletCube {
  return facelets as FaceletCube;
}

export function colorCounts(facelets: EditableFacelets): Record<Color, number> {
  const counts = Object.fromEntries(COLORS.map((c) => [c, 0])) as Record<Color, number>;
  for (const color of facelets) {
    if (color !== null) counts[color] += 1;
  }
  return counts;
}

export interface FaceletPosition {
  face: Face;
  row: number;
  col: number;
  index: number;
}

/** Every facelet's (face,row,col,index), derived from the same faceletIndex the engine uses. */
export const ALL_FACELET_POSITIONS: FaceletPosition[] = FACES.flatMap((face) =>
  Array.from({ length: 3 }, (_, row) =>
    Array.from({ length: 3 }, (_, col) => ({ face, row, col, index: faceletIndex(face, row, col) })),
  ).flat(),
);
