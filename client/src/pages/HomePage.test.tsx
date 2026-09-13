import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { HomePage } from "./HomePage.js";

describe("HomePage", () => {
  it("renders the CubeCoach hero", () => {
    render(<HomePage />, { wrapper: MemoryRouter });
    expect(screen.getByText("CubeCoach")).toBeInTheDocument();
    expect(screen.getByText("Solve. Learn. Practice. Master the Cube.")).toBeInTheDocument();
  });

  it("links to the solver and algorithm library", () => {
    render(<HomePage />, { wrapper: MemoryRouter });
    // Exact-match names: the hero's own CTAs, not the feature cards further down the
    // page (e.g. "Verified Algorithm Library"), which also link to these routes.
    expect(screen.getByRole("link", { name: /^solve a cube$/i })).toHaveAttribute("href", "/solve");
    expect(screen.getByRole("link", { name: /^algorithm library$/i })).toHaveAttribute("href", "/algorithms");
  });
});
