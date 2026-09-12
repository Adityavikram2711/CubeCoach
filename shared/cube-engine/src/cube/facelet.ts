import { faceletIndex } from "./faceGrid.js";
import { FACES, type Color, type Face, type FaceletCube } from "./types.js";

/** Standard WCA color scheme: white opposite yellow, green opposite blue, red opposite orange. */
export const FACE_COLOR: Record<Face, Color> = {
  U: "white",
  D: "yellow",
  F: "green",
  B: "blue",
  R: "red",
  L: "orange",
};

export const COLOR_FACE: Record<Color, Face> = Object.fromEntries(
  Object.entries(FACE_COLOR).map(([face, color]) => [color, face as Face]),
) as Record<Color, Face>;

export function createSolvedCube(): FaceletCube {
  const cube: Color[] = [];
  for (const face of FACES) {
    for (let i = 0; i < 9; i++) {
      cube.push(FACE_COLOR[face]);
    }
  }
  return cube;
}

/**
 * A face is solved when all 9 of its stickers match -- including its own center,
 * whatever color that currently is. This is deliberately center-relative (not checked
 * against the fixed FACE_COLOR table) so that a solved cube correctly reads as solved
 * even after a whole-cube rotation (x/y/z), which carries the centers along with it.
 */
export function isSolved(cube: FaceletCube): boolean {
  for (const face of FACES) {
    const base = FACES.indexOf(face) * 9;
    const color = cube[faceletIndex(face, 1, 1)];
    for (let i = 0; i < 9; i++) {
      if (cube[base + i] !== color) return false;
    }
  }
  return true;
}

export function cloneCube(cube: FaceletCube): FaceletCube {
  return cube.slice();
}
