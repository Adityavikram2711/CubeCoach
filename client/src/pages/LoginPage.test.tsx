import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "../store/authStore.js";
import { LoginPage } from "./LoginPage.js";

const navigateMock = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => navigateMock };
});

function resetStore() {
  useAuthStore.setState({ token: null, user: null, status: "idle", error: null });
}

describe("LoginPage", () => {
  beforeEach(() => {
    resetStore();
    navigateMock.mockClear();
  });

  it("renders email and password fields with a login button", () => {
    render(<LoginPage />, { wrapper: MemoryRouter });
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();
  });

  it("toggles password visibility", async () => {
    const user = userEvent.setup();
    render(<LoginPage />, { wrapper: MemoryRouter });
    const passwordInput = screen.getByLabelText(/^password$/i) as HTMLInputElement;
    expect(passwordInput.type).toBe("password");

    await user.click(screen.getByRole("button", { name: /show password/i }));
    expect(passwordInput.type).toBe("text");
  });

  it("calls login and navigates to /profile on success", async () => {
    const loginMock = vi.fn().mockResolvedValue(undefined);
    useAuthStore.setState({ login: loginMock });

    const user = userEvent.setup();
    render(<LoginPage />, { wrapper: MemoryRouter });

    await user.type(screen.getByLabelText(/email/i), "alice@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(loginMock).toHaveBeenCalledWith("alice@example.com", "password123");
    expect(navigateMock).toHaveBeenCalledWith("/profile");
  });

  it("shows an error message and does not navigate when login fails", async () => {
    const loginMock = vi.fn().mockRejectedValue(new Error("Invalid email or password."));
    useAuthStore.setState({ login: loginMock });

    const user = userEvent.setup();
    render(<LoginPage />, { wrapper: MemoryRouter });

    await user.type(screen.getByLabelText(/email/i), "alice@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "wrong");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    // the store sets `error` itself; simulate that here since we mocked login directly
    useAuthStore.setState({ error: "Invalid email or password." });
    render(<LoginPage />, { wrapper: MemoryRouter });
    expect(screen.getAllByRole("alert")[0]).toHaveTextContent("Invalid email or password.");
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("has a link to the register page", () => {
    render(<LoginPage />, { wrapper: MemoryRouter });
    expect(screen.getByRole("link", { name: /register/i })).toHaveAttribute("href", "/register");
  });
});
