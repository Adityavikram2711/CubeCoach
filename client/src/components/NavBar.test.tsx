import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { useAuthStore } from "../store/authStore.js";
import { NavBar } from "./NavBar.js";

function resetStore() {
  useAuthStore.setState({ token: null, user: null, status: "idle", error: null });
}

describe("NavBar", () => {
  beforeEach(resetStore);

  it("shows Log In and Register links for a guest", () => {
    render(<NavBar />, { wrapper: MemoryRouter });
    expect(screen.getByRole("link", { name: /log in/i })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: /register/i })).toHaveAttribute("href", "/register");
    expect(screen.queryByRole("button", { name: /log out/i })).not.toBeInTheDocument();
  });

  it("always shows public links regardless of auth state", () => {
    render(<NavBar />, { wrapper: MemoryRouter });
    expect(screen.getByRole("link", { name: /^solve$/i })).toHaveAttribute("href", "/solve");
    expect(screen.getByRole("link", { name: /^algorithms$/i })).toHaveAttribute("href", "/algorithms");
  });

  it("shows the username and Log Out for an authenticated user", () => {
    useAuthStore.setState({
      status: "authenticated",
      user: { id: "1", username: "alice_cuber", email: "alice@example.com", createdAt: "", updatedAt: "" },
      token: "tok",
    });
    render(<NavBar />, { wrapper: MemoryRouter });
    expect(screen.getByRole("link", { name: "alice_cuber" })).toHaveAttribute("href", "/profile");
    expect(screen.getByRole("button", { name: /log out/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /log in/i })).not.toBeInTheDocument();
  });

  it("logout clears the auth state", async () => {
    useAuthStore.setState({
      status: "authenticated",
      user: { id: "1", username: "alice_cuber", email: "alice@example.com", createdAt: "", updatedAt: "" },
      token: "tok",
    });
    const user = userEvent.setup();
    render(<NavBar />, { wrapper: MemoryRouter });

    await user.click(screen.getByRole("button", { name: /log out/i }));

    expect(useAuthStore.getState().status).toBe("unauthenticated");
    expect(useAuthStore.getState().user).toBeNull();
  });
});
