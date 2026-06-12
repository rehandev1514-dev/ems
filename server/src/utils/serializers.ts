import type {
  Asset,
  AttendanceRecord,
  Department,
  DocumentItem,
  Employee,
  LeaveBalance,
  LeaveRequest,
  Notification,
  NotificationRecipient,
  Project,
  Task,
} from "@prisma/client";

function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  if (typeof value === "object" && "toNumber" in value && typeof value.toNumber === "function") {
    return value.toNumber();
  }
  return Number(value);
}

function dateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function timeOnly(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toTimeString().slice(0, 5) : value;
}

export function serializeEmployee(employee: Employee & { department?: Department | null }) {
  return {
    ...employee,
    dob: dateOnly(employee.dob),
    joiningDate: dateOnly(employee.joiningDate),
    salary: toNumber(employee.salary),
    department: employee.department
      ? {
          id: employee.department.id,
          name: employee.department.name,
          code: employee.department.code,
          managerId: employee.department.managerId,
          createdAt: employee.department.createdAt,
          updatedAt: employee.department.updatedAt,
        }
      : null,
  };
}

export function serializeDepartment(
  department: Department & { manager?: Employee | null; _count?: { employees: number } },
) {
  return {
    ...department,
    headcount: department._count?.employees ?? undefined,
    manager: department.manager
      ? {
          id: department.manager.id,
          fullName: department.manager.fullName,
          email: department.manager.email,
          employeeCode: department.manager.employeeCode,
        }
      : null,
  };
}

export function serializeAttendance(record: AttendanceRecord & { employee?: Employee | null }) {
  return {
    ...record,
    date: dateOnly(record.date),
    checkIn: timeOnly(record.checkIn),
    checkOut: timeOnly(record.checkOut),
    hours: toNumber(record.hours),
    employee: record.employee
      ? {
          id: record.employee.id,
          fullName: record.employee.fullName,
          employeeCode: record.employee.employeeCode,
        }
      : undefined,
  };
}

export function serializeLeave(
  leave: LeaveRequest & { employee?: Employee | null; decidedBy?: Employee | null },
) {
  return {
    ...leave,
    startDate: dateOnly(leave.startDate),
    endDate: dateOnly(leave.endDate),
    employee: leave.employee
      ? {
          id: leave.employee.id,
          fullName: leave.employee.fullName,
          employeeCode: leave.employee.employeeCode,
        }
      : undefined,
    decidedBy: leave.decidedBy
      ? {
          id: leave.decidedBy.id,
          fullName: leave.decidedBy.fullName,
          employeeCode: leave.decidedBy.employeeCode,
        }
      : undefined,
  };
}

export function serializeLeaveBalance(balance: LeaveBalance) {
  return { ...balance };
}

export function serializeProject(
  project: Project & { members?: Array<{ employee: Employee }>; tasks?: Task[] },
) {
  return {
    ...project,
    startDate: dateOnly(project.startDate),
    deadline: dateOnly(project.deadline),
    budget: toNumber(project.budget),
    memberIds: project.members?.map((member) => member.employee.id) ?? undefined,
    members: project.members?.map((member) => ({
      id: member.employee.id,
      fullName: member.employee.fullName,
      employeeCode: member.employee.employeeCode,
      email: member.employee.email,
    })),
    tasks: project.tasks?.map(serializeTask),
  };
}

export function serializeTask(
  task: Task & { project?: Project | null; assignee?: Employee | null },
) {
  return {
    ...task,
    deadline: dateOnly(task.deadline),
    project: task.project
      ? { id: task.project.id, name: task.project.name, client: task.project.client }
      : undefined,
    assignee: task.assignee
      ? {
          id: task.assignee.id,
          fullName: task.assignee.fullName,
          employeeCode: task.assignee.employeeCode,
        }
      : undefined,
  };
}

export function serializeAsset(asset: Asset & { assignee?: Employee | null }) {
  return {
    ...asset,
    purchaseDate: dateOnly(asset.purchaseDate),
    value: toNumber(asset.value),
    assignee: asset.assignee
      ? {
          id: asset.assignee.id,
          fullName: asset.assignee.fullName,
          employeeCode: asset.assignee.employeeCode,
        }
      : null,
  };
}

export function serializeDocument(
  document: DocumentItem & { employee?: Employee | null; uploadedBy?: Employee | null },
) {
  return {
    ...document,
    uploadedAt: document.uploadedAt,
    employee: document.employee
      ? {
          id: document.employee.id,
          fullName: document.employee.fullName,
          employeeCode: document.employee.employeeCode,
        }
      : undefined,
    uploadedBy: document.uploadedBy
      ? {
          id: document.uploadedBy.id,
          fullName: document.uploadedBy.fullName,
          employeeCode: document.uploadedBy.employeeCode,
        }
      : undefined,
  };
}

export function serializeNotificationRecipient(
  recipient: NotificationRecipient & { notification: Notification },
) {
  return {
    id: recipient.notification.id,
    recipientId: recipient.id,
    title: recipient.notification.title,
    body: recipient.notification.body,
    kind: recipient.notification.kind,
    unread: !recipient.readAt,
    readAt: recipient.readAt,
    createdAt: recipient.notification.createdAt,
  };
}
