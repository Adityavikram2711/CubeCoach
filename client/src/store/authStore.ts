import { create } from "zustand";
import { persist } from "zustand/middleware";
import { fetchMe, loginRequest, registerRequest, type AuthUser } from "../api/auth.js";

export type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated";

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  status: AuthStatus;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  /** Re-validates a persisted token against the server on app start -- never trusts a stored user object without this. */
  restoreSession: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      status: "idle",
      error: null,

      async login(email, password) {
        set({ status: "loading", error: null });
        try {
          const { token, user } = await loginRequest(email, password);
          set({ token, user, status: "authenticated", error: null });
        } catch (err) {
          set({ status: "unauthenticated", error: (err as Error).message });
          throw err;
        }
      },

      async register(email, username, password) {
        set({ status: "loading", error: null });
        try {
          const { token, user } = await registerRequest(email, username, password);
          set({ token, user, status: "authenticated", error: null });
        } catch (err) {
          set({ status: "unauthenticated", error: (err as Error).message });
          throw err;
        }
      },

      logout() {
        set({ token: null, user: null, status: "unauthenticated", error: null });
      },

      async restoreSession() {
        const token = get().token;
        if (!token) {
          set({ status: "unauthenticated" });
          return;
        }
        set({ status: "loading" });
        try {
          const user = await fetchMe(token);
          set({ user, status: "authenticated" });
        } catch {
          set({ token: null, user: null, status: "unauthenticated" });
        }
      },

      clearError() {
        set({ error: null });
      },
    }),
    {
      name: "cubecoach-auth",
      partialize: (state) => ({ token: state.token }),
    },
  ),
);
