import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db, hashPassword, verifyPassword } from "../db.server";
import { setAuthCookies, clearAuthCookies, getAuthenticatedUser } from "../auth.server";
import type { SessionUser } from "../auth-store";
import type { Role } from "../mock-data";

export const loginFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    email: z.string().email(),
    password: z.string().min(6),
    remember: z.boolean().optional()
  }))
  .handler(async ({ data }) => {
    const creds = db.getCredentials(data.email);
    if (!creds || !verifyPassword(data.password, creds.passwordHash)) {
      throw new Error("Invalid email or password");
    }

    const employee = db.getEmployeeByEmail(data.email);
    if (!employee) {
      throw new Error("Employee record not found");
    }

    const user: SessionUser = {
      id: employee.id,
      name: employee.fullName,
      email: employee.email,
      role: employee.role,
      employeeId: employee.id
    };

    setAuthCookies(user);
    db.logAction(user.name, "LOGIN", "Workplace login");
    return user;
  });

export const signupFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    fullName: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    departmentId: z.string(),
    designation: z.string().min(2),
    role: z.enum(["admin", "employee", "hr", "manager"])
  }))
  .handler(async ({ data }) => {
    const existing = db.getEmployeeByEmail(data.email);
    if (existing) {
      throw new Error("Email address already registered");
    }

    const id = `e-${Date.now()}`;
    const employeeCode = `CVS-${Math.floor(100 + Math.random() * 900)}`;
    const passHash = hashPassword(data.password);

    const newEmployee = db.createEmployee({
      id,
      employeeCode,
      fullName: data.fullName,
      email: data.email,
      phone: "+92 300 0000000",
      cnic: "42101-0000000-0",
      address: "Address",
      gender: "male",
      dob: "1995-01-01",
      departmentId: data.departmentId,
      designation: data.designation,
      joiningDate: new Date().toISOString().slice(0, 10),
      status: "active",
      salary: 150000,
      role: data.role as Role
    }, passHash);

    const user: SessionUser = {
      id: newEmployee.id,
      name: newEmployee.fullName,
      email: newEmployee.email,
      role: newEmployee.role,
      employeeId: newEmployee.id
    };

    setAuthCookies(user);
    return user;
  });

export const logoutFn = createServerFn({ method: "POST" })
  .handler(async () => {
    const user = getAuthenticatedUser();
    if (user) {
      db.logAction(user.name, "LOGOUT", "Workplace logout");
    }
    clearAuthCookies();
    return { success: true };
  });

export const meFn = createServerFn({ method: "GET" })
  .handler(async () => {
    const user = getAuthenticatedUser();
    return user;
  });
