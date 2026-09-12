import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SolveHistory } from "./SolveHistory.js";
import type { SolveRecord } from "./types.js";

function makeSolve(overrides: Partial<SolveRecord> = {}): SolveRecord {
  return {
    id: Math.random().toString(),
    scramble: "R U R' U'",
    rawTimeMs: 12470,
    penalty: "NONE",
    finalTimeMs: 12470,
    solvedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("SolveHistory", () => {
  it("shows an empty state with no solves", () => {
    render(<SolveHistory solves={[]} onDelete={vi.fn()} />);
    expect(screen.getByText(/no solves yet/i)).toBeInTheDocument();
  });

  it("lists solves newest first, numbering from the top", () => {
    const solves = [makeSolve({ id: "newest", rawTimeMs: 9000, finalTimeMs: 9000 }), makeSolve({ id: "oldest", rawTimeMs: 15000, finalTimeMs: 15000 })];
    render(<SolveHistory solves={solves} onDelete={vi.fn()} />);
    const rows = screen.getAllByRole("row").slice(1); // skip header row
    expect(rows[0]).toHaveTextContent("2"); // newest gets the highest number (most recent of 2)
    expect(rows[0]).toHaveTextContent("9.00");
    expect(rows[1]).toHaveTextContent("1");
    expect(rows[1]).toHaveTextContent("15.00");
  });

  it("displays DNF and +2 penalties distinctly", () => {
    const solves = [makeSolve({ id: "a", penalty: "DNF", finalTimeMs: null }), makeSolve({ id: "b", penalty: "PLUS_TWO", rawTimeMs: 10000, finalTimeMs: 12000 })];
    render(<SolveHistory solves={solves} onDelete={vi.fn()} />);
    expect(screen.getAllByText("DNF").length).toBeGreaterThan(0); // both the time cell and the penalty cell read "DNF"
    expect(screen.getByText("+2")).toBeInTheDocument();
  });

  it("calls onDelete with the correct solve id", async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();
    const solves = [makeSolve({ id: "solve-1" })];
    render(<SolveHistory solves={solves} onDelete={onDelete} />);
    await user.click(screen.getByRole("button", { name: /delete solve/i }));
    expect(onDelete).toHaveBeenCalledWith("solve-1");
  });
});
