import { create } from "zustand";
import type { Role } from "./mock-data";
import { loginUser, signupUser, logoutUser, getSession, type SessionUser } from "./api/auth";
import { initDb } from "./api/data";

export type { SessionUser };

interface AuthState {
  user: SessionUser | null;
  loading: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<SessionUser>;
  signup: (
    fullName: string,
    email: string,
    password: string,
    departmentId: string,
    designation: string,
    role: Role,
  ) => Promise<SessionUser & { isPending?: boolean }>;
  logout: () => Promise<void>;
  checkSession: () => Promise<SessionUser | null>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: true,

  async login(email, password) {
    try {
      const user = await loginUser(email, password);
      set({ user, loading: false });
      return user;
    } catch (e: unknown) {
      const err = e as Error;
      throw new Error(err.message || "Invalid credentials");
    }
  },

  async signup(fullName, email, password, departmentId, designation, role) {
    try {
      const res = await signupUser({ fullName, email, password, departmentId, designation, role });
      if (res?.isPending) {
        set({ user: null, loading: false });
        return res;
      }
      set({ user: res, loading: false });
      return res;
    } catch (e: unknown) {
      const err = e as Error;
      throw new Error(err.message || "Failed to sign up");
    }
  },

  async logout() {
    try {
      await logoutUser();
    } finally {
      set({ user: null, loading: false });
    }
  },

  async checkSession() {
    set({ loading: true });
    try {
      initDb();
      const user = getSession();
      set({ user, loading: false });
      return user;
    } catch {
      set({ user: null, loading: false });
      return null;
    }
  },
}));
