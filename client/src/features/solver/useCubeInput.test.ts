import { faceletIndex } from "@cube-coach/cube-engine";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useCubeInput } from "./useCubeInput.js";

describe("useCubeInput", () => {
  it("starts solved, complete, and unvalidated", () => {
    const { result } = renderHook(() => useCubeInput());
    expect(result.current.complete).toBe(true);
    expect(result.current.filledCount).toBe(48);
    expect(result.current.validation).toBeNull();
    expect(result.current.canUndo).toBe(false);
  });

  it("paints a sticker and invalidates any prior validation", () => {
    const { result } = renderHook(() => useCubeInput());
    act(() => result.current.validate());
    expect(result.current.validation?.valid).toBe(true);

    const index = faceletIndex("F", 0, 0);
    act(() => result.current.selectColor("red"));
    act(() => result.current.paintSticker(index));

    expect(result.current.facelets[index]).toBe("red");
    expect(result.current.validation).toBeNull(); // stale result cleared by the edit
  });

  it("refuses to paint a center sticker", () => {
    const { result } = renderHook(() => useCubeInput());
    const centerIndex = faceletIndex("F", 1, 1);
    act(() => result.current.selectColor("red"));
    act(() => result.current.paintSticker(centerIndex));
    expect(result.current.facelets[centerIndex]).toBe("green"); // unchanged, still F's fixed color
  });

  it("undo restores the previous facelets", () => {
    const { result } = renderHook(() => useCubeInput());
    const index = faceletIndex("F", 0, 0);
    const before = result.current.facelets.slice();

    act(() => result.current.selectColor("red"));
    act(() => result.current.paintSticker(index));
    expect(result.current.facelets[index]).toBe("red");
    expect(result.current.canUndo).toBe(true);

    act(() => result.current.undo());
    expect(result.current.facelets).toEqual(before);
    expect(result.current.canUndo).toBe(false);
  });

  it("undo on an empty history is a no-op", () => {
    const { result } = renderHook(() => useCubeInput());
    const before = result.current.facelets;
    act(() => result.current.undo());
    expect(result.current.facelets).toBe(before);
  });

  it("clear empties every editable sticker but keeps centers fixed", () => {
    const { result } = renderHook(() => useCubeInput());
    act(() => result.current.clear());
    expect(result.current.filledCount).toBe(0);
    expect(result.current.complete).toBe(false);
    expect(result.current.facelets[faceletIndex("U", 1, 1)]).toBe("white");
  });

  it("reset restores the solved cube", () => {
    const { result } = renderHook(() => useCubeInput());
    act(() => result.current.clear());
    act(() => result.current.reset());
    expect(result.current.complete).toBe(true);
    expect(result.current.filledCount).toBe(48);
  });

  it("validate on an incomplete cube reports incompleteness, doesn't call the engine on garbage", () => {
    const { result } = renderHook(() => useCubeInput());
    act(() => result.current.clear());
    act(() => result.current.validate());
    expect(result.current.validation?.valid).toBe(false);
    if (result.current.validation && !result.current.validation.valid) {
      expect(result.current.validation.issues[0]?.code).toBe("INCOMPLETE");
    }
  });

  it("validate on a solved cube succeeds via the real engine validateCube", () => {
    const { result } = renderHook(() => useCubeInput());
    act(() => result.current.validate());
    expect(result.current.validation).toEqual({ valid: true });
  });

  it("validate on a cube with a broken color count fails via the real engine", () => {
    const { result } = renderHook(() => useCubeInput());
    act(() => result.current.selectColor("yellow"));
    act(() => result.current.paintSticker(faceletIndex("U", 0, 0))); // now 10 yellow, 8 white
    act(() => result.current.validate());
    expect(result.current.validation?.valid).toBe(false);
    if (result.current.validation && !result.current.validation.valid) {
      expect(result.current.validation.issues.some((i) => i.code === "WRONG_COLOR_COUNT")).toBe(true);
    }
  });
});
