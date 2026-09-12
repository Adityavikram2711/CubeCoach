import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatisticsPanel } from "./StatisticsPanel.js";
import type { SolveStats } from "./types.js";

const EMPTY_STATS: SolveStats = {
  count: 0,
  dnfCount: 0,
  plusTwoCount: 0,
  best: null,
  mean: null,
  ao5: { status: "insufficient-data" },
  ao12: { status: "insufficient-data" },
  ao50: { status: "insufficient-data" },
};

describe("StatisticsPanel", () => {
  it("shows placeholders, never fake numbers, when there are no solves", () => {
    render(<StatisticsPanel stats={EMPTY_STATS} />);
    expect(screen.getByText("Best").previousSibling).toHaveTextContent("--");
    expect(screen.getByText("Average").previousSibling).toHaveTextContent("--");
    expect(screen.getByText("Ao5").previousSibling).toHaveTextContent("--");
    expect(screen.getByText("Solves").previousSibling).toHaveTextContent("0");
  });

  it("renders a DNF average distinctly from insufficient data", () => {
    render(<StatisticsPanel stats={{ ...EMPTY_STATS, ao5: { status: "dnf" } }} />);
    expect(screen.getByText("Ao5").previousSibling).toHaveTextContent("DNF");
  });

  it("formats real statistics with centisecond precision", () => {
    render(
      <StatisticsPanel
        stats={{ ...EMPTY_STATS, count: 10, dnfCount: 1, plusTwoCount: 2, best: 9420, mean: 12000, ao5: { status: "ok", timeMs: 11500 } }}
      />,
    );
    expect(screen.getByText("Best").previousSibling).toHaveTextContent("9.42");
    expect(screen.getByText("Ao5").previousSibling).toHaveTextContent("11.50");
    expect(screen.getByText("DNFs").previousSibling).toHaveTextContent("1");
    expect(screen.getByText("+2s").previousSibling).toHaveTextContent("2");
  });
});
