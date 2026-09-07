import { create } from "zustand";
import { apiFetch, ApiError } from "./api-client";

export type Role = "OWNER" | "ACCOUNTANT" | "BUYER";

export type CurrentUser = {
  id: string;
  email: string;
  role: Role;
  orgId: string;
  mfaEnrolled: boolean;
};

type MeResponse = { id: string; email: string; role: Role; org_id: string; mfa_enrolled: boolean };
type TokenPair = { access_token: string; token_type: string };

type AuthState = {
  accessToken: string | null;
  user: CurrentUser | null;
  status: "idle" | "loading" | "authenticated" | "unauthenticated";
  login: (email: string, password: string, totpCode?: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Called once on app load: tries the httpOnly refresh cookie before
   * falling back to "unauthenticated" — an access token lives 15 minutes
   * (§14), so a page refresh must not force a fresh login every time. */
  hydrate: () => Promise<void>;
  setSession: (accessToken: string) => Promise<void>;
};

function toCurrentUser(me: MeResponse): CurrentUser {
  return { id: me.id, email: me.email, role: me.role, orgId: me.org_id, mfaEnrolled: me.mfa_enrolled };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  user: null,
  status: "idle",

  async login(email, password, totpCode) {
    const tokens = await apiFetch<TokenPair>("/auth/login", {
      method: "POST",
      body: { email, password, totp_code: totpCode || undefined },
    });
    await get().setSession(tokens.access_token);
  },

  async logout() {
    try {
      await apiFetch("/auth/logout", { method: "POST", accessToken: get().accessToken });
    } finally {
      set({ accessToken: null, user: null, status: "unauthenticated" });
    }
  },

  async hydrate() {
    set({ status: "loading" });
    try {
      const tokens = await apiFetch<TokenPair>("/auth/refresh", { method: "POST" });
      await get().setSession(tokens.access_token);
    } catch {
      set({ accessToken: null, user: null, status: "unauthenticated" });
    }
  },

  async setSession(accessToken) {
    try {
      const me = await apiFetch<MeResponse>("/auth/me", { accessToken });
      set({ accessToken, user: toCurrentUser(me), status: "authenticated" });
    } catch (err) {
      set({ accessToken: null, user: null, status: "unauthenticated" });
      throw err;
    }
  },
}));

export { ApiError };
