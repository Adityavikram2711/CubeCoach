import { describe, expect, it } from "vitest";
import { getEffectiveAlgorithm } from "./effectiveAlgorithm.js";

describe("getEffectiveAlgorithm", () => {
  it("uses the global algorithm when there is no preference", () => {
    expect(getEffectiveAlgorithm("R U R' U'", undefined)).toBe("R U R' U'");
    expect(getEffectiveAlgorithm("R U R' U'", null)).toBe("R U R' U'");
    expect(getEffectiveAlgorithm("R U R' U'", "")).toBe("R U R' U'");
  });

  it("uses the user's preferred algorithm when set", () => {
    expect(getEffectiveAlgorithm("R U R' U'", "F R U R' U' F'")).toBe("F R U R' U' F'");
  });

  it("never mutates or returns a blended result -- it's one or the other", () => {
    const global = "R U R' U'";
    const preferred = "F R U R' U' F'";
    const result = getEffectiveAlgorithm(global, preferred);
    expect(result === global || result === preferred).toBe(true);
  });
});
