import { PrismaClient, type Prisma } from "@prisma/client";
import { config } from "../src/config.js";
import { hashPassword } from "../src/utils/crypto.js";

const prisma = new PrismaClient();

const date = (value: string) => new Date(`${value}T00:00:00.000Z`);

const departments = [
  { id: "d1", name: "Engineering", code: "ENG", managerId: "e3" },
  { id: "d2", name: "Human Resources", code: "HR", managerId: "e4" },
  { id: "d3", name: "Finance", code: "FIN", managerId: "e5" },
  { id: "d4", name: "Design", code: "DSN", managerId: "e6" },
  { id: "d5", name: "Quality Assurance", code: "QA", managerId: "e8" },
  { id: "d6", name: "Operations", code: "OPS", managerId: "e10" },
];

const employees: (Prisma.EmployeeCreateManyInput & { id: string })[] = [
  {
    id: "e2",
    employeeCode: "CVS-000",
    fullName: "Admin Vertex",
    email: "admin@codevertex.io",
    phone: "+92 300 0000000",
    cnic: "00000-0000000-0",
    address: "CodeVertex Head Office, Karachi",
    gender: "other",
    dob: date("1990-01-01"),
    departmentId: "d6",
    designation: "System Administrator",
    joiningDate: date("2022-01-01"),
    status: "active",
    salary: "1000000",
    role: "admin",
  },
  {
    id: "e1",
    employeeCode: "CVS-101",
    fullName: "Ayesha Khan",
    email: "ayesha.khan@codevertex.io",
    phone: "+92 300 1111111",
    cnic: "42101-1111111-1",
    address: "DHA Phase 5, Karachi",
    gender: "female",
    dob: date("1994-03-12"),
    departmentId: "d1",
    designation: "Frontend Engineer",
    joiningDate: date("2023-02-01"),
    status: "active",
    salary: "180000",
    role: "employee",
  },
  {
    id: "e3",
    employeeCode: "CVS-103",
    fullName: "Bilal Ahmed",
    email: "bilal.ahmed@codevertex.io",
    phone: "+92 300 2222222",
    cnic: "42101-2222222-2",
    address: "Gulshan-e-Iqbal, Karachi",
    gender: "male",
    dob: date("1988-06-23"),
    departmentId: "d1",
    designation: "Engineering Manager",
    joiningDate: date("2021-09-15"),
    status: "active",
    salary: "360000",
    role: "manager",
  },
  {
    id: "e4",
    employeeCode: "CVS-104",
    fullName: "Sara Malik",
    email: "sara.malik@codevertex.io",
    phone: "+92 300 3333333",
    cnic: "42101-3333333-3",
    address: "PECHS, Karachi",
    gender: "female",
    dob: date("1991-11-02"),
    departmentId: "d2",
    designation: "HR Manager",
    joiningDate: date("2022-04-11"),
    status: "active",
    salary: "240000",
    role: "manager",
  },
  {
    id: "e5",
    employeeCode: "CVS-105",
    fullName: "Usman Tariq",
    email: "usman.tariq@codevertex.io",
    phone: "+92 300 4444444",
    cnic: "42101-4444444-4",
    address: "North Nazimabad, Karachi",
    gender: "male",
    dob: date("1989-08-18"),
    departmentId: "d3",
    designation: "Finance Lead",
    joiningDate: date("2022-08-01"),
    status: "active",
    salary: "260000",
    role: "accountant",
  },
  {
    id: "e6",
    employeeCode: "CVS-106",
    fullName: "Zainab Raza",
    email: "zainab.raza@codevertex.io",
    phone: "+92 300 5555555",
    cnic: "42101-5555555-5",
    address: "Clifton, Karachi",
    gender: "female",
    dob: date("1995-01-30"),
    departmentId: "d4",
    designation: "UI/UX Lead",
    joiningDate: date("2023-01-10"),
    status: "active",
    salary: "210000",
    role: "supervisor",
  },
  {
    id: "e7",
    employeeCode: "CVS-107",
    fullName: "Hassan Ali",
    email: "hassan.ali@codevertex.io",
    phone: "+92 300 6666666",
    cnic: "42101-6666666-6",
    address: "Federal B Area, Karachi",
    gender: "male",
    dob: date("1996-04-14"),
    departmentId: "d1",
    designation: "Backend Engineer",
    joiningDate: date("2023-05-17"),
    status: "probation",
    salary: "170000",
    role: "employee",
  },
  {
    id: "e8",
    employeeCode: "CVS-108",
    fullName: "Mehwish Noor",
    email: "mehwish.noor@codevertex.io",
    phone: "+92 300 7777777",
    cnic: "42101-7777777-7",
    address: "Bahadurabad, Karachi",
    gender: "female",
    dob: date("1993-10-05"),
    departmentId: "d5",
    designation: "QA Lead",
    joiningDate: date("2022-10-22"),
    status: "active",
    salary: "190000",
    role: "supervisor",
  },
  {
    id: "e9",
    employeeCode: "CVS-109",
    fullName: "Danish Iqbal",
    email: "danish.iqbal@codevertex.io",
    phone: "+92 300 8888888",
    cnic: "42101-8888888-8",
    address: "Malir Cantt, Karachi",
    gender: "male",
    dob: date("1997-07-21"),
    departmentId: "d5",
    designation: "QA Engineer",
    joiningDate: date("2023-07-03"),
    status: "active",
    salary: "135000",
    role: "employee",
  },
  {
    id: "e10",
    employeeCode: "CVS-110",
    fullName: "Nimra Shah",
    email: "nimra.shah@codevertex.io",
    phone: "+92 300 9999999",
    cnic: "42101-9999999-9",
    address: "Gulistan-e-Jauhar, Karachi",
    gender: "female",
    dob: date("1992-02-25"),
    departmentId: "d6",
    designation: "Operations Manager",
    joiningDate: date("2021-12-01"),
    status: "active",
    salary: "230000",
    role: "manager",
  },
  {
    id: "e11",
    employeeCode: "CVS-111",
    fullName: "Hamza Farooq",
    email: "hamza.farooq@codevertex.io",
    phone: "+92 301 1111111",
    cnic: "42101-1010101-0",
    address: "Model Colony, Karachi",
    gender: "male",
    dob: date("1998-09-09"),
    departmentId: "d1",
    designation: "Full Stack Developer",
    joiningDate: date("2024-01-08"),
    status: "active",
    salary: "155000",
    role: "employee",
  },
  {
    id: "e12",
    employeeCode: "CVS-112",
    fullName: "Iqra Saeed",
    email: "iqra.saeed@codevertex.io",
    phone: "+92 301 2222222",
    cnic: "42101-2020202-0",
    address: "Korangi, Karachi",
    gender: "female",
    dob: date("1999-12-19"),
    departmentId: "d2",
    designation: "HR Executive",
    joiningDate: date("2024-03-01"),
    status: "pending",
    salary: "110000",
    role: "employee",
  },
];

async function main() {
  const passwordHash = await hashPassword(config.DEFAULT_EMPLOYEE_PASSWORD);

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.companySettings.upsert({
      where: { id: "company" },
      update: {},
      create: { id: "company" },
    });

    for (const department of departments) {
      await tx.department.upsert({
        where: { id: department.id },
        update: { name: department.name, code: department.code },
        create: { id: department.id, name: department.name, code: department.code },
      });
    }

    for (const employee of employees) {
      await tx.employee.upsert({
        where: { id: employee.id },
        update: employee,
        create: employee,
      });
      await tx.userCredential.upsert({
        where: { employeeId: employee.id },
        update: { passwordHash, emailVerifiedAt: new Date(), disabledAt: null },
        create: { employeeId: employee.id, passwordHash, emailVerifiedAt: new Date() },
      });
      await tx.notificationPreference.upsert({
        where: { employeeId: employee.id },
        update: {},
        create: { employeeId: employee.id },
      });
    }

    for (const department of departments) {
      await tx.department.update({
        where: { id: department.id },
        data: { managerId: department.managerId },
      });
    }

    const currentYear = new Date().getFullYear();
    const leaveTypes = ["annual", "sick", "casual", "emergency"] as const;
    for (const employee of employees) {
      for (const type of leaveTypes) {
        await tx.leaveBalance.upsert({
          where: { employeeId_type_year: { employeeId: employee.id, type, year: currentYear } },
          update: {},
          create: {
            employeeId: employee.id,
            type,
            year: currentYear,
            entitlement: type === "annual" ? 18 : type === "sick" ? 10 : type === "casual" ? 8 : 4,
          },
        });
      }
    }

    const today = new Date();
    for (const employee of employees.filter(
      (item) => item.status !== "pending" && item.status !== "terminated",
    )) {
      for (let offset = 0; offset < 10; offset += 1) {
        const attendanceDate = new Date(
          Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - offset),
        );
        await tx.attendanceRecord.upsert({
          where: { employeeId_date: { employeeId: employee.id, date: attendanceDate } },
          update: {},
          create: {
            employeeId: employee.id,
            date: attendanceDate,
            checkIn: offset % 4 === 0 ? "09:22" : "09:02",
            checkOut: "18:03",
            status: offset % 4 === 0 ? "late" : "present",
            hours: offset % 4 === 0 ? "8.60" : "9.02",
          },
        });
      }
    }

    await tx.leaveRequest.upsert({
      where: { id: "l1" },
      update: {},
      create: {
        id: "l1",
        employeeId: "e1",
        type: "annual",
        startDate: date("2026-02-12"),
        endDate: date("2026-02-14"),
        days: 3,
        reason: "Family event",
        status: "pending",
      },
    });
    await tx.leaveRequest.upsert({
      where: { id: "l2" },
      update: {},
      create: {
        id: "l2",
        employeeId: "e7",
        type: "sick",
        startDate: date("2026-01-20"),
        endDate: date("2026-01-21"),
        days: 2,
        reason: "Medical rest",
        status: "approved",
        decidedById: "e3",
        decidedAt: new Date(),
      },
    });

    await tx.project.upsert({
      where: { id: "p1" },
      update: {},
      create: {
        id: "p1",
        name: "VertexEMS Platform",
        client: "CodeVertex Solutions",
        status: "active",
        progress: 68,
        startDate: date("2025-10-01"),
        deadline: date("2026-03-30"),
        budget: "4500000",
      },
    });
    await tx.project.upsert({
      where: { id: "p2" },
      update: {},
      create: {
        id: "p2",
        name: "Client Portal Redesign",
        client: "Northstar Retail",
        status: "planning",
        progress: 22,
        startDate: date("2026-01-15"),
        deadline: date("2026-06-15"),
        budget: "2800000",
      },
    });

    for (const item of [
      { projectId: "p1", employeeId: "e1" },
      { projectId: "p1", employeeId: "e3" },
      { projectId: "p1", employeeId: "e7" },
      { projectId: "p1", employeeId: "e8" },
      { projectId: "p2", employeeId: "e6" },
      { projectId: "p2", employeeId: "e11" },
    ]) {
      await tx.projectMember.upsert({
        where: { projectId_employeeId: item },
        update: {},
        create: item,
      });
    }

    const tasks: Prisma.TaskCreateManyInput[] = [
      {
        id: "t1",
        title: "Implement attendance API integration",
        projectId: "p1",
        assigneeId: "e7",
        priority: "high",
        status: "in_progress",
        deadline: date("2026-02-05"),
      },
      {
        id: "t2",
        title: "Review leave workflow UX",
        projectId: "p1",
        assigneeId: "e1",
        priority: "medium",
        status: "review",
        deadline: date("2026-02-10"),
      },
      {
        id: "t3",
        title: "Design client dashboard",
        projectId: "p2",
        assigneeId: "e6",
        priority: "critical",
        status: "todo",
        deadline: date("2026-02-20"),
      },
      {
        id: "t4",
        title: "Regression suite for HR flows",
        projectId: "p1",
        assigneeId: "e8",
        priority: "medium",
        status: "todo",
        deadline: date("2026-02-15"),
      },
    ];
    for (const task of tasks) {
      await tx.task.upsert({ where: { id: task.id }, update: task, create: task });
    }

    const assets: Prisma.AssetCreateManyInput[] = [
      {
        id: "a1",
        tag: "LTP-001",
        name: "MacBook Pro 14",
        category: "laptop",
        serial: "MBP14-001",
        status: "assigned",
        assignedTo: "e1",
        purchaseDate: date("2024-04-01"),
        value: "720000",
      },
      {
        id: "a2",
        tag: "LTP-002",
        name: "Dell Latitude 7440",
        category: "laptop",
        serial: "DLL7440-002",
        status: "assigned",
        assignedTo: "e7",
        purchaseDate: date("2024-05-10"),
        value: "410000",
      },
      {
        id: "a3",
        tag: "MON-001",
        name: "LG UltraFine 27",
        category: "monitor",
        serial: "LG27-001",
        status: "available",
        purchaseDate: date("2023-11-18"),
        value: "185000",
      },
    ];
    for (const asset of assets) {
      await tx.asset.upsert({ where: { id: asset.id }, update: asset, create: asset });
    }

    const docs: Prisma.DocumentItemCreateManyInput[] = [
      {
        id: "doc1",
        name: "Ayesha Contract.pdf",
        type: "contract",
        employeeId: "e1",
        uploadedById: "e4",
        storageKey: "seed/ayesha-contract.pdf",
        mimeType: "application/pdf",
        sizeKb: 245,
      },
      {
        id: "doc2",
        name: "Bilal CNIC.pdf",
        type: "id",
        employeeId: "e3",
        uploadedById: "e4",
        storageKey: "seed/bilal-cnic.pdf",
        mimeType: "application/pdf",
        sizeKb: 118,
      },
    ];
    for (const document of docs) {
      await tx.documentItem.upsert({
        where: { id: document.id },
        update: document,
        create: document,
      });
    }

    const notification = await tx.notification.upsert({
      where: { id: "n1" },
      update: {},
      create: {
        id: "n1",
        title: "Welcome to VertexEMS",
        body: "Your production EMS backend is ready.",
        kind: "system",
      },
    });
    for (const employee of employees) {
      await tx.notificationRecipient.upsert({
        where: {
          notificationId_employeeId: { notificationId: notification.id, employeeId: employee.id },
        },
        update: {},
        create: { notificationId: notification.id, employeeId: employee.id },
      });
    }

    await tx.auditLog.create({
      data: {
        actorId: "e2",
        actorName: "Admin Vertex",
        action: "seed.database",
        target: "system",
        metadata: { source: "server/prisma/seed.ts" },
      },
    });
  });

  console.log(
    `Seed completed. Demo login: admin@codevertex.io / ${config.DEFAULT_EMPLOYEE_PASSWORD}`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
