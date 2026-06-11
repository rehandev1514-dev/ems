import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { db } from "../db.server";
import { requireAuth, requireRole } from "../auth.server";
import type { Employee, AttendanceRecord, LeaveRequest, Project, Asset, DocumentItem, Role } from "../mock-data";

// ------------------------------------
// Employee functions
// ------------------------------------
export const getEmployeesFn = createServerFn({ method: "GET" })
  .handler(async () => {
    const caller = requireAuth();
    const all = db.getEmployees();

    // Enforce RBAC filtering
    if (caller.role === "admin" || caller.role === "manager") {
      return all;
    }
    // Employee can only see basic directory or limited details, but for the table listing let's filter or return all based on company policy.
    // Let's return all so they can see team list, but salary field should be hidden on client unless role is admin/hr/accountant.
    return all;
  });

export const getEmployeeByIdFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const caller = requireAuth();
    
    // RBAC check: employees can only view their own profile, others (admin, manager) can view any
    if (caller.role !== "admin" && caller.role !== "manager" && caller.id !== data.id) {
      throw new Error("Forbidden: You can only view your own profile");
    }

    const emp = db.getEmployee(data.id);
    if (!emp) throw new Error("Employee not found");
    return emp;
  });

export const createEmployeeFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    fullName: z.string().min(2),
    email: z.string().email(),
    phone: z.string(),
    cnic: z.string(),
    address: z.string(),
    gender: z.enum(["male", "female", "other"]),
    dob: z.string(),
    departmentId: z.string(),
    designation: z.string(),
    joiningDate: z.string(),
    status: z.enum(["active", "on_leave", "probation", "terminated"]),
    salary: z.number().positive(),
    role: z.enum(["admin", "employee", "manager", "supervisor", "accountant"])
  }))
  .handler(async ({ data }) => {
    const caller = requireRole(["admin", "manager"]);
    const existing = db.getEmployeeByEmail(data.email);
    if (existing) throw new Error("Email already registered");

    const id = `e-${Date.now()}`;
    const employeeCode = `CVS-${Math.floor(100 + Math.random() * 900)}`;
    const passHash = require("../db.server").hashPassword("demo1234"); // Default password

    const emp = db.createEmployee({
      id,
      employeeCode,
      ...data
    }, passHash);

    db.logAction(caller.name, "CREATE", `Employee ${emp.id} — ${emp.fullName}`);
    return emp;
  });

export const updateEmployeeFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    id: z.string(),
    updates: z.any()
  }))
  .handler(async ({ data }) => {
    const caller = requireAuth();
    
    // RBAC: employees can edit some of their own details (e.g. phone, address). Admin/Manager can edit anything.
    if (caller.role !== "admin" && caller.role !== "manager" && caller.id !== data.id) {
      throw new Error("Forbidden: Insufficient privileges to update employee details");
    }

    // Secure payload: prevent employees from changing role, department, salary or status
    const updates = { ...data.updates };
    if (caller.role !== "admin" && caller.role !== "manager") {
      delete updates.salary;
      delete updates.role;
      delete updates.status;
      delete updates.departmentId;
      delete updates.joiningDate;
      delete updates.employeeCode;
    }

    const updated = db.updateEmployee(data.id, updates);
    if (!updated) throw new Error("Employee not found");

    db.logAction(caller.name, "UPDATE", `Employee ${data.id} details`);
    return updated;
  });

export const deleteEmployeeFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const caller = requireRole(["admin"]);
    const success = db.deleteEmployee(data.id);
    if (!success) throw new Error("Employee not found");
    db.logAction(caller.name, "DELETE", `Employee ${data.id}`);
    return { success: true };
  });

// ------------------------------------
// Departments
// ------------------------------------
export const getDepartmentsFn = createServerFn({ method: "GET" })
  .handler(async () => {
    requireAuth();
    return db.data?.departments || [];
  });

// ------------------------------------
// Attendance functions
// ------------------------------------
export const getAttendanceFn = createServerFn({ method: "GET" })
  .handler(async () => {
    const caller = requireAuth();
    const all = db.getAttendance();

    // Employees can only see their own attendance
    if (caller.role === "employee") {
      return all.filter(r => r.employeeId === caller.employeeId);
    }
    return all;
  });

export const checkInFn = createServerFn({ method: "POST" })
  .handler(async () => {
    const caller = requireAuth();
    const todayStr = new Date().toISOString().slice(0, 10);
    
    // Check if already checked in today
    const existing = db.getAttendance().find(r => r.employeeId === caller.employeeId && r.date === todayStr);
    if (existing) {
      throw new Error("Already checked in today");
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" });
    
    // Calculate status (late if checked in after 09:15)
    const [hours, minutes] = timeStr.split(":").map(Number);
    const totalMins = hours * 60 + minutes;
    const limitMins = 9 * 60 + 15; // 09:15 AM
    const status = totalMins > limitMins ? "late" : "present";

    const rec: AttendanceRecord = {
      id: `a-${caller.employeeId}-${todayStr}`,
      employeeId: caller.employeeId,
      date: todayStr,
      checkIn: timeStr,
      checkOut: null,
      status,
      hours: 0
    };

    db.createAttendance(rec);
    db.logAction(caller.name, "ATTENDANCE_CHECK_IN", `Check-in at ${timeStr}`);
    return rec;
  });

export const checkOutFn = createServerFn({ method: "POST" })
  .handler(async () => {
    const caller = requireAuth();
    const todayStr = new Date().toISOString().slice(0, 10);

    const existing = db.getAttendance().find(r => r.employeeId === caller.employeeId && r.date === todayStr);
    if (!existing || !existing.checkIn) {
      throw new Error("Must check in before checking out");
    }
    if (existing.checkOut) {
      throw new Error("Already checked out today");
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" });

    // Calculate hours worked
    const [inH, inM] = existing.checkIn.split(":").map(Number);
    const [outH, outM] = timeStr.split(":").map(Number);
    const workedMins = (outH * 60 + outM) - (inH * 60 + inM);
    const hours = Math.round((workedMins / 60) * 100) / 100;

    const updates: Partial<AttendanceRecord> = {
      checkOut: timeStr,
      hours: Math.max(0, hours)
    };

    const updated = db.updateAttendance(existing.id, updates);
    db.logAction(caller.name, "ATTENDANCE_CHECK_OUT", `Check-out at ${timeStr}`);
    return updated;
  });

// ------------------------------------
// Leave functions
// ------------------------------------
export const getLeavesFn = createServerFn({ method: "GET" })
  .handler(async () => {
    const caller = requireAuth();
    const all = db.getLeaves();

    if (caller.role === "employee") {
      return all.filter(l => l.employeeId === caller.employeeId);
    }
    // Managers can see all, or we could filter by department
    return all;
  });

export const applyLeaveFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    type: z.enum(["annual", "sick", "casual", "emergency"]),
    startDate: z.string(),
    endDate: z.string(),
    reason: z.string().min(5)
  }))
  .handler(async ({ data }) => {
    const caller = requireAuth();
    
    // Calculate difference in days
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    if (end < start) {
      throw new Error("End date cannot be earlier than start date");
    }
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const id = `l-${Date.now()}`;
    const newRequest: LeaveRequest = {
      id,
      employeeId: caller.employeeId,
      type: data.type,
      startDate: data.startDate,
      endDate: data.endDate,
      days,
      reason: data.reason,
      status: "pending",
      appliedAt: new Date().toISOString().slice(0, 10)
    };

    db.createLeave(newRequest);

    // Create system notification for HR/Managers
    db.createNotification({
      id: `n-${Date.now()}`,
      title: "New Leave Request",
      body: `${caller.name} requested ${days} day(s) of ${data.type} leave.`,
      kind: "leave",
      unread: true,
      createdAt: new Date().toISOString()
    });

    db.logAction(caller.name, "APPLY_LEAVE", `Applied for ${days} days`);
    return newRequest;
  });

export const updateLeaveStatusFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    id: z.string(),
    status: z.enum(["approved", "rejected"])
  }))
  .handler(async ({ data }) => {
    const caller = requireRole(["admin", "manager"]);
    
    const request = db.getLeaves().find(l => l.id === data.id);
    if (!request) throw new Error("Leave request not found");

    const updated = db.updateLeave(data.id, { status: data.status });
    
    // Notify employee
    db.createNotification({
      id: `n-${Date.now()}`,
      title: `Leave Request ${data.status.toUpperCase()}`,
      body: `Your request for ${request.type} leave starting on ${request.startDate} has been ${data.status}.`,
      kind: "leave",
      unread: true,
      createdAt: new Date().toISOString()
    });

    db.logAction(caller.name, `LEAVE_${data.status.toUpperCase()}`, `Leave request ${data.id}`);
    return updated;
  });

// ------------------------------------
// Document functions
// ------------------------------------
export const getDocumentsFn = createServerFn({ method: "GET" })
  .handler(async () => {
    const caller = requireAuth();
    const all = db.getDocuments();
    if (caller.role === "employee") {
      return all.filter(d => d.employeeId === caller.employeeId);
    }
    return all;
  });

export const uploadDocumentFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    name: z.string().min(1),
    type: z.enum(["contract", "certificate", "id", "offer_letter", "other"]),
    employeeId: z.string(),
    fileBase64: z.string() // Simulated file saving in database
  }))
  .handler(async ({ data }) => {
    const caller = requireAuth();
    
    // Check privilege
    if (caller.role !== "admin" && caller.role !== "manager" && caller.id !== data.employeeId) {
      throw new Error("Forbidden: Insufficient privileges to upload documents for this employee");
    }

    const doc: DocumentItem = {
      id: `doc-${Date.now()}`,
      name: data.name,
      type: data.type,
      employeeId: data.employeeId,
      uploadedAt: new Date().toISOString().slice(0, 10),
      sizeKb: Math.round(data.fileBase64.length * 0.75 / 1024)
    };

    db.createDocument(doc);
    db.logAction(caller.name, "UPLOAD_DOCUMENT", `Document ${doc.name} uploaded`);
    return doc;
  });

export const deleteDocumentFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const caller = requireAuth();
    const doc = db.getDocuments().find(d => d.id === data.id);
    if (!doc) throw new Error("Document not found");

    if (caller.role !== "admin" && caller.role !== "manager" && caller.id !== doc.employeeId) {
      throw new Error("Forbidden: Insufficient privileges");
    }

    db.deleteDocument(data.id);
    db.logAction(caller.name, "DELETE_DOCUMENT", `Document ${doc.name} deleted`);
    return { success: true };
  });

// ------------------------------------
// Assets
// ------------------------------------
export const getAssetsFn = createServerFn({ method: "GET" })
  .handler(async () => {
    const caller = requireAuth();
    const all = db.getAssets();
    if (caller.role === "employee") {
      return all.filter(a => a.assignedTo === caller.employeeId);
    }
    return all;
  });

export const createAssetFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    tag: z.string(),
    name: z.string(),
    category: z.enum(["laptop", "monitor", "keyboard", "mouse", "headset", "furniture", "other"]),
    serial: z.string(),
    status: z.enum(["available", "assigned", "maintenance", "retired"]),
    assignedTo: z.string().nullable(),
    purchaseDate: z.string(),
    value: z.number().positive()
  }))
  .handler(async ({ data }) => {
    const caller = requireRole(["admin", "accountant"]);
    const asset = db.createAsset({
      id: `as-${Date.now()}`,
      ...data
    });
    db.logAction(caller.name, "CREATE_ASSET", `Asset ${asset.tag}`);
    return asset;
  });

export const updateAssetFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    id: z.string(),
    updates: z.any()
  }))
  .handler(async ({ data }) => {
    const caller = requireRole(["admin", "accountant"]);
    const updated = db.updateAsset(data.id, data.updates);
    if (!updated) throw new Error("Asset not found");
    db.logAction(caller.name, "UPDATE_ASSET", `Asset ${data.id}`);
    return updated;
  });

// ------------------------------------
// Projects & Tasks
// ------------------------------------
export const getProjectsFn = createServerFn({ method: "GET" })
  .handler(async () => {
    const caller = requireAuth();
    const all = db.getProjects();
    if (caller.role === "employee") {
      return all.filter(p => p.memberIds.includes(caller.employeeId));
    }
    return all;
  });

export const getTasksFn = createServerFn({ method: "GET" })
  .handler(async () => {
    const caller = requireAuth();
    const all = db.getTasks();
    if (caller.role === "employee") {
      return all.filter(t => t.assigneeId === caller.employeeId);
    }
    return all;
  });

// ------------------------------------
// Audit logs & Notifications
// ------------------------------------
export const getAuditLogsFn = createServerFn({ method: "GET" })
  .handler(async () => {
    requireRole(["admin", "accountant"]);
    return db.getAuditLogs();
  });

export const getNotificationsFn = createServerFn({ method: "GET" })
  .handler(async () => {
    requireAuth();
    return db.getNotifications();
  });

export const markNotificationReadFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    requireAuth();
    db.markNotificationRead(data.id);
    return { success: true };
  });
