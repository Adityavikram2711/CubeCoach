import { FACES, applyMoves, createSolvedCube, faceletIndex, generateScramble } from "@cube-coach/cube-engine";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CubeNet } from "./CubeNet.js";

describe("CubeNet", () => {
  it("renders 54 buttons, 6 of them disabled (centers)", () => {
    render(<CubeNet facelets={createSolvedCube()} onPaint={() => {}} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(54);
    expect(buttons.filter((b) => (b as HTMLButtonElement).disabled)).toHaveLength(6);
  });

  it("clicking a face sticker calls onPaint with that exact face's engine index, not a neighbor's", async () => {
    const user = userEvent.setup();
    const onPaint = vi.fn();
    const cube = applyMoves(createSolvedCube(), generateScramble(20));
    render(<CubeNet facelets={cube} onPaint={onPaint} />);

    // Spot-check one non-center sticker on every face -- this is the exact bug class
    // (face-order / row-col confusion in the net's grid placement) the spec warns about.
    for (const face of FACES) {
      onPaint.mockClear();
      const index = faceletIndex(face, 0, 0); // a corner sticker, unambiguous per face
      const label = new RegExp(`^${face} face sticker, row 1, column 1`);
      const button = screen.getByLabelText(label);
      await user.click(button);
      expect(onPaint, face).toHaveBeenCalledTimes(1);
      expect(onPaint, face).toHaveBeenCalledWith(index);
    }
  });

  it("clicking a center is a no-op (button is disabled)", async () => {
    const user = userEvent.setup();
    const onPaint = vi.fn();
    render(<CubeNet facelets={createSolvedCube()} onPaint={onPaint} />);
    const center = screen.getByLabelText(/U center, fixed color/);
    await user.click(center);
    expect(onPaint).not.toHaveBeenCalled();
  });

  it("shows an unfilled sticker distinctly from a filled one", () => {
    const partial = createSolvedCube();
    const emptyIndex = faceletIndex("F", 0, 0);
    // @ts-expect-error -- intentionally simulating an unfilled slot for this render test
    partial[emptyIndex] = null;
    render(<CubeNet facelets={partial} onPaint={() => {}} />);
    const button = screen.getByLabelText(/F face sticker, row 1, column 1, currently unfilled/);
    expect(button).toBeInTheDocument();
  });
});
