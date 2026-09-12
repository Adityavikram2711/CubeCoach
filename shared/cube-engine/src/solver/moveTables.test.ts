import { applyMoves, createSolvedCube, generateScramble } from "@cube-coach/cube-engine";
import { describe, expect, it } from "vitest";
import { faceletToCubie } from "../cube/conversions.js";
import { applyMoveToCubie, PHASE1_MOVES, PHASE2_MOVES } from "./cubieMoves.js";
import {
  encodeCornerOrientation,
  encodeCornerPermutation,
  encodeEdgeOrientation,
  encodeEdgePermutation8,
  encodeUdSlice,
  encodeUdSlicePermutation,
} from "./coordinates.js";
import {
  getCornerOrientationMoveTable,
  getCornerPermutationMoveTable,
  getEdgeOrientationMoveTable,
  getEdgePermutation8MoveTable,
  getUdSliceMoveTable,
  getUdSlicePermutationMoveTable,
} from "./moveTables.js";

describe("move tables: repeated application matches move order", () => {
  it("every phase-1 coordinate returns to itself after 4 quarter turns or 2 half turns", () => {
    const table = getCornerOrientationMoveTable();
    for (let m = 0; m < PHASE1_MOVES.length; m++) {
      const move = PHASE1_MOVES[m]!;
      const repeats = move.includes("2") ? 2 : 4;
      let coord = 0;
      for (let i = 0; i < repeats; i++) coord = table[coord]![m]!;
      expect(coord, move).toBe(0);
    }
  });

  it("edge orientation and UD-slice tables have the same order property, starting from their own solved coordinate", () => {
    const cases = [
      { table: getEdgeOrientationMoveTable(), solved: encodeEdgeOrientation(new Array(12).fill(0)) },
      { table: getUdSliceMoveTable(), solved: encodeUdSlice([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]) },
    ];
    for (const { table, solved } of cases) {
      for (let m = 0; m < PHASE1_MOVES.length; m++) {
        const move = PHASE1_MOVES[m]!;
        const repeats = move.includes("2") ? 2 : 4;
        let coord = solved;
        for (let i = 0; i < repeats; i++) coord = table[coord]![m]!;
        expect(coord, move).toBe(solved);
      }
    }
  });
});

describe("move tables agree with direct cubie-move application", () => {
  it("for random scrambled cubie states, table lookups match applyMoveToCubie + encode directly", () => {
    const cornerOrientationTable = getCornerOrientationMoveTable();
    const edgeOrientationTable = getEdgeOrientationMoveTable();
    const udSliceTable = getUdSliceMoveTable();

    for (let i = 0; i < 15; i++) {
      const scramble = generateScramble(15);
      const cubie = faceletToCubie(applyMoves(createSolvedCube(), scramble));
      const coCoord = encodeCornerOrientation(cubie.co);
      const eoCoord = encodeEdgeOrientation(cubie.eo);
      const sliceCoord = encodeUdSlice(cubie.ep);

      for (let m = 0; m < PHASE1_MOVES.length; m++) {
        const move = PHASE1_MOVES[m]!;
        const moved = applyMoveToCubie(cubie, move);
        expect(cornerOrientationTable[coCoord]![m], `${scramble.join(" ")} + ${move}`).toBe(
          encodeCornerOrientation(moved.co),
        );
        expect(edgeOrientationTable[eoCoord]![m], `${scramble.join(" ")} + ${move}`).toBe(
          encodeEdgeOrientation(moved.eo),
        );
        expect(udSliceTable[sliceCoord]![m], `${scramble.join(" ")} + ${move}`).toBe(encodeUdSlice(moved.ep));
      }
    }
  });

  it("phase-2 tables agree with direct cubie-move application on phase-1-solved states", () => {
    const cornerPermTable = getCornerPermutationMoveTable();
    const edgePerm8Table = getEdgePermutation8MoveTable();
    const udSlicePermTable = getUdSlicePermutationMoveTable();

    // Scrambles built only from phase-2 moves keep co=0/eo=0/udslice solved by
    // construction, so the resulting state is always valid phase-2 input.
    for (let i = 0; i < 15; i++) {
      const scramble = Array.from({ length: 10 }, () => PHASE2_MOVES[Math.floor(Math.random() * PHASE2_MOVES.length)]!);
      const cubie = faceletToCubie(applyMoves(createSolvedCube(), scramble));
      const cpCoord = encodeCornerPermutation(cubie.cp);
      const ep8Coord = encodeEdgePermutation8(cubie.ep);
      const sliceCoord = encodeUdSlicePermutation(cubie.ep);

      for (let m = 0; m < PHASE2_MOVES.length; m++) {
        const move = PHASE2_MOVES[m]!;
        const moved = applyMoveToCubie(cubie, move);
        expect(cornerPermTable[cpCoord]![m], `${scramble.join(" ")} + ${move}`).toBe(
          encodeCornerPermutation(moved.cp),
        );
        expect(edgePerm8Table[ep8Coord]![m], `${scramble.join(" ")} + ${move}`).toBe(
          encodeEdgePermutation8(moved.ep),
        );
        expect(udSlicePermTable[sliceCoord]![m], `${scramble.join(" ")} + ${move}`).toBe(
          encodeUdSlicePermutation(moved.ep),
        );
      }
    }
  });
});

describe("coordinate transitions are independent of the identity of the 'other' pieces", () => {
  it("corner-orientation transitions match regardless of which corners/edges occupy the slots", () => {
    const table = getCornerOrientationMoveTable();
    const scramble = generateScramble(10);
    const cubie = faceletToCubie(applyMoves(createSolvedCube(), scramble));
    const coCoord = encodeCornerOrientation(cubie.co);

    for (let m = 0; m < PHASE1_MOVES.length; m++) {
      const moved = applyMoveToCubie(cubie, PHASE1_MOVES[m]!);
      expect(table[coCoord]![m]).toBe(encodeCornerOrientation(moved.co));
    }
  });
});
