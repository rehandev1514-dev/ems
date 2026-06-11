import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { 
  employees as defaultEmployees, 
  departments as defaultDepartments,
  attendance as defaultAttendance,
  leaveRequests as defaultLeaves,
  projects as defaultProjects,
  tasks as defaultTasks,
  assets as defaultAssets,
  documents as defaultDocuments,
  notifications as defaultNotifications,
  auditLogs as defaultAuditLogs,
  type Employee,
  type Department,
  type AttendanceRecord,
  type LeaveRequest,
  type Project,
  type Task,
  type Asset,
  type DocumentItem,
  type Notification as NotificationType,
  type AuditLog
} from "./mock-data";

// Simple PBKDF2 password hashing
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const checkHash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return hash === checkHash;
}

const DB_FILE = path.join(process.cwd(), "src/lib/db.json");

interface UserCredentials {
  email: string;
  passwordHash: string;
}

interface DatabaseSchema {
  employees: Employee[];
  departments: Department[];
  attendance: AttendanceRecord[];
  leaveRequests: LeaveRequest[];
  projects: Project[];
  tasks: Task[];
  assets: Asset[];
  documents: DocumentItem[];
  notifications: NotificationType[];
  auditLogs: AuditLog[];
  credentials: UserCredentials[];
}

class ServerDatabase {
  private data!: DatabaseSchema;

  constructor() {
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        this.data = JSON.parse(raw);
      } else {
        this.initDefault();
      }
    } catch (e) {
      console.error("Failed to load DB file, initializing defaults:", e);
      this.initDefault();
    }
  }

  private initDefault() {
    // Seed default credentials: all default accounts have password 'demo1234'
    const defaultHash = hashPassword("demo1234");
    const credentials: UserCredentials[] = [
      { email: "admin@codevertex.io", passwordHash: defaultHash },
      { email: "ayesha.khan@codevertex.io", passwordHash: defaultHash }
    ];

    // Seed credentials for all other default employees too
    defaultEmployees.forEach(emp => {
      if (emp.email !== "admin@codevertex.io" && emp.email !== "ayesha.khan@codevertex.io") {
        credentials.push({ email: emp.email, passwordHash: defaultHash });
      }
    });

    // We can also create a default admin employee record if it doesn't exist
    const adminEmployee: Employee = {
      id: "e2", // Matching the Admin user employeeId in auth-store
      employeeCode: "CVS-000",
      fullName: "Admin Vertex",
      email: "admin@codevertex.io",
      phone: "+92 300 0000000",
      cnic: "42101-0000000-0",
      address: "Main Office, Karachi",
      gender: "male",
      dob: "1985-01-01",
      departmentId: "d3",
      designation: "System Administrator",
      joiningDate: "2020-01-01",
      status: "active",
      salary: 1000000,
      role: "admin"
    };

    const employeesList = [...defaultEmployees];
    if (!employeesList.find(e => e.email === "admin@codevertex.io")) {
      // replace or insert admin
      const index = employeesList.findIndex(e => e.id === "e2");
      if (index !== -1) {
        employeesList[index] = adminEmployee;
      } else {
        employeesList.push(adminEmployee);
      }
    }

    this.data = {
      employees: employeesList,
      departments: defaultDepartments,
      attendance: defaultAttendance,
      leaveRequests: defaultLeaves,
      projects: defaultProjects,
      tasks: defaultTasks,
      assets: defaultAssets,
      documents: defaultDocuments,
      notifications: defaultNotifications,
      auditLogs: defaultAuditLogs,
      credentials
    };
    this.save();
  }

  private save() {
    try {
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (e) {
      console.error("Failed to save DB file:", e);
    }
  }

  // Operations
  getEmployees() { return this.data.employees; }
  getEmployee(id: string) { return this.data.employees.find(e => e.id === id); }
  getEmployeeByEmail(email: string) { return this.data.employees.find(e => e.email.toLowerCase() === email.toLowerCase()); }
  
  createEmployee(employee: Employee, passwordHash: string) {
    this.data.employees.push(employee);
    this.data.credentials.push({ email: employee.email, passwordHash });
    this.save();
    this.logAction("System", "CREATE", `Employee ${employee.id} — ${employee.fullName}`);
    return employee;
  }

  updateEmployee(id: string, updates: Partial<Employee>) {
    const idx = this.data.employees.findIndex(e => e.id === id);
    if (idx === -1) return null;
    const oldEmail = this.data.employees[idx].email;
    const updated = { ...this.data.employees[idx], ...updates };
    this.data.employees[idx] = updated;

    // If email changed, update credentials record too
    if (updates.email && updates.email !== oldEmail) {
      const cred = this.data.credentials.find(c => c.email.toLowerCase() === oldEmail.toLowerCase());
      if (cred) cred.email = updates.email;
    }
    
    this.save();
    this.logAction("System", "UPDATE", `Employee ${id} — ${updated.fullName}`);
    return updated;
  }

  deleteEmployee(id: string) {
    const idx = this.data.employees.findIndex(e => e.id === id);
    if (idx === -1) return false;
    const email = this.data.employees[idx].email;
    this.data.employees.splice(idx, 1);
    this.data.credentials = this.data.credentials.filter(c => c.email.toLowerCase() !== email.toLowerCase());
    this.save();
    this.logAction("System", "DELETE", `Employee ${id}`);
    return true;
  }

  getCredentials(email: string) {
    return this.data.credentials.find(c => c.email.toLowerCase() === email.toLowerCase());
  }

  // Attendance
  getAttendance() { return this.data.attendance; }
  createAttendance(rec: AttendanceRecord) {
    this.data.attendance.push(rec);
    this.save();
    return rec;
  }
  updateAttendance(id: string, updates: Partial<AttendanceRecord>) {
    const idx = this.data.attendance.findIndex(a => a.id === id);
    if (idx === -1) return null;
    const updated = { ...this.data.attendance[idx], ...updates };
    this.data.attendance[idx] = updated;
    this.save();
    return updated;
  }

  // Leaves
  getLeaves() { return this.data.leaveRequests; }
  createLeave(req: LeaveRequest) {
    this.data.leaveRequests.push(req);
    this.save();
    return req;
  }
  updateLeave(id: string, updates: Partial<LeaveRequest>) {
    const idx = this.data.leaveRequests.findIndex(l => l.id === id);
    if (idx === -1) return null;
    const updated = { ...this.data.leaveRequests[idx], ...updates };
    this.data.leaveRequests[idx] = updated;
    this.save();
    return updated;
  }

  // Projects & Tasks
  getProjects() { return this.data.projects; }
  createProject(p: Project) {
    this.data.projects.push(p);
    this.save();
    return p;
  }
  updateProject(id: string, updates: Partial<Project>) {
    const idx = this.data.projects.findIndex(p => p.id === id);
    if (idx === -1) return null;
    const updated = { ...this.data.projects[idx], ...updates };
    this.data.projects[idx] = updated;
    this.save();
    return updated;
  }

  getTasks() { return this.data.tasks; }
  createTask(t: Task) {
    this.data.tasks.push(t);
    this.save();
    return t;
  }
  updateTask(id: string, updates: Partial<Task>) {
    const idx = this.data.tasks.findIndex(t => t.id === id);
    if (idx === -1) return null;
    const updated = { ...this.data.tasks[idx], ...updates };
    this.data.tasks[idx] = updated;
    this.save();
    return updated;
  }

  // Assets
  getAssets() { return this.data.assets; }
  createAsset(a: Asset) {
    this.data.assets.push(a);
    this.save();
    return a;
  }
  updateAsset(id: string, updates: Partial<Asset>) {
    const idx = this.data.assets.findIndex(a => a.id === id);
    if (idx === -1) return null;
    const updated = { ...this.data.assets[idx], ...updates };
    this.data.assets[idx] = updated;
    this.save();
    return updated;
  }

  // Documents
  getDocuments() { return this.data.documents; }
  createDocument(doc: DocumentItem) {
    this.data.documents.push(doc);
    this.save();
    return doc;
  }
  deleteDocument(id: string) {
    this.data.documents = this.data.documents.filter(d => d.id !== id);
    this.save();
    return true;
  }

  // Notifications
  getNotifications() { return this.data.notifications; }
  createNotification(notif: NotificationType) {
    this.data.notifications.unshift(notif);
    this.save();
    return notif;
  }
  markNotificationRead(id: string) {
    const notif = this.data.notifications.find(n => n.id === id);
    if (notif) {
      notif.unread = false;
      this.save();
    }
  }

  // Audit Logs
  getAuditLogs() { return this.data.auditLogs; }
  logAction(actor: string, action: string, target: string, ip: string = "—") {
    const newLog: AuditLog = {
      id: `au-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      actor,
      action,
      target,
      timestamp: new Date().toISOString(),
      ip
    };
    this.data.auditLogs.unshift(newLog);
    this.save();
  }
}

export const db = new ServerDatabase();
