import { getDb, saveDb, initDb } from "./data";
import { getSession } from "./auth";
import type {
  Employee,
  AttendanceRecord,
  LeaveRequest,
  DocumentItem,
  Asset,
  Notification as NotificationType,
  AuditLog,
} from "../mock-data";

function requireAuth() {
  const session = getSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}

function requireRole(roles: string[]) {
  const session = requireAuth();
  if (!roles.includes(session.role)) {
    throw new Error("Forbidden");
  }
  return session;
}

function logAction(actor: string, action: string, target: string) {
  const db = getDb();
  db.auditLogs.unshift({
    id: `au-${Date.now()}`,
    actor,
    action,
    target,
    timestamp: new Date().toISOString(),
    ip: "—",
  });
  saveDb(db);
}

// ------------------------------------
// Employee functions
// ------------------------------------
export async function getEmployeesFn() {
  const caller = requireAuth();
  initDb();
  const db = getDb();
  return db.employees;
}

export async function getEmployeeByIdFn({ data }: { data: { id: string } }) {
  const caller = requireAuth();
  initDb();
  const db = getDb();
  if (caller.role !== "admin" && caller.role !== "manager" && caller.id !== data.id) {
    throw new Error("Forbidden: You can only view your own profile");
  }
  const emp = db.employees.find((e) => e.id === data.id);
  if (!emp) throw new Error("Employee not found");
  return emp;
}

export async function createEmployeeFn({ data }: { data: any }) {
  const caller = requireRole(["admin", "manager"]);
  initDb();
  const db = getDb();
  const existing = db.employees.find((e) => e.email.toLowerCase() === data.email.toLowerCase());
  if (existing) throw new Error("Email already registered");

  const id = `e-${Date.now()}`;
  const employeeCode = `CVS-${Math.floor(100 + Math.random() * 900)}`;
  const emp: Employee = { id, employeeCode, ...data };
  db.employees.push(emp);

  // Default password demo1234
  let hash = 0;
  const pwd = "demo1234";
  for (let i = 0; i < pwd.length; i++) {
    hash = (hash << 5) - hash + pwd.charCodeAt(i);
    hash |= 0;
  }
  db.credentials.push({ email: data.email, passwordHash: `demo_${hash}` });

  saveDb(db);
  logAction(caller.name, "CREATE", `Employee ${emp.id} — ${emp.fullName}`);
  return emp;
}

export async function updateEmployeeFn({ data }: { data: { id: string; updates: any } }) {
  const caller = requireAuth();
  initDb();
  const db = getDb();

  if (caller.role !== "admin" && caller.role !== "manager" && caller.id !== data.id) {
    throw new Error("Forbidden: Insufficient privileges to update employee details");
  }

  const updates = { ...data.updates };
  if (caller.role !== "admin" && caller.role !== "manager") {
    delete updates.salary;
    delete updates.role;
    delete updates.status;
    delete updates.departmentId;
    delete updates.joiningDate;
    delete updates.employeeCode;
  }

  const idx = db.employees.findIndex((e) => e.id === data.id);
  if (idx === -1) throw new Error("Employee not found");

  db.employees[idx] = { ...db.employees[idx], ...updates };
  saveDb(db);
  logAction(caller.name, "UPDATE", `Employee ${data.id} details`);
  return db.employees[idx];
}

export async function deleteEmployeeFn({ data }: { data: { id: string } }) {
  const caller = requireRole(["admin"]);
  initDb();
  const db = getDb();

  const idx = db.employees.findIndex((e) => e.id === data.id);
  if (idx === -1) throw new Error("Employee not found");

  db.employees.splice(idx, 1);
  saveDb(db);
  logAction(caller.name, "DELETE", `Employee ${data.id}`);
  return { success: true };
}

// ------------------------------------
// Departments
// ------------------------------------
export async function getDepartmentsFn() {
  requireAuth();
  initDb();
  return getDb().departments;
}

// ------------------------------------
// Attendance functions
// ------------------------------------
export async function getAttendanceFn() {
  const caller = requireAuth();
  initDb();
  const all = getDb().attendance;
  if (caller.role === "employee") {
    return all.filter((r) => r.employeeId === caller.employeeId);
  }
  return all;
}

export async function checkInFn() {
  const caller = requireAuth();
  initDb();
  const db = getDb();
  const todayStr = new Date().toISOString().slice(0, 10);

  const existing = db.attendance.find(
    (r) => r.employeeId === caller.employeeId && r.date === todayStr,
  );
  if (existing) {
    throw new Error("Already checked in today");
  }

  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  });

  const [hours, minutes] = timeStr.split(":").map(Number);
  const totalMins = hours * 60 + minutes;
  const limitMins = 9 * 60 + 15;
  const status = totalMins > limitMins ? "late" : "present";

  const rec: AttendanceRecord = {
    id: `a-${caller.employeeId}-${todayStr}`,
    employeeId: caller.employeeId,
    date: todayStr,
    checkIn: timeStr,
    checkOut: null,
    status,
    hours: 0,
  };

  db.attendance.push(rec);
  saveDb(db);
  logAction(caller.name, "ATTENDANCE_CHECK_IN", `Check-in at ${timeStr}`);
  return rec;
}

export async function checkOutFn() {
  const caller = requireAuth();
  initDb();
  const db = getDb();
  const todayStr = new Date().toISOString().slice(0, 10);

  const existingIdx = db.attendance.findIndex(
    (r) => r.employeeId === caller.employeeId && r.date === todayStr,
  );
  if (existingIdx === -1 || !db.attendance[existingIdx].checkIn) {
    throw new Error("Must check in before checking out");
  }
  if (db.attendance[existingIdx].checkOut) {
    throw new Error("Already checked out today");
  }

  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  });

  const existing = db.attendance[existingIdx];
  const [inH, inM] = (existing.checkIn || "00:00").split(":").map(Number);
  const [outH, outM] = timeStr.split(":").map(Number);
  const workedMins = outH * 60 + outM - (inH * 60 + inM);
  const hours = Math.round((workedMins / 60) * 100) / 100;

  db.attendance[existingIdx] = { ...existing, checkOut: timeStr, hours: Math.max(0, hours) };
  saveDb(db);
  logAction(caller.name, "ATTENDANCE_CHECK_OUT", `Check-out at ${timeStr}`);
  return db.attendance[existingIdx];
}

// ------------------------------------
// Leave functions
// ------------------------------------
export async function getLeavesFn() {
  const caller = requireAuth();
  initDb();
  const all = getDb().leaveRequests;
  if (caller.role === "employee") {
    return all.filter((l) => l.employeeId === caller.employeeId);
  }
  return all;
}

export async function applyLeaveFn({ data }: { data: any }) {
  const caller = requireAuth();
  initDb();
  const db = getDb();

  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  if (end < start) throw new Error("End date cannot be earlier than start date");
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  const newRequest: LeaveRequest = {
    id: `l-${Date.now()}`,
    employeeId: caller.employeeId,
    type: data.type,
    startDate: data.startDate,
    endDate: data.endDate,
    days,
    reason: data.reason,
    status: "pending",
    appliedAt: new Date().toISOString().slice(0, 10),
  };

  db.leaveRequests.push(newRequest);

  db.notifications.unshift({
    id: `n-${Date.now()}`,
    title: "New Leave Request",
    body: `${caller.name} requested ${days} day(s) of ${data.type} leave.`,
    kind: "leave",
    unread: true,
    createdAt: new Date().toISOString(),
  });

  saveDb(db);
  logAction(caller.name, "APPLY_LEAVE", `Applied for ${days} days`);
  return newRequest;
}

export async function updateLeaveStatusFn({
  data,
}: {
  data: { id: string; status: "approved" | "rejected" };
}) {
  const caller = requireRole(["admin", "manager"]);
  initDb();
  const db = getDb();

  const idx = db.leaveRequests.findIndex((l) => l.id === data.id);
  if (idx === -1) throw new Error("Leave request not found");

  const request = db.leaveRequests[idx];
  db.leaveRequests[idx].status = data.status;

  db.notifications.unshift({
    id: `n-${Date.now()}`,
    title: `Leave Request ${data.status.toUpperCase()}`,
    body: `Your request for ${request.type} leave starting on ${request.startDate} has been ${data.status}.`,
    kind: "leave",
    unread: true,
    createdAt: new Date().toISOString(),
  });

  saveDb(db);
  logAction(caller.name, `LEAVE_${data.status.toUpperCase()}`, `Leave request ${data.id}`);
  return db.leaveRequests[idx];
}

// ------------------------------------
// Document functions
// ------------------------------------
export async function getDocumentsFn() {
  const caller = requireAuth();
  initDb();
  const all = getDb().documents;
  if (caller.role === "employee") {
    return all.filter((d) => d.employeeId === caller.employeeId);
  }
  return all;
}

export async function uploadDocumentFn({ data }: { data: any }) {
  const caller = requireAuth();
  initDb();
  const db = getDb();

  if (caller.role !== "admin" && caller.role !== "manager" && caller.id !== data.employeeId) {
    throw new Error("Forbidden: Insufficient privileges to upload documents for this employee");
  }

  const doc: DocumentItem = {
    id: `doc-${Date.now()}`,
    name: data.name,
    type: data.type,
    employeeId: data.employeeId,
    uploadedAt: new Date().toISOString().slice(0, 10),
    sizeKb: Math.round((data.fileBase64.length * 0.75) / 1024),
  };

  db.documents.push(doc);
  saveDb(db);
  logAction(caller.name, "UPLOAD_DOCUMENT", `Document ${doc.name} uploaded`);
  return doc;
}

export async function deleteDocumentFn({ data }: { data: { id: string } }) {
  const caller = requireAuth();
  initDb();
  const db = getDb();

  const idx = db.documents.findIndex((d) => d.id === data.id);
  if (idx === -1) throw new Error("Document not found");

  const doc = db.documents[idx];
  if (caller.role !== "admin" && caller.role !== "manager" && caller.id !== doc.employeeId) {
    throw new Error("Forbidden: Insufficient privileges");
  }

  db.documents.splice(idx, 1);
  saveDb(db);
  logAction(caller.name, "DELETE_DOCUMENT", `Document ${doc.name} deleted`);
  return { success: true };
}

// ------------------------------------
// Assets
// ------------------------------------
export async function getAssetsFn() {
  const caller = requireAuth();
  initDb();
  const all = getDb().assets;
  if (caller.role === "employee") {
    return all.filter((a) => a.assignedTo === caller.employeeId);
  }
  return all;
}

export async function createAssetFn({ data }: { data: any }) {
  const caller = requireRole(["admin", "accountant"]);
  initDb();
  const db = getDb();
  const asset: Asset = { id: `as-${Date.now()}`, ...data };
  db.assets.push(asset);
  saveDb(db);
  logAction(caller.name, "CREATE_ASSET", `Asset ${asset.tag}`);
  return asset;
}

export async function updateAssetFn({ data }: { data: { id: string; updates: any } }) {
  const caller = requireRole(["admin", "accountant"]);
  initDb();
  const db = getDb();
  const idx = db.assets.findIndex((a) => a.id === data.id);
  if (idx === -1) throw new Error("Asset not found");

  db.assets[idx] = { ...db.assets[idx], ...data.updates };
  saveDb(db);
  logAction(caller.name, "UPDATE_ASSET", `Asset ${data.id}`);
  return db.assets[idx];
}

// ------------------------------------
// Projects & Tasks
// ------------------------------------
export async function getProjectsFn() {
  const caller = requireAuth();
  initDb();
  const all = getDb().projects;
  if (caller.role === "employee") {
    return all.filter((p) => p.memberIds.includes(caller.employeeId));
  }
  return all;
}

export async function getTasksFn() {
  const caller = requireAuth();
  initDb();
  const all = getDb().tasks;
  if (caller.role === "employee") {
    return all.filter((t) => t.assigneeId === caller.employeeId);
  }
  return all;
}

// ------------------------------------
// Audit logs & Notifications
// ------------------------------------
export async function getAuditLogsFn() {
  requireRole(["admin", "accountant"]);
  initDb();
  return getDb().auditLogs;
}

export async function getNotificationsFn() {
  requireAuth();
  initDb();
  return getDb().notifications;
}

export async function markNotificationReadFn({ data }: { data: { id: string } }) {
  requireAuth();
  initDb();
  const db = getDb();
  const n = db.notifications.find((x) => x.id === data.id);
  if (n) {
    n.unread = false;
    saveDb(db);
  }
  return { success: true };
}
