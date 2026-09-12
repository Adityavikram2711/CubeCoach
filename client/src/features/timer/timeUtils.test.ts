import { describe, expect, it } from "vitest";
import { calculateFinalTime, formatTime, isValidPenalty, isValidRawTimeMs } from "./timeUtils.js";

describe("calculateFinalTime", () => {
  it("NONE passes the raw time through unchanged", () => {
    expect(calculateFinalTime(12470, "NONE")).toBe(12470);
    expect(calculateFinalTime(0, "NONE")).toBe(0);
  });

  it("PLUS_TWO adds exactly 2000ms", () => {
    expect(calculateFinalTime(12470, "PLUS_TWO")).toBe(14470);
  });

  it("DNF is null, never zero", () => {
    expect(calculateFinalTime(12470, "DNF")).toBeNull();
    expect(calculateFinalTime(0, "DNF")).toBeNull();
  });

  it("never mutates or loses the raw time -- it's a pure calculation", () => {
    const raw = 9999;
    calculateFinalTime(raw, "PLUS_TWO");
    expect(raw).toBe(9999);
  });
});

describe("formatTime", () => {
  it("renders null as DNF", () => {
    expect(formatTime(null)).toBe("DNF");
  });

  it("formats sub-minute times as seconds.centiseconds", () => {
    expect(formatTime(0)).toBe("0.00");
    expect(formatTime(12470)).toBe("12.47");
    expect(formatTime(9990)).toBe("9.99");
  });

  it("formats times at or over a minute as minutes:seconds.centiseconds", () => {
    expect(formatTime(60500)).toBe("1:00.50");
    expect(formatTime(372340)).toBe("6:12.34");
  });

  it("pads single-digit seconds within a minute-plus time", () => {
    expect(formatTime(65000)).toBe("1:05.00");
  });

  it("rounds to the nearest centisecond rather than truncating", () => {
    expect(formatTime(12475)).toBe("12.48"); // 1247.5cs rounds up
    expect(formatTime(12474)).toBe("12.47");
  });

  it("handles an exact minute boundary", () => {
    expect(formatTime(60000)).toBe("1:00.00");
    expect(formatTime(59999)).toBe("1:00.00"); // rounds up to the minute boundary
    expect(formatTime(59990)).toBe("59.99");
  });
});

describe("isValidRawTimeMs", () => {
  it("accepts zero and typical solve times", () => {
    expect(isValidRawTimeMs(0)).toBe(true);
    expect(isValidRawTimeMs(12470)).toBe(true);
  });

  it("rejects negative times", () => {
    expect(isValidRawTimeMs(-1)).toBe(false);
  });

  it("rejects NaN and Infinity", () => {
    expect(isValidRawTimeMs(NaN)).toBe(false);
    expect(isValidRawTimeMs(Infinity)).toBe(false);
    expect(isValidRawTimeMs(-Infinity)).toBe(false);
  });

  it("rejects absurdly large times (>24h)", () => {
    expect(isValidRawTimeMs(25 * 60 * 60 * 1000)).toBe(false);
  });

  it("rejects non-numeric values", () => {
    expect(isValidRawTimeMs("12470")).toBe(false);
    expect(isValidRawTimeMs(null)).toBe(false);
    expect(isValidRawTimeMs(undefined)).toBe(false);
  });
});

describe("isValidPenalty", () => {
  it("accepts the three known penalty values", () => {
    expect(isValidPenalty("NONE")).toBe(true);
    expect(isValidPenalty("PLUS_TWO")).toBe(true);
    expect(isValidPenalty("DNF")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isValidPenalty("plus2")).toBe(false);
    expect(isValidPenalty("")).toBe(false);
    expect(isValidPenalty(null)).toBe(false);
    expect(isValidPenalty(2)).toBe(false);
  });
});
