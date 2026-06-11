import { create } from "zustand";
import type { Role } from "./mock-data";
import { loginFn, signupFn, logoutFn, meFn } from "./api/auth.functions";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  employeeId: string;
}

interface AuthState {
  user: SessionUser | null;
  loading: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<SessionUser>;
  signup: (fullName: string, email: string, password: string, departmentId: string, designation: string, role: Role) => Promise<SessionUser>;
  logout: () => Promise<void>;
  checkSession: () => Promise<SessionUser | null>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: true,
  
  async login(email, password, remember = true) {
    try {
      const user = await loginFn({ data: { email, password, remember } });
      set({ user, loading: false });
      return user;
    } catch (e: any) {
      console.error("Login failed:", e);
      throw new Error(e.message || "Invalid credentials");
    }
  },

  async signup(fullName, email, password, departmentId, designation, role) {
    try {
      const user = await signupFn({
        data: { fullName, email, password, departmentId, designation, role }
      });
      set({ user, loading: false });
      return user;
    } catch (e: any) {
      console.error("Signup failed:", e);
      throw new Error(e.message || "Failed to sign up");
    }
  },

  async logout() {
    try {
      await logoutFn();
    } catch (e) {
      console.error("Logout failed on server:", e);
    } finally {
      set({ user: null, loading: false });
    }
  },

  async checkSession() {
    set({ loading: true });
    try {
      const user = await meFn();
      set({ user, loading: false });
      return user;
    } catch (e) {
      set({ user: null, loading: false });
      return null;
    }
  }
}));

