import { describe, expect, it } from "vitest";
import { COLORS, FACES } from "./types.js";

describe("cube foundation types", () => {
  it("defines exactly 6 faces", () => {
    expect(FACES).toHaveLength(6);
  });

  it("defines exactly 6 colors", () => {
    expect(COLORS).toHaveLength(6);
  });
});
