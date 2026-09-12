import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "./authStore.js";

function jsonResponse(status: number, body: unknown): Response {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

function resetStore() {
  useAuthStore.setState({ token: null, user: null, status: "idle", error: null });
  window.localStorage.clear();
}

describe("useAuthStore", () => {
  beforeEach(() => {
    resetStore();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("starts idle with no user", () => {
    const { result } = renderHook(() => useAuthStore());
    expect(result.current.status).toBe("idle");
    expect(result.current.user).toBeNull();
  });

  it("login succeeds and stores the token and user", async () => {
    const user = { id: "1", username: "alice", email: "alice@example.com", createdAt: "", updatedAt: "" };
    (fetch as any).mockResolvedValue(jsonResponse(200, { success: true, token: "abc123", user }));

    const { result } = renderHook(() => useAuthStore());
    await act(async () => {
      await result.current.login("alice@example.com", "password123");
    });

    expect(result.current.status).toBe("authenticated");
    expect(result.current.token).toBe("abc123");
    expect(result.current.user).toEqual(user);
    expect(result.current.error).toBeNull();
  });

  it("login failure sets an error and unauthenticated status", async () => {
    (fetch as any).mockResolvedValue(jsonResponse(401, { success: false, error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password." } }));

    const { result } = renderHook(() => useAuthStore());
    await act(async () => {
      await expect(result.current.login("alice@example.com", "wrong")).rejects.toThrow();
    });

    expect(result.current.status).toBe("unauthenticated");
    expect(result.current.error).toBe("Invalid email or password.");
    expect(result.current.token).toBeNull();
  });

  it("register succeeds and authenticates", async () => {
    const user = { id: "2", username: "bob", email: "bob@example.com", createdAt: "", updatedAt: "" };
    (fetch as any).mockResolvedValue(jsonResponse(201, { success: true, token: "xyz", user }));

    const { result } = renderHook(() => useAuthStore());
    await act(async () => {
      await result.current.register("bob@example.com", "bob", "password123");
    });

    expect(result.current.status).toBe("authenticated");
    expect(result.current.user).toEqual(user);
  });

  it("register failure (duplicate email) sets an error", async () => {
    (fetch as any).mockResolvedValue(jsonResponse(409, { success: false, error: { code: "EMAIL_TAKEN", message: "An account with this email already exists." } }));

    const { result } = renderHook(() => useAuthStore());
    await act(async () => {
      await expect(result.current.register("bob@example.com", "bob", "password123")).rejects.toThrow();
    });

    expect(result.current.error).toBe("An account with this email already exists.");
  });

  it("logout clears user and token", async () => {
    useAuthStore.setState({ token: "abc", user: { id: "1", username: "a", email: "a@example.com", createdAt: "", updatedAt: "" }, status: "authenticated" });
    const { result } = renderHook(() => useAuthStore());

    act(() => result.current.logout());

    expect(result.current.token).toBeNull();
    expect(result.current.user).toBeNull();
    expect(result.current.status).toBe("unauthenticated");
  });

  it("restoreSession with no token goes straight to unauthenticated", async () => {
    const { result } = renderHook(() => useAuthStore());
    await act(async () => {
      await result.current.restoreSession();
    });
    expect(result.current.status).toBe("unauthenticated");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("restoreSession with a valid persisted token re-fetches and authenticates", async () => {
    const user = { id: "1", username: "alice", email: "alice@example.com", createdAt: "", updatedAt: "" };
    useAuthStore.setState({ token: "valid-token" });
    (fetch as any).mockResolvedValue(jsonResponse(200, { success: true, user }));

    const { result } = renderHook(() => useAuthStore());
    await act(async () => {
      await result.current.restoreSession();
    });

    expect(result.current.status).toBe("authenticated");
    expect(result.current.user).toEqual(user);
  });

  it("restoreSession with an invalid/expired token clears the session", async () => {
    useAuthStore.setState({ token: "expired-token" });
    (fetch as any).mockResolvedValue(jsonResponse(401, { success: false, error: { code: "UNAUTHORIZED", message: "Invalid or expired authentication token." } }));

    const { result } = renderHook(() => useAuthStore());
    await act(async () => {
      await result.current.restoreSession();
    });

    expect(result.current.status).toBe("unauthenticated");
    expect(result.current.token).toBeNull();
  });

  it("clearError resets the error field only", async () => {
    useAuthStore.setState({ error: "boom" });
    const { result } = renderHook(() => useAuthStore());
    act(() => result.current.clearError());
    expect(result.current.error).toBeNull();
  });
});
