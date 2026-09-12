import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as userAlgorithmsApi from "../../api/userAlgorithms.js";
import { useAuthStore } from "../../store/authStore.js";
import { PersonalizationPanel } from "./PersonalizationPanel.js";

vi.mock("../../api/userAlgorithms.js");

function renderWithClient(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

const BASE_RECORD = {
  _id: "rec1",
  userId: "u1",
  algorithmId: "oll-01",
  personalAlternatives: [] as string[],
  notes: "",
  favorite: false,
  learned: false,
  practiceCount: 0,
  successCount: 0,
  createdAt: "",
  updatedAt: "",
};

describe("PersonalizationPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ token: "tok", user: { id: "u1", username: "a", email: "a@example.com", createdAt: "", updatedAt: "" }, status: "authenticated" });
    vi.mocked(userAlgorithmsApi.fetchUserAlgorithm).mockResolvedValue({ ...BASE_RECORD });
  });

  it("shows favorite and learned as off by default", async () => {
    renderWithClient(<PersonalizationPanel algorithmId="oll-01" officialAlgorithm="R U R' U'" />);
    expect(await screen.findByRole("button", { name: /^favorite$/i })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: /mark as learned/i })).toHaveAttribute("aria-pressed", "false");
  });

  it("toggling favorite calls the API and reflects the optimistic update", async () => {
    vi.mocked(userAlgorithmsApi.toggleFavorite).mockResolvedValue({ ...BASE_RECORD, favorite: true });
    const user = userEvent.setup();
    renderWithClient(<PersonalizationPanel algorithmId="oll-01" officialAlgorithm="R U R' U'" />);

    const favButton = await screen.findByRole("button", { name: /^favorite$/i });
    await user.click(favButton);

    await waitFor(() => expect(userAlgorithmsApi.toggleFavorite).toHaveBeenCalledWith("tok", "oll-01"));
    await waitFor(() => expect(screen.getByRole("button", { name: /favorited/i })).toBeInTheDocument());
  });

  it("toggling learned calls the API independently of favorite", async () => {
    vi.mocked(userAlgorithmsApi.toggleLearned).mockResolvedValue({ ...BASE_RECORD, learned: true });
    const user = userEvent.setup();
    renderWithClient(<PersonalizationPanel algorithmId="oll-01" officialAlgorithm="R U R' U'" />);

    await user.click(await screen.findByRole("button", { name: /mark as learned/i }));
    await waitFor(() => expect(userAlgorithmsApi.toggleLearned).toHaveBeenCalledWith("tok", "oll-01"));
  });

  it("saving notes calls upsertUserAlgorithm with the note text", async () => {
    vi.mocked(userAlgorithmsApi.upsertUserAlgorithm).mockResolvedValue({ ...BASE_RECORD, notes: "left hand grip" });
    const user = userEvent.setup();
    renderWithClient(<PersonalizationPanel algorithmId="oll-01" officialAlgorithm="R U R' U'" />);

    const notesBox = await screen.findByLabelText(/notes/i);
    await user.type(notesBox, "left hand grip");
    await user.click(screen.getByRole("button", { name: /save notes/i }));

    expect(userAlgorithmsApi.upsertUserAlgorithm).toHaveBeenCalledWith("tok", "oll-01", { notes: "left hand grip" });
  });

  it("adding an invalid personal alternative shows an error and does not call the API", async () => {
    const user = userEvent.setup();
    renderWithClient(<PersonalizationPanel algorithmId="oll-01" officialAlgorithm="R U R' U'" />);

    const input = await screen.findByLabelText(/add a personal alternative/i);
    await user.type(input, "not an algorithm at all !!");
    await user.click(screen.getByRole("button", { name: /^add$/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/not a valid move sequence/i);
    expect(userAlgorithmsApi.upsertUserAlgorithm).not.toHaveBeenCalled();
  });

  it("adding a valid personal alternative calls the API with the appended list", async () => {
    vi.mocked(userAlgorithmsApi.upsertUserAlgorithm).mockResolvedValue({ ...BASE_RECORD, personalAlternatives: ["F R U R' U' F'"] });
    const user = userEvent.setup();
    renderWithClient(<PersonalizationPanel algorithmId="oll-01" officialAlgorithm="R U R' U'" />);

    const input = await screen.findByLabelText(/add a personal alternative/i);
    await user.type(input, "F R U R' U' F'");
    await user.click(screen.getByRole("button", { name: /^add$/i }));

    expect(userAlgorithmsApi.upsertUserAlgorithm).toHaveBeenCalledWith("tok", "oll-01", { personalAlternatives: ["F R U R' U' F'"] });
  });

  it("removing an existing alternative calls the API with it excluded", async () => {
    vi.mocked(userAlgorithmsApi.fetchUserAlgorithm).mockResolvedValue({ ...BASE_RECORD, personalAlternatives: ["F R U R' U' F'"] });
    vi.mocked(userAlgorithmsApi.upsertUserAlgorithm).mockResolvedValue({ ...BASE_RECORD, personalAlternatives: [] });
    const user = userEvent.setup();
    renderWithClient(<PersonalizationPanel algorithmId="oll-01" officialAlgorithm="R U R' U'" />);

    const removeButton = await screen.findByRole("button", { name: /remove alternative/i });
    await user.click(removeButton);

    expect(userAlgorithmsApi.upsertUserAlgorithm).toHaveBeenCalledWith("tok", "oll-01", { personalAlternatives: [] });
  });

  it("resetting the personal algorithm to official sends preferredAlgorithm: null", async () => {
    vi.mocked(userAlgorithmsApi.fetchUserAlgorithm).mockResolvedValue({ ...BASE_RECORD, preferredAlgorithm: "F R U R' U' F'" });
    vi.mocked(userAlgorithmsApi.upsertUserAlgorithm).mockResolvedValue({ ...BASE_RECORD });
    const user = userEvent.setup();
    renderWithClient(<PersonalizationPanel algorithmId="oll-01" officialAlgorithm="R U R' U'" />);

    await user.click(await screen.findByRole("button", { name: /reset to official/i }));

    expect(userAlgorithmsApi.upsertUserAlgorithm).toHaveBeenCalledWith("tok", "oll-01", { preferredAlgorithm: null });
  });
});
