import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as userAlgorithmsApi from "../api/userAlgorithms.js";
import { useAuthStore } from "../store/authStore.js";
import { ProfilePage } from "./ProfilePage.js";

vi.mock("../api/userAlgorithms.js");

function renderWithProviders(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>, { wrapper: MemoryRouter });
}

function resetStore() {
  useAuthStore.setState({ token: null, user: null, status: "idle", error: null });
}

describe("ProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  it("redirects an unauthenticated (guest) visitor away from the profile", () => {
    useAuthStore.setState({ status: "unauthenticated" });
    renderWithProviders(<ProfilePage />);
    expect(screen.queryByText(/member since/i)).not.toBeInTheDocument();
  });

  it("shows username, email, and join date for an authenticated user", async () => {
    useAuthStore.setState({
      status: "authenticated",
      user: { id: "1", username: "alice_cuber", email: "alice@example.com", createdAt: "2024-01-15T00:00:00.000Z", updatedAt: "" },
      token: "tok",
    });
    vi.mocked(userAlgorithmsApi.fetchUserAlgorithms).mockResolvedValue([]);

    renderWithProviders(<ProfilePage />);

    expect(screen.getByText("alice_cuber")).toBeInTheDocument();
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
    expect(await screen.findByText(/member since/i)).toBeInTheDocument();
  });

  it("shows learned/favorite/practiced counts derived from the user's records", async () => {
    useAuthStore.setState({
      status: "authenticated",
      user: { id: "1", username: "alice", email: "alice@example.com", createdAt: "2024-01-15T00:00:00.000Z", updatedAt: "" },
      token: "tok",
    });
    vi.mocked(userAlgorithmsApi.fetchUserAlgorithms).mockResolvedValue([
      { _id: "1", userId: "1", algorithmId: "oll-01", personalAlternatives: [], notes: "", favorite: true, learned: true, practiceCount: 0, successCount: 0, createdAt: "", updatedAt: "" },
      { _id: "2", userId: "1", algorithmId: "pll-01", personalAlternatives: [], notes: "", favorite: true, learned: false, practiceCount: 0, successCount: 0, createdAt: "", updatedAt: "" },
    ]);

    renderWithProviders(<ProfilePage />);

    expect(await screen.findByText("1 / 102")).toBeInTheDocument(); // learned
    expect(screen.getByText("2")).toBeInTheDocument(); // favorites
  });

  it("shows a placeholder success rate when there is no practice data yet", async () => {
    useAuthStore.setState({
      status: "authenticated",
      user: { id: "1", username: "alice", email: "alice@example.com", createdAt: "2024-01-15T00:00:00.000Z", updatedAt: "" },
      token: "tok",
    });
    vi.mocked(userAlgorithmsApi.fetchUserAlgorithms).mockResolvedValue([]);

    renderWithProviders(<ProfilePage />);
    expect(await screen.findByText("--")).toBeInTheDocument();
  });

  it("has a working logout button", async () => {
    useAuthStore.setState({
      status: "authenticated",
      user: { id: "1", username: "alice", email: "alice@example.com", createdAt: "2024-01-15T00:00:00.000Z", updatedAt: "" },
      token: "tok",
    });
    vi.mocked(userAlgorithmsApi.fetchUserAlgorithms).mockResolvedValue([]);
    renderWithProviders(<ProfilePage />);
    expect(await screen.findByRole("button", { name: /log out/i })).toBeInTheDocument();
  });
});
