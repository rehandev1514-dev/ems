// Mock data for VertexEMS — frontend-only seed
export type EmploymentStatus = "active" | "on_leave" | "probation" | "terminated" | "pending";
export type Role = "admin" | "employee" | "manager" | "supervisor" | "accountant";

export interface Department {
  id: string;
  name: string;
  code: string;
  managerId: string | null;
  headcount: number;
  createdAt: string;
}

export interface Employee {
  id: string;
  employeeCode: string;
  fullName: string;
  email: string;
  phone: string;
  cnic: string;
  address: string;
  gender: "male" | "female" | "other";
  dob: string;
  departmentId: string;
  designation: string;
  joiningDate: string;
  status: EmploymentStatus;
  salary: number;
  avatar?: string;
  role: Role;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: "present" | "absent" | "leave" | "late" | "half_day";
  hours: number;
}

export type LeaveType = "annual" | "sick" | "casual" | "emergency";
export interface LeaveRequest {
  id: string;
  employeeId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  appliedAt: string;
}

export type ProjectStatus = "planning" | "active" | "on_hold" | "completed" | "cancelled";
export interface Project {
  id: string;
  name: string;
  client: string;
  status: ProjectStatus;
  progress: number;
  startDate: string;
  deadline: string;
  budget: number;
  memberIds: string[];
}

export type TaskPriority = "low" | "medium" | "high" | "critical";
export interface Task {
  id: string;
  title: string;
  projectId: string;
  assigneeId: string;
  priority: TaskPriority;
  status: "todo" | "in_progress" | "review" | "done";
  deadline: string;
  createdAt: string;
}

export interface Asset {
  id: string;
  tag: string;
  name: string;
  category: "laptop" | "monitor" | "keyboard" | "mouse" | "headset" | "furniture" | "other";
  serial: string;
  status: "available" | "assigned" | "maintenance" | "retired";
  assignedTo: string | null;
  purchaseDate: string;
  value: number;
}

export interface DocumentItem {
  id: string;
  name: string;
  type: "contract" | "certificate" | "id" | "offer_letter" | "other";
  employeeId: string;
  uploadedAt: string;
  sizeKb: number;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  kind: "leave" | "task" | "attendance" | "project" | "system";
  unread: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actor: string;
  action: string;
  target: string;
  timestamp: string;
  ip: string;
}

const today = new Date();
const iso = (d: Date) => d.toISOString().slice(0, 10);
const daysAgo = (n: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return d;
};

export const departments: Department[] = [
  {
    id: "d1",
    name: "Engineering",
    code: "ENG",
    managerId: "e2",
    headcount: 14,
    createdAt: iso(daysAgo(800)),
  },
  {
    id: "d2",
    name: "Design",
    code: "DSN",
    managerId: "e5",
    headcount: 6,
    createdAt: iso(daysAgo(720)),
  },
  {
    id: "d3",
    name: "Human Resources",
    code: "HR",
    managerId: "e3",
    headcount: 4,
    createdAt: iso(daysAgo(900)),
  },
  {
    id: "d4",
    name: "Sales & Marketing",
    code: "SAM",
    managerId: "e7",
    headcount: 9,
    createdAt: iso(daysAgo(610)),
  },
  {
    id: "d5",
    name: "Finance",
    code: "FIN",
    managerId: "e9",
    headcount: 5,
    createdAt: iso(daysAgo(700)),
  },
  {
    id: "d6",
    name: "Operations",
    code: "OPS",
    managerId: null,
    headcount: 7,
    createdAt: iso(daysAgo(420)),
  },
];

export const employees: Employee[] = [
  {
    id: "e1",
    employeeCode: "CVS-001",
    fullName: "Ayesha Khan",
    email: "ayesha.khan@codevertex.io",
    phone: "+92 300 1111111",
    cnic: "42101-1111111-1",
    address: "DHA Phase 6, Karachi",
    gender: "female",
    dob: "1994-04-12",
    departmentId: "d1",
    designation: "Senior Frontend Engineer",
    joiningDate: iso(daysAgo(540)),
    status: "active",
    salary: 320000,
    role: "employee",
  },
  {
    id: "e2",
    employeeCode: "CVS-002",
    fullName: "Bilal Ahmed",
    email: "bilal.ahmed@codevertex.io",
    phone: "+92 301 2222222",
    cnic: "42101-2222222-2",
    address: "Bahria Town, Lahore",
    gender: "male",
    dob: "1989-09-03",
    departmentId: "d1",
    designation: "Engineering Manager",
    joiningDate: iso(daysAgo(1100)),
    status: "active",
    salary: 580000,
    role: "manager",
  },
  {
    id: "e3",
    employeeCode: "CVS-003",
    fullName: "Sana Mirza",
    email: "sana.mirza@codevertex.io",
    phone: "+92 302 3333333",
    cnic: "42101-3333333-3",
    address: "F-7, Islamabad",
    gender: "female",
    dob: "1991-12-22",
    departmentId: "d3",
    designation: "People Ops Manager",
    joiningDate: iso(daysAgo(900)),
    status: "active",
    salary: 380000,
    role: "manager",
  },
  {
    id: "e4",
    employeeCode: "CVS-004",
    fullName: "Hamza Tariq",
    email: "hamza.tariq@codevertex.io",
    phone: "+92 303 4444444",
    cnic: "42101-4444444-4",
    address: "Gulberg, Lahore",
    gender: "male",
    dob: "1996-06-18",
    departmentId: "d1",
    designation: "Backend Engineer",
    joiningDate: iso(daysAgo(310)),
    status: "active",
    salary: 280000,
    role: "employee",
  },
  {
    id: "e5",
    employeeCode: "CVS-005",
    fullName: "Mariam Yousuf",
    email: "mariam.yousuf@codevertex.io",
    phone: "+92 304 5555555",
    cnic: "42101-5555555-5",
    address: "Clifton, Karachi",
    gender: "female",
    dob: "1993-02-09",
    departmentId: "d2",
    designation: "Design Lead",
    joiningDate: iso(daysAgo(680)),
    status: "active",
    salary: 360000,
    role: "manager",
  },
  {
    id: "e6",
    employeeCode: "CVS-006",
    fullName: "Usman Riaz",
    email: "usman.riaz@codevertex.io",
    phone: "+92 305 6666666",
    cnic: "42101-6666666-6",
    address: "Model Town, Lahore",
    gender: "male",
    dob: "1995-11-01",
    departmentId: "d2",
    designation: "Product Designer",
    joiningDate: iso(daysAgo(240)),
    status: "probation",
    salary: 240000,
    role: "employee",
  },
  {
    id: "e7",
    employeeCode: "CVS-007",
    fullName: "Zara Sheikh",
    email: "zara.sheikh@codevertex.io",
    phone: "+92 306 7777777",
    cnic: "42101-7777777-7",
    address: "PECHS, Karachi",
    gender: "female",
    dob: "1988-08-14",
    departmentId: "d4",
    designation: "Head of Sales",
    joiningDate: iso(daysAgo(1200)),
    status: "active",
    salary: 520000,
    role: "manager",
  },
  {
    id: "e8",
    employeeCode: "CVS-008",
    fullName: "Faisal Iqbal",
    email: "faisal.iqbal@codevertex.io",
    phone: "+92 307 8888888",
    cnic: "42101-8888888-8",
    address: "Johar Town, Lahore",
    gender: "male",
    dob: "1997-03-27",
    departmentId: "d4",
    designation: "Account Executive",
    joiningDate: iso(daysAgo(180)),
    status: "active",
    salary: 220000,
    role: "employee",
  },
  {
    id: "e9",
    employeeCode: "CVS-009",
    fullName: "Nimra Hassan",
    email: "nimra.hassan@codevertex.io",
    phone: "+92 308 9999999",
    cnic: "42101-9999999-9",
    address: "G-9, Islamabad",
    gender: "female",
    dob: "1990-07-30",
    departmentId: "d5",
    designation: "Finance Manager",
    joiningDate: iso(daysAgo(820)),
    status: "active",
    salary: 460000,
    role: "manager",
  },
  {
    id: "e10",
    employeeCode: "CVS-010",
    fullName: "Omer Sultan",
    email: "omer.sultan@codevertex.io",
    phone: "+92 309 1010101",
    cnic: "42101-1010101-1",
    address: "DHA, Lahore",
    gender: "male",
    dob: "1992-05-05",
    departmentId: "d6",
    designation: "Operations Specialist",
    joiningDate: iso(daysAgo(420)),
    status: "on_leave",
    salary: 260000,
    role: "employee",
  },
  {
    id: "e11",
    employeeCode: "CVS-011",
    fullName: "Rabia Noor",
    email: "rabia.noor@codevertex.io",
    phone: "+92 310 1111121",
    cnic: "42101-1212121-2",
    address: "Gulshan, Karachi",
    gender: "female",
    dob: "1994-10-19",
    departmentId: "d1",
    designation: "QA Engineer",
    joiningDate: iso(daysAgo(150)),
    status: "active",
    salary: 210000,
    role: "employee",
  },
  {
    id: "e12",
    employeeCode: "CVS-012",
    fullName: "Daniyal Saeed",
    email: "daniyal.saeed@codevertex.io",
    phone: "+92 311 1313131",
    cnic: "42101-1313131-3",
    address: "Wapda Town, Lahore",
    gender: "male",
    dob: "1998-01-25",
    departmentId: "d1",
    designation: "Junior Engineer",
    joiningDate: iso(daysAgo(90)),
    status: "active",
    salary: 160000,
    role: "employee",
  },
];

// Generate ~30 days attendance per employee
export const attendance: AttendanceRecord[] = (() => {
  const rows: AttendanceRecord[] = [];
  employees.forEach((e) => {
    for (let i = 0; i < 30; i++) {
      const d = daysAgo(i);
      const day = d.getDay();
      if (day === 0 || day === 6) continue;
      const rand = Math.random();
      let status: AttendanceRecord["status"] = "present";
      let checkIn: string | null = "09:00";
      let checkOut: string | null = "18:00";
      let hours = 9;
      if (rand < 0.04) {
        status = "absent";
        checkIn = null;
        checkOut = null;
        hours = 0;
      } else if (rand < 0.08) {
        status = "leave";
        checkIn = null;
        checkOut = null;
        hours = 0;
      } else if (rand < 0.18) {
        status = "late";
        checkIn = "09:45";
        hours = 8.25;
      } else if (rand < 0.22) {
        status = "half_day";
        checkOut = "13:00";
        hours = 4;
      }
      rows.push({
        id: `a-${e.id}-${i}`,
        employeeId: e.id,
        date: iso(d),
        checkIn,
        checkOut,
        status,
        hours,
      });
    }
  });
  return rows;
})();

export const leaveRequests: LeaveRequest[] = [
  {
    id: "l1",
    employeeId: "e10",
    type: "annual",
    startDate: iso(daysAgo(-2)),
    endDate: iso(daysAgo(-7)),
    days: 5,
    reason: "Family wedding out of country.",
    status: "approved",
    appliedAt: iso(daysAgo(10)),
  },
  {
    id: "l2",
    employeeId: "e4",
    type: "sick",
    startDate: iso(daysAgo(3)),
    endDate: iso(daysAgo(2)),
    days: 2,
    reason: "Flu and fever.",
    status: "approved",
    appliedAt: iso(daysAgo(4)),
  },
  {
    id: "l3",
    employeeId: "e6",
    type: "casual",
    startDate: iso(daysAgo(-5)),
    endDate: iso(daysAgo(-5)),
    days: 1,
    reason: "Personal errand.",
    status: "pending",
    appliedAt: iso(daysAgo(1)),
  },
  {
    id: "l4",
    employeeId: "e8",
    type: "emergency",
    startDate: iso(daysAgo(-1)),
    endDate: iso(daysAgo(-1)),
    days: 1,
    reason: "Family emergency.",
    status: "pending",
    appliedAt: iso(daysAgo(0)),
  },
  {
    id: "l5",
    employeeId: "e11",
    type: "annual",
    startDate: iso(daysAgo(-15)),
    endDate: iso(daysAgo(-18)),
    days: 3,
    reason: "Short vacation.",
    status: "pending",
    appliedAt: iso(daysAgo(2)),
  },
  {
    id: "l6",
    employeeId: "e12",
    type: "sick",
    startDate: iso(daysAgo(8)),
    endDate: iso(daysAgo(8)),
    days: 1,
    reason: "Migraine.",
    status: "rejected",
    appliedAt: iso(daysAgo(9)),
  },
];

export const projects: Project[] = [
  {
    id: "p1",
    name: "Nimbus Banking Portal",
    client: "Meezan Digital",
    status: "active",
    progress: 68,
    startDate: iso(daysAgo(120)),
    deadline: iso(daysAgo(-45)),
    budget: 8500000,
    memberIds: ["e1", "e2", "e4", "e11"],
  },
  {
    id: "p2",
    name: "Helio Retail OS",
    client: "Imtiaz Group",
    status: "active",
    progress: 42,
    startDate: iso(daysAgo(80)),
    deadline: iso(daysAgo(-60)),
    budget: 6200000,
    memberIds: ["e5", "e6", "e12"],
  },
  {
    id: "p3",
    name: "Atlas CRM Migration",
    client: "TPL Insurance",
    status: "planning",
    progress: 8,
    startDate: iso(daysAgo(-7)),
    deadline: iso(daysAgo(-180)),
    budget: 4400000,
    memberIds: ["e2", "e9"],
  },
  {
    id: "p4",
    name: "Quantum Logistics Tracker",
    client: "TCS Express",
    status: "on_hold",
    progress: 30,
    startDate: iso(daysAgo(200)),
    deadline: iso(daysAgo(-30)),
    budget: 5100000,
    memberIds: ["e4", "e10"],
  },
  {
    id: "p5",
    name: "Vertex Design System v2",
    client: "Internal",
    status: "completed",
    progress: 100,
    startDate: iso(daysAgo(380)),
    deadline: iso(daysAgo(20)),
    budget: 1800000,
    memberIds: ["e5", "e6", "e1"],
  },
];

export const tasks: Task[] = [
  {
    id: "t1",
    title: "Build transaction ledger UI",
    projectId: "p1",
    assigneeId: "e1",
    priority: "high",
    status: "in_progress",
    deadline: iso(daysAgo(-5)),
    createdAt: iso(daysAgo(12)),
  },
  {
    id: "t2",
    title: "Implement OAuth flow",
    projectId: "p1",
    assigneeId: "e4",
    priority: "critical",
    status: "review",
    deadline: iso(daysAgo(-2)),
    createdAt: iso(daysAgo(18)),
  },
  {
    id: "t3",
    title: "Regression test suite",
    projectId: "p1",
    assigneeId: "e11",
    priority: "medium",
    status: "todo",
    deadline: iso(daysAgo(-12)),
    createdAt: iso(daysAgo(3)),
  },
  {
    id: "t4",
    title: "POS checkout redesign",
    projectId: "p2",
    assigneeId: "e5",
    priority: "high",
    status: "in_progress",
    deadline: iso(daysAgo(-8)),
    createdAt: iso(daysAgo(9)),
  },
  {
    id: "t5",
    title: "Inventory sync service",
    projectId: "p2",
    assigneeId: "e12",
    priority: "medium",
    status: "todo",
    deadline: iso(daysAgo(-20)),
    createdAt: iso(daysAgo(4)),
  },
  {
    id: "t6",
    title: "Discovery workshop notes",
    projectId: "p3",
    assigneeId: "e2",
    priority: "low",
    status: "done",
    deadline: iso(daysAgo(2)),
    createdAt: iso(daysAgo(6)),
  },
  {
    id: "t7",
    title: "Fleet GPS data model",
    projectId: "p4",
    assigneeId: "e4",
    priority: "high",
    status: "todo",
    deadline: iso(daysAgo(-15)),
    createdAt: iso(daysAgo(8)),
  },
  {
    id: "t8",
    title: "Final QA sign-off",
    projectId: "p5",
    assigneeId: "e11",
    priority: "critical",
    status: "done",
    deadline: iso(daysAgo(25)),
    createdAt: iso(daysAgo(40)),
  },
  {
    id: "t9",
    title: "Onboarding deck refresh",
    projectId: "p5",
    assigneeId: "e6",
    priority: "low",
    status: "review",
    deadline: iso(daysAgo(-3)),
    createdAt: iso(daysAgo(7)),
  },
];

export const assets: Asset[] = [
  {
    id: "as1",
    tag: "CVS-LT-014",
    name: 'MacBook Pro 16" M3 Max',
    category: "laptop",
    serial: "C02XY3JKLM01",
    status: "assigned",
    assignedTo: "e1",
    purchaseDate: iso(daysAgo(420)),
    value: 950000,
  },
  {
    id: "as2",
    tag: "CVS-LT-015",
    name: "Dell XPS 15",
    category: "laptop",
    serial: "DXPS15-9982",
    status: "assigned",
    assignedTo: "e4",
    purchaseDate: iso(daysAgo(280)),
    value: 480000,
  },
  {
    id: "as3",
    tag: "CVS-MN-022",
    name: 'LG UltraFine 27" 4K',
    category: "monitor",
    serial: "LGUF27-1471",
    status: "assigned",
    assignedTo: "e1",
    purchaseDate: iso(daysAgo(380)),
    value: 165000,
  },
  {
    id: "as4",
    tag: "CVS-HS-007",
    name: "Sony WH-1000XM5",
    category: "headset",
    serial: "SNYXM5-0091",
    status: "available",
    assignedTo: null,
    purchaseDate: iso(daysAgo(120)),
    value: 95000,
  },
  {
    id: "as5",
    tag: "CVS-KB-031",
    name: "Keychron K8 Pro",
    category: "keyboard",
    serial: "KCK8P-3310",
    status: "assigned",
    assignedTo: "e5",
    purchaseDate: iso(daysAgo(200)),
    value: 38000,
  },
  {
    id: "as6",
    tag: "CVS-LT-016",
    name: "ThinkPad X1 Carbon",
    category: "laptop",
    serial: "TPX1C-2240",
    status: "maintenance",
    assignedTo: null,
    purchaseDate: iso(daysAgo(620)),
    value: 410000,
  },
  {
    id: "as7",
    tag: "CVS-FN-003",
    name: "Ergonomic Standing Desk",
    category: "furniture",
    serial: "ERG-STD-003",
    status: "assigned",
    assignedTo: "e2",
    purchaseDate: iso(daysAgo(540)),
    value: 120000,
  },
  {
    id: "as8",
    tag: "CVS-MS-018",
    name: "Logitech MX Master 3S",
    category: "mouse",
    serial: "LMX3S-7811",
    status: "available",
    assignedTo: null,
    purchaseDate: iso(daysAgo(60)),
    value: 32000,
  },
];

export const documents: DocumentItem[] = [
  {
    id: "doc1",
    name: "Employment Contract — Ayesha Khan.pdf",
    type: "contract",
    employeeId: "e1",
    uploadedAt: iso(daysAgo(540)),
    sizeKb: 412,
  },
  {
    id: "doc2",
    name: "AWS Solutions Architect Cert.pdf",
    type: "certificate",
    employeeId: "e4",
    uploadedAt: iso(daysAgo(60)),
    sizeKb: 880,
  },
  {
    id: "doc3",
    name: "Offer Letter — Daniyal Saeed.pdf",
    type: "offer_letter",
    employeeId: "e12",
    uploadedAt: iso(daysAgo(95)),
    sizeKb: 220,
  },
  {
    id: "doc4",
    name: "CNIC Copy — Mariam Yousuf.jpg",
    type: "id",
    employeeId: "e5",
    uploadedAt: iso(daysAgo(680)),
    sizeKb: 1450,
  },
  {
    id: "doc5",
    name: "NDA — Nimbus Project.pdf",
    type: "contract",
    employeeId: "e2",
    uploadedAt: iso(daysAgo(130)),
    sizeKb: 318,
  },
];

export const notifications: Notification[] = [
  {
    id: "n1",
    title: "Leave request pending",
    body: "Usman Riaz requested 1 day of casual leave.",
    kind: "leave",
    unread: true,
    createdAt: iso(daysAgo(0)),
  },
  {
    id: "n2",
    title: "Task overdue",
    body: "‘Fleet GPS data model’ is past its deadline.",
    kind: "task",
    unread: true,
    createdAt: iso(daysAgo(0)),
  },
  {
    id: "n3",
    title: "Attendance anomaly",
    body: "3 late check-ins this week in Engineering.",
    kind: "attendance",
    unread: true,
    createdAt: iso(daysAgo(1)),
  },
  {
    id: "n4",
    title: "Project milestone reached",
    body: "Vertex Design System v2 marked completed.",
    kind: "project",
    unread: false,
    createdAt: iso(daysAgo(3)),
  },
  {
    id: "n5",
    title: "New employee onboarded",
    body: "Daniyal Saeed joined Engineering.",
    kind: "system",
    unread: false,
    createdAt: iso(daysAgo(90)),
  },
];

export const auditLogs: AuditLog[] = [
  {
    id: "au1",
    actor: "Sana Mirza",
    action: "UPDATE",
    target: "Employee e6 — status changed to probation",
    timestamp: new Date(daysAgo(1)).toISOString(),
    ip: "203.99.12.41",
  },
  {
    id: "au2",
    actor: "Bilal Ahmed",
    action: "CREATE",
    target: "Project p3 — Atlas CRM Migration",
    timestamp: new Date(daysAgo(7)).toISOString(),
    ip: "39.45.198.10",
  },
  {
    id: "au3",
    actor: "Admin",
    action: "LOGIN",
    target: "Admin console",
    timestamp: new Date(daysAgo(0)).toISOString(),
    ip: "10.0.0.4",
  },
  {
    id: "au4",
    actor: "Nimra Hassan",
    action: "DELETE",
    target: "Asset as9 — retired projector",
    timestamp: new Date(daysAgo(2)).toISOString(),
    ip: "182.180.4.22",
  },
  {
    id: "au5",
    actor: "Zara Sheikh",
    action: "UPDATE",
    target: "Leave l4 — approved",
    timestamp: new Date(daysAgo(0)).toISOString(),
    ip: "39.45.10.7",
  },
  {
    id: "au6",
    actor: "System",
    action: "ROLE_CHANGE",
    target: "User e3 granted hr_lead permissions",
    timestamp: new Date(daysAgo(30)).toISOString(),
    ip: "—",
  },
];

export const departmentById = (id: string) => departments.find((d) => d.id === id);
export const employeeById = (id: string) => employees.find((e) => e.id === id);
export const projectById = (id: string) => projects.find((p) => p.id === id);
