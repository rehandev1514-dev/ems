import { Router } from "express";
import { z } from "zod";
import type { LeaveStatus, LeaveType, Prisma, Role } from "@prisma/client";
import { prisma } from "../prisma.js";
import { authenticate, authorize, requireSelfOrRoles } from "../middleware/auth.js";
import { ApiError } from "../middleware/error.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/async-handler.js";
import { created, ok } from "../utils/api-response.js";
import { audit } from "../utils/audit.js";
import { getPagination, pageMeta, paginationQuerySchema } from "../utils/pagination.js";
import { serializeLeave, serializeLeaveBalance } from "../utils/serializers.js";
import { createNotification } from "../utils/notifications.js";

export const leavesRouter = Router();

const idParams = z.object({ id: z.string().min(1) });
const leaveTypeSchema = z.enum(["annual", "sick", "casual", "emergency"]);
const leaveStatusSchema = z.enum(["pending", "approved", "rejected"]);
const leavesQuerySchema = paginationQuerySchema.extend({
  employeeId: z.string().optional(),
  type: leaveTypeSchema.optional(),
  status: leaveStatusSchema.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});
const applyLeaveSchema = z.object({
  employeeId: z.string().optional(),
  type: leaveTypeSchema,
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  reason: z.string().min(3).max(500),
});
const statusBodySchema = z.object({
  status: z.enum(["approved", "rejected"]),
  note: z.string().max(500).optional(),
});
const balancesQuerySchema = z.object({
  employeeId: z.string().optional(),
  year: z.coerce
    .number()
    .int()
    .default(() => new Date().getFullYear()),
});

function normalizeDate(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function dayCount(startDate: Date, endDate: Date) {
  const start = normalizeDate(startDate).getTime();
  const end = normalizeDate(endDate).getTime();
  if (end < start)
    throw new ApiError(400, "INVALID_DATE_RANGE", "End date must be after start date");
  return Math.floor((end - start) / 86_400_000) + 1;
}

async function ensureBalance(employeeId: string, type: LeaveType, year: number) {
  const entitlement = type === "annual" ? 18 : type === "sick" ? 10 : type === "casual" ? 8 : 4;
  return prisma.leaveBalance.upsert({
    where: { employeeId_type_year: { employeeId, type, year } },
    update: {},
    create: { employeeId, type, year, entitlement },
  });
}

leavesRouter.use(authenticate);

leavesRouter.get(
  "/",
  validate({ query: leavesQuerySchema }),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as z.infer<typeof leavesQuerySchema>;
    const privileged = ["admin", "manager", "supervisor"].includes(req.user!.role);
    const employeeId = privileged ? query.employeeId : req.user!.employeeId;
    const where: Prisma.LeaveRequestWhereInput = {
      ...(employeeId ? { employeeId } : {}),
      ...(query.type ? { type: query.type } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.startDate || query.endDate
        ? {
            startDate: {
              ...(query.startDate ? { gte: normalizeDate(query.startDate) } : {}),
              ...(query.endDate ? { lte: normalizeDate(query.endDate) } : {}),
            },
          }
        : {}),
    };
    const { skip, take } = getPagination(query);
    const [total, leaves] = await prisma.$transaction([
      prisma.leaveRequest.count({ where }),
      prisma.leaveRequest.findMany({
        where,
        include: { employee: true, decidedBy: true },
        orderBy: { appliedAt: "desc" },
        skip,
        take,
      }),
    ]);
    ok(res, leaves.map(serializeLeave), pageMeta(total, query));
  }),
);

leavesRouter.get(
  "/balances",
  validate({ query: balancesQuerySchema }),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as z.infer<typeof balancesQuerySchema>;
    const employeeId = query.employeeId ?? req.user!.employeeId;
    requireSelfOrRoles(employeeId, req, ["admin", "manager", "supervisor", "accountant"] as Role[]);
    const types: LeaveType[] = ["annual", "sick", "casual", "emergency"];
    await Promise.all(types.map((type) => ensureBalance(employeeId, type, query.year)));
    const balances = await prisma.leaveBalance.findMany({
      where: { employeeId, year: query.year },
      orderBy: { type: "asc" },
    });
    ok(res, balances.map(serializeLeaveBalance));
  }),
);

leavesRouter.post(
  "/",
  validate({ body: applyLeaveSchema }),
  asyncHandler(async (req, res) => {
    const input = req.body as z.infer<typeof applyLeaveSchema>;
    const employeeId = input.employeeId ?? req.user!.employeeId;
    requireSelfOrRoles(employeeId, req, ["admin", "manager"] as Role[]);
    const startDate = normalizeDate(input.startDate);
    const endDate = normalizeDate(input.endDate);
    const days = dayCount(startDate, endDate);
    const year = startDate.getUTCFullYear();
    const balance = await ensureBalance(employeeId, input.type, year);
    if (balance.entitlement + balance.carriedOver - balance.used - balance.pending < days) {
      throw new ApiError(
        400,
        "INSUFFICIENT_LEAVE_BALANCE",
        "Requested days exceed available leave balance",
      );
    }
    const overlap = await prisma.leaveRequest.findFirst({
      where: {
        employeeId,
        status: { in: ["pending", "approved"] },
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
    });
    if (overlap)
      throw new ApiError(409, "LEAVE_OVERLAP", "A leave request already exists for these dates");

    const leave = await prisma.$transaction(async (tx) => {
      await tx.leaveBalance.update({
        where: { id: balance.id },
        data: { pending: { increment: days } },
      });
      return tx.leaveRequest.create({
        data: { employeeId, type: input.type, startDate, endDate, days, reason: input.reason },
        include: { employee: true, decidedBy: true },
      });
    });
    await createNotification({
      title: "Leave request submitted",
      body: `${leave.employee.fullName} requested ${days} day(s) leave`,
      kind: "leave",
      roles: ["admin", "manager"],
    });
    await audit(req, "leave.apply", `leave:${leave.id}`);
    created(res, serializeLeave(leave));
  }),
);

leavesRouter.patch(
  "/:id/status",
  authorize("admin", "manager", "supervisor"),
  validate({ params: idParams, body: statusBodySchema }),
  asyncHandler(async (req, res) => {
    const { id } = req.params as z.infer<typeof idParams>;
    const { status } = req.body as z.infer<typeof statusBodySchema>;
    const current = await prisma.leaveRequest.findUniqueOrThrow({
      where: { id },
      include: { employee: true },
    });
    if (current.status !== "pending")
      throw new ApiError(
        400,
        "LEAVE_ALREADY_DECIDED",
        "Only pending leave requests can be decided",
      );
    const year = current.startDate.getUTCFullYear();
    const balance = await ensureBalance(current.employeeId, current.type, year);
    const leave = await prisma.$transaction(async (tx) => {
      await tx.leaveBalance.update({
        where: { id: balance.id },
        data: {
          pending: { decrement: current.days },
          ...(status === "approved" ? { used: { increment: current.days } } : {}),
        },
      });
      return tx.leaveRequest.update({
        where: { id },
        data: {
          status: status as LeaveStatus,
          decidedById: req.user!.employeeId,
          decidedAt: new Date(),
        },
        include: { employee: true, decidedBy: true },
      });
    });
    await createNotification({
      title: `Leave ${status}`,
      body: `Your leave request was ${status}.`,
      kind: "leave",
      employeeIds: [leave.employeeId],
    });
    await audit(req, `leave.${status}`, `leave:${id}`);
    ok(res, serializeLeave(leave));
  }),
);

leavesRouter.delete(
  "/:id",
  validate({ params: idParams }),
  asyncHandler(async (req, res) => {
    const { id } = req.params as z.infer<typeof idParams>;
    const current = await prisma.leaveRequest.findUniqueOrThrow({ where: { id } });
    requireSelfOrRoles(current.employeeId, req, ["admin", "manager"] as Role[]);
    if (current.status !== "pending")
      throw new ApiError(
        400,
        "LEAVE_ALREADY_DECIDED",
        "Only pending leave requests can be cancelled",
      );
    const balance = await ensureBalance(
      current.employeeId,
      current.type,
      current.startDate.getUTCFullYear(),
    );
    await prisma.$transaction([
      prisma.leaveBalance.update({
        where: { id: balance.id },
        data: { pending: { decrement: current.days } },
      }),
      prisma.leaveRequest.delete({ where: { id } }),
    ]);
    await audit(req, "leave.cancel", `leave:${id}`);
    ok(res, { success: true });
  }),
);
