import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PenaltyControls } from "./PenaltyControls.js";

describe("PenaltyControls", () => {
  it("marks the current penalty as pressed", () => {
    render(<PenaltyControls penalty="PLUS_TWO" onChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "+2" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "No Penalty" })).toHaveAttribute("aria-pressed", "false");
  });

  it("calls onChange with the selected penalty", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<PenaltyControls penalty="NONE" onChange={onChange} />);
    await user.click(screen.getByRole("button", { name: "DNF" }));
    expect(onChange).toHaveBeenCalledWith("DNF");
  });

  it("never relies on color alone -- every option has visible text", () => {
    render(<PenaltyControls penalty="NONE" onChange={vi.fn()} />);
    expect(screen.getByText("No Penalty")).toBeInTheDocument();
    expect(screen.getByText("+2")).toBeInTheDocument();
    expect(screen.getByText("DNF")).toBeInTheDocument();
  });
});
