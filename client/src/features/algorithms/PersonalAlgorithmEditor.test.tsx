import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PersonalAlgorithmEditor } from "./PersonalAlgorithmEditor.js";

describe("PersonalAlgorithmEditor", () => {
  it("shows a prompt to add a personal algorithm when none is set", () => {
    render(<PersonalAlgorithmEditor officialAlgorithm="R U R' U'" onSave={vi.fn()} onReset={vi.fn()} />);
    expect(screen.getByText(/haven't set a personal algorithm/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add a personal algorithm/i })).toBeInTheDocument();
  });

  it("shows the current personal algorithm, clearly separated from the official one", () => {
    render(<PersonalAlgorithmEditor officialAlgorithm="R U R' U'" currentValue="F R U R' U' F'" onSave={vi.fn()} onReset={vi.fn()} />);
    expect(screen.getByText("Your Personal Algorithm")).toBeInTheDocument();
    expect(screen.getByText("F R U R' U' F'")).toBeInTheDocument();
    expect(screen.queryByText("R U R' U'")).not.toBeInTheDocument();
  });

  it("rejects invalid notation and does not call onSave", async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();
    render(<PersonalAlgorithmEditor officialAlgorithm="R U R' U'" onSave={onSave} onReset={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /add a personal algorithm/i }));
    const input = screen.getByLabelText(/your personal algorithm/i);
    await user.clear(input);
    await user.type(input, "this is not an algorithm");
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/not a valid move sequence/i);
    expect(onSave).not.toHaveBeenCalled();
  });

  it("saves a valid algorithm", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<PersonalAlgorithmEditor officialAlgorithm="R U R' U'" onSave={onSave} onReset={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /add a personal algorithm/i }));
    const input = screen.getByLabelText(/your personal algorithm/i);
    await user.clear(input);
    await user.type(input, "F R U R' U' F'");
    await user.click(screen.getByRole("button", { name: /save/i }));

    expect(onSave).toHaveBeenCalledWith("F R U R' U' F'");
  });

  it("cancel discards the draft without calling onSave", async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();
    render(<PersonalAlgorithmEditor officialAlgorithm="R U R' U'" onSave={onSave} onReset={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /add a personal algorithm/i }));
    await user.type(screen.getByLabelText(/your personal algorithm/i), "garbage input");
    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /add a personal algorithm/i })).toBeInTheDocument();
  });

  it("reset to official calls onReset and clears the personal value", async () => {
    const onReset = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<PersonalAlgorithmEditor officialAlgorithm="R U R' U'" currentValue="F R U R' U' F'" onSave={vi.fn()} onReset={onReset} />);

    await user.click(screen.getByRole("button", { name: /reset to official/i }));
    expect(onReset).toHaveBeenCalled();
  });
});
