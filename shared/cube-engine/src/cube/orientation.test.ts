import { describe, expect, it } from "vitest";
import { applyMove } from "../moves/apply.js";
import { faceletIndex } from "./faceGrid.js";
import { createSolvedCube } from "./facelet.js";
import { FACE_COLOR } from "./facelet.js";

/**
 * These tests pin down the *absolute* turning direction (not just internal
 * consistency, which the order-4/inverse tests already cover) against the standard
 * WCA notation: "U turn, viewed from above, carries the front face's top row to the
 * left face's top row." If the 3D renderer, the cube-input UI, and the solver ever
 * disagree with this engine about which way a move turns, one of these will fail.
 */
describe("absolute turn direction", () => {
  it("U: front top row moves to left top row", () => {
    const cube = applyMove(createSolvedCube(), "U");
    const leftTopRow = [faceletIndex("L", 0, 0), faceletIndex("L", 0, 1), faceletIndex("L", 0, 2)];
    for (const i of leftTopRow) expect(cube[i]).toBe(FACE_COLOR.F);
  });

  it("U: right top row moves to front top row", () => {
    const cube = applyMove(createSolvedCube(), "U");
    const frontTopRow = [faceletIndex("F", 0, 0), faceletIndex("F", 0, 1), faceletIndex("F", 0, 2)];
    for (const i of frontTopRow) expect(cube[i]).toBe(FACE_COLOR.R);
  });

  it("R: top-right column moves to back-left column", () => {
    const cube = applyMove(createSolvedCube(), "R");
    const backRightCol = [faceletIndex("B", 0, 0), faceletIndex("B", 1, 0), faceletIndex("B", 2, 0)];
    for (const i of backRightCol) expect(cube[i]).toBe(FACE_COLOR.U);
  });

  it("R: front-right column moves to up-right column", () => {
    const cube = applyMove(createSolvedCube(), "R");
    const upRightCol = [faceletIndex("U", 0, 2), faceletIndex("U", 1, 2), faceletIndex("U", 2, 2)];
    for (const i of upRightCol) expect(cube[i]).toBe(FACE_COLOR.F);
  });

  it("F: up bottom row moves to right left column", () => {
    const cube = applyMove(createSolvedCube(), "F");
    const rightLeftCol = [faceletIndex("R", 0, 0), faceletIndex("R", 1, 0), faceletIndex("R", 2, 0)];
    for (const i of rightLeftCol) expect(cube[i]).toBe(FACE_COLOR.U);
  });

  it("y rotation matches U direction (whole cube): front (incl. its center) moves to left", () => {
    const cube = applyMove(createSolvedCube(), "y");
    for (let i = 0; i < 9; i++) {
      expect(cube[faceletIndex("L", Math.floor(i / 3), i % 3)]).toBe(FACE_COLOR.F);
    }
  });
});
