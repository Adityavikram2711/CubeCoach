import { describe, expect, it } from "vitest";
import { calculateAo12, calculateAo5, calculateAo50, calculateAoN, calculateBest, calculateMean } from "./statistics.js";

describe("calculateBest", () => {
  it("returns null for zero solves", () => {
    expect(calculateBest([])).toBeNull();
  });

  it("returns null when every solve is a DNF", () => {
    expect(calculateBest([null, null, null])).toBeNull();
  });

  it("ignores DNFs when finding the minimum", () => {
    expect(calculateBest([null, 1500, 1200, null, 1800])).toBe(1200);
  });

  it("works with a single solve", () => {
    expect(calculateBest([4200])).toBe(4200);
  });
});

describe("calculateMean", () => {
  it("returns null for zero solves", () => {
    expect(calculateMean([])).toBeNull();
  });

  it("returns null when every solve is a DNF", () => {
    expect(calculateMean([null, null])).toBeNull();
  });

  it("excludes DNFs from the mean rather than treating them as 0", () => {
    // If DNF counted as 0 the mean would be (0+1000+2000)/3 = 1000; it must not be.
    expect(calculateMean([null, 1000, 2000])).toBe(1500);
  });

  it("computes a plain arithmetic mean over all real times", () => {
    expect(calculateMean([1000, 2000, 3000])).toBe(2000);
  });
});

describe("calculateAoN edge cases", () => {
  it("is 'insufficient-data' with fewer solves than the window size", () => {
    expect(calculateAoN([], 5)).toEqual({ status: "insufficient-data" });
    expect(calculateAoN([1000, 2000, 3000, 4000], 5)).toEqual({ status: "insufficient-data" });
  });

  it("uses exactly the window size once available, ignoring older solves", () => {
    // 6 solves, Ao5 should use only the first (most recent) 5.
    const times = [5000, 1000, 2000, 3000, 4000, 999999];
    const result = calculateAoN(times, 5);
    expect(result).toEqual({ status: "ok", timeMs: 3000 }); // drop 1000 (fastest) and 5000 (slowest) -> mean(2000,3000,4000)=3000
  });

  it("all DNFs in the window -> dnf", () => {
    expect(calculateAoN([null, null, null, null, null], 5)).toEqual({ status: "dnf" });
  });

  it("exactly one DNF in the window -> DNF is treated as the trimmed worst", () => {
    // window: DNF, 4000, 3000, 2000, 1000 -- real sorted: [1000,2000,3000,4000],
    // drop fastest (1000), average the rest: (2000+3000+4000)/3 = 3000
    const result = calculateAoN([null, 4000, 3000, 2000, 1000], 5);
    expect(result).toEqual({ status: "ok", timeMs: 3000 });
  });

  it("two DNFs in the window -> dnf regardless of the real times", () => {
    expect(calculateAoN([null, null, 1000, 2000, 3000], 5)).toEqual({ status: "dnf" });
  });
});

describe("calculateAo5 / calculateAo12 / calculateAo50 with fixed deterministic values", () => {
  it("Ao5 of [10.00, 11.00, 12.00, 13.00, 14.00] (in ms, most-recent-first) drops 10 and 14, averages 11/12/13", () => {
    const times = [10000, 11000, 12000, 13000, 14000];
    expect(calculateAo5(times)).toEqual({ status: "ok", timeMs: 12000 });
  });

  it("Ao12 needs exactly 12 solves", () => {
    const eleven = Array.from({ length: 11 }, (_, i) => (i + 1) * 1000);
    expect(calculateAo12(eleven)).toEqual({ status: "insufficient-data" });

    const twelve = Array.from({ length: 12 }, (_, i) => (i + 1) * 1000); // 1000..12000
    // drop 1000 (fastest) and 12000 (slowest), average 2000..11000 (10 values) = 6500
    expect(calculateAo12(twelve)).toEqual({ status: "ok", timeMs: 6500 });
  });

  it("Ao50 needs exactly 50 solves", () => {
    const fortyNine = Array.from({ length: 49 }, (_, i) => (i + 1) * 1000);
    expect(calculateAo50(fortyNine)).toEqual({ status: "insufficient-data" });

    const fifty = Array.from({ length: 50 }, (_, i) => (i + 1) * 1000); // 1000..50000
    // drop fastest (1000) and slowest (50000), average 2000..49000 (48 values) = 25500
    expect(calculateAo50(fifty)).toEqual({ status: "ok", timeMs: 25500 });
  });

  it("more than the window size still only uses the most recent N", () => {
    const sixty = Array.from({ length: 60 }, (_, i) => (i + 1) * 1000);
    // Ao5 should use only the first 5 entries (1000..5000): drop 1000 and 5000, average 2000/3000/4000 = 3000
    expect(calculateAo5(sixty)).toEqual({ status: "ok", timeMs: 3000 });
  });

  it("mixed penalties (already-adjusted final times) average correctly", () => {
    // e.g. a +2 solve's final time (12000 -> 14000) is passed in already-adjusted.
    const times = [14000, 11000, 12000, 13000, 10000];
    expect(calculateAo5(times)).toEqual({ status: "ok", timeMs: 12000 });
  });

  it("all-DNF Ao5", () => {
    expect(calculateAo5([null, null, null, null, null])).toEqual({ status: "dnf" });
  });

  it("one DNF among five", () => {
    expect(calculateAo5([null, 12000, 11000, 13000, 10000])).toEqual({ status: "ok", timeMs: 12000 });
  });
});
