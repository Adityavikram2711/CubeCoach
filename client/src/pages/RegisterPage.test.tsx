import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "../store/authStore.js";
import { RegisterPage } from "./RegisterPage.js";

const navigateMock = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => navigateMock };
});

function resetStore() {
  useAuthStore.setState({ token: null, user: null, status: "idle", error: null });
}

describe("RegisterPage", () => {
  beforeEach(() => {
    resetStore();
    navigateMock.mockClear();
  });

  it("renders username, email, password, and confirm password fields", () => {
    render(<RegisterPage />, { wrapper: MemoryRouter });
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it("shows a validation error when passwords don't match and does not call register", async () => {
    const registerMock = vi.fn();
    useAuthStore.setState({ register: registerMock });

    const user = userEvent.setup();
    render(<RegisterPage />, { wrapper: MemoryRouter });

    await user.type(screen.getByLabelText(/username/i), "alice_cuber");
    await user.type(screen.getByLabelText(/email/i), "alice@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "different123");
    await user.click(screen.getByRole("button", { name: /register/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/do not match/i);
    expect(registerMock).not.toHaveBeenCalled();
  });

  it("registers and navigates to /profile when passwords match", async () => {
    const registerMock = vi.fn().mockResolvedValue(undefined);
    useAuthStore.setState({ register: registerMock });

    const user = userEvent.setup();
    render(<RegisterPage />, { wrapper: MemoryRouter });

    await user.type(screen.getByLabelText(/username/i), "alice_cuber");
    await user.type(screen.getByLabelText(/email/i), "alice@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "password123");
    await user.click(screen.getByRole("button", { name: /register/i }));

    expect(registerMock).toHaveBeenCalledWith("alice@example.com", "alice_cuber", "password123");
    expect(navigateMock).toHaveBeenCalledWith("/profile");
  });

  it("surfaces a duplicate-email error from the store", async () => {
    useAuthStore.setState({ error: "An account with this email already exists." });
    render(<RegisterPage />, { wrapper: MemoryRouter });
    expect(screen.getByRole("alert")).toHaveTextContent(/already exists/i);
  });

  it("has a link to the login page", () => {
    render(<RegisterPage />, { wrapper: MemoryRouter });
    expect(screen.getByRole("link", { name: /log in/i })).toHaveAttribute("href", "/login");
  });
});
