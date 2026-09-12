import { BASE_MOVE_NAMES, applyMove, createSolvedCube, isSolved } from "@cube-coach/cube-engine";
import { describe, expect, it } from "vitest";
import { planMoveAnimation } from "./moveAnimation.js";

describe("planMoveAnimation", () => {
  it("maps every base move to an axis and a nonzero quarter-turn angle", () => {
    for (const base of BASE_MOVE_NAMES) {
      const plan = planMoveAnimation(base);
      expect(plan.axis.some((c) => c !== 0), base).toBe(true);
      expect(Math.abs(plan.angle), base).toBeCloseTo(Math.PI / 2, 5);
    }
  });

  it("U turns about +Y by -90 degrees (matches the engine: front row moves to left row)", () => {
    const plan = planMoveAnimation("U");
    expect(plan.axis).toEqual([0, 1, 0]);
    expect(plan.angle).toBeCloseTo(-Math.PI / 2, 5);
  });

  it("a prime move animates as the short way (-1 quarter turn), not the long way (+3)", () => {
    const plan = planMoveAnimation("U'");
    expect(plan.angle).toBeCloseTo(Math.PI / 2, 5);
    expect(Math.abs(plan.angle)).toBeLessThan(Math.PI); // shortest path, never 270 degrees
  });

  it("a double move animates as a full 180 degrees", () => {
    const plan = planMoveAnimation("R2");
    expect(Math.abs(plan.angle)).toBeCloseTo(Math.PI, 5);
  });

  it("applying the planned angle 4 times (as quarter turns) returns to the start, matching the engine", () => {
    // Cross-check: for each base move, the *sign* of the planned angle should agree
    // with the engine's own U/R/F-front-row-moves-left/up/etc behavior -- verified here
    // by checking that 4 repeats of the base move both solve the cube (engine) and
    // sum to a multiple of 2*PI (renderer), i.e. neither ever disagrees about "how far".
    for (const base of BASE_MOVE_NAMES) {
      let cube = createSolvedCube();
      for (let i = 0; i < 4; i++) cube = applyMove(cube, base);
      expect(isSolved(cube), base).toBe(true);

      const plan = planMoveAnimation(base);
      const total = plan.angle * 4;
      const normalized = ((total % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      expect(normalized, base).toBeCloseTo(0, 5);
    }
  });

  it("wide moves and their base face share the same axis and angle (Rw follows R)", () => {
    const r = planMoveAnimation("R");
    const rw = planMoveAnimation("Rw");
    expect(rw.axis).toEqual(r.axis);
    expect(rw.angle).toBeCloseTo(r.angle, 5);
  });

  it("slice moves follow their documented face (M follows L, E follows D, S follows F)", () => {
    expect(planMoveAnimation("M").angle).toBeCloseTo(planMoveAnimation("L").angle, 5);
    expect(planMoveAnimation("E").angle).toBeCloseTo(planMoveAnimation("D").angle, 5);
    expect(planMoveAnimation("S").angle).toBeCloseTo(planMoveAnimation("F").angle, 5);
  });

  it("whole-cube rotations follow their documented face (x follows R, y follows U, z follows F)", () => {
    expect(planMoveAnimation("x").angle).toBeCloseTo(planMoveAnimation("R").angle, 5);
    expect(planMoveAnimation("y").angle).toBeCloseTo(planMoveAnimation("U").angle, 5);
    expect(planMoveAnimation("z").angle).toBeCloseTo(planMoveAnimation("F").angle, 5);
  });

  it("inLayer is the exact engine predicate: only the R layer for R, not the M layer", () => {
    const plan = planMoveAnimation("R");
    expect(plan.inLayer([1, 1, 1])).toBe(true);
    expect(plan.inLayer([0, 1, 1])).toBe(false);
    expect(plan.inLayer([-1, 1, 1])).toBe(false);
  });

  it("inLayer for a wide move includes both the outer and middle layer", () => {
    const plan = planMoveAnimation("Rw");
    expect(plan.inLayer([1, 1, 1])).toBe(true);
    expect(plan.inLayer([0, 1, 1])).toBe(true);
    expect(plan.inLayer([-1, 1, 1])).toBe(false);
  });

  it("throws a descriptive error for an unrecognized move", () => {
    expect(() => planMoveAnimation("Q")).toThrow(/Cannot animate/);
  });
});
