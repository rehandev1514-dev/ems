/**
 * Client-side auth using localStorage.
 * Replaces the server-side cookie/JWT auth system (auth.server.ts + auth.functions.ts).
 * All data is persisted in localStorage — suitable for demo/portfolio apps.
 */

import { getDb, saveDb, initDb } from "./data";
import type { Role } from "../mock-data";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  employeeId: string;
}

const SESSION_KEY = "vertex_ems_session";

export function getSession(): SessionUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export function setSession(user: SessionUser): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

// Simple password "hashing" for demo purposes (NOT production-safe)
function hashPwd(pwd: string): string {
  let hash = 0;
  for (let i = 0; i < pwd.length; i++) {
    hash = (hash << 5) - hash + pwd.charCodeAt(i);
    hash |= 0;
  }
  return `demo_${hash}`;
}

function verifyPwd(pwd: string, stored: string): boolean {
  return hashPwd(pwd) === stored;
}

export async function loginUser(email: string, password: string): Promise<SessionUser> {
  initDb();
  const db = getDb();
  const cred = db.credentials.find((c) => c.email.toLowerCase() === email.toLowerCase());
  if (!cred || !verifyPwd(password, cred.passwordHash)) {
    throw new Error("Invalid email or password");
  }

  const emp = db.employees.find((e) => e.email.toLowerCase() === email.toLowerCase());
  if (!emp) throw new Error("Employee record not found");

  if (emp.status === "pending") {
    throw new Error(
      "Your account is pending admin approval. You will be able to sign in once the admin approves your registration.",
    );
  }

  const user: SessionUser = {
    id: emp.id,
    name: emp.fullName,
    email: emp.email,
    role: emp.role,
    employeeId: emp.id,
  };

  setSession(user);

  // Audit log
  db.auditLogs.unshift({
    id: `au-${Date.now()}`,
    actor: user.name,
    action: "LOGIN",
    target: "Workplace login",
    timestamp: new Date().toISOString(),
    ip: "—",
  });
  saveDb(db);

  return user;
}

export async function signupUser(params: {
  fullName: string;
  email: string;
  password: string;
  departmentId: string;
  designation: string;
  role: Role;
}): Promise<SessionUser & { isPending?: boolean }> {
  initDb();
  const db = getDb();

  const existing = db.employees.find((e) => e.email.toLowerCase() === params.email.toLowerCase());
  if (existing) throw new Error("Email address already registered");

  const id = `e-${Date.now()}`;
  const employeeCode = `CVS-${Math.floor(100 + Math.random() * 900)}`;
  const passwordHash = hashPwd(params.password);
  const isPending = params.role !== "admin";

  const newEmployee = {
    id,
    employeeCode,
    fullName: params.fullName,
    email: params.email,
    phone: "+92 300 0000000",
    cnic: "42101-0000000-0",
    address: "Address",
    gender: "male" as const,
    dob: "1995-01-01",
    departmentId: params.departmentId,
    designation: params.designation,
    joiningDate: new Date().toISOString().slice(0, 10),
    status: isPending ? ("pending" as const) : ("active" as const),
    salary: 150000,
    role: params.role,
  };

  db.employees.push(newEmployee);
  db.credentials.push({ email: params.email, passwordHash });
  db.notifications.unshift({
    id: `n-${Date.now()}`,
    title: "New Registration Request",
    body: `${params.fullName} has registered as a ${params.role} and is pending approval.`,
    kind: "system",
    unread: true,
    createdAt: new Date().toISOString(),
  });
  saveDb(db);

  if (isPending) {
    return {
      id,
      name: params.fullName,
      email: params.email,
      role: params.role,
      employeeId: id,
      isPending: true,
    };
  }

  const user: SessionUser = {
    id,
    name: params.fullName,
    email: params.email,
    role: params.role,
    employeeId: id,
  };
  setSession(user);
  return user;
}

export async function logoutUser(): Promise<void> {
  const session = getSession();
  if (session) {
    const db = getDb();
    db.auditLogs.unshift({
      id: `au-${Date.now()}`,
      actor: session.name,
      action: "LOGOUT",
      target: "Workplace logout",
      timestamp: new Date().toISOString(),
      ip: "—",
    });
    saveDb(db);
  }
  clearSession();
}
