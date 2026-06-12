import { Router } from "express";
import { z } from "zod";
import type { AttendanceStatus, Prisma, Role } from "@prisma/client";
import { prisma } from "../prisma.js";
import { authenticate, authorize, requireSelfOrRoles } from "../middleware/auth.js";
import { ApiError } from "../middleware/error.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ok } from "../utils/api-response.js";
import { audit } from "../utils/audit.js";
import { getPagination, pageMeta, paginationQuerySchema } from "../utils/pagination.js";
import { serializeAttendance } from "../utils/serializers.js";
import { config } from "../config.js";

export const attendanceRouter = Router();

const attendanceStatusSchema = z.enum(["present", "absent", "leave", "late", "half_day"]);
const attendanceQuerySchema = paginationQuerySchema.extend({
  employeeId: z.string().optional(),
  status: attendanceStatusSchema.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});
const employeeActionSchema = z.object({ employeeId: z.string().optional() });
const adjustSchema = z.object({
  employeeId: z.string().min(1),
  date: z.coerce.date(),
  checkIn: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional()
    .nullable(),
  checkOut: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional()
    .nullable(),
  status: attendanceStatusSchema,
  hours: z.coerce.number().min(0).max(24).default(0),
});

function todayDate() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function normalizeDate(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function currentTime() {
  return new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function hoursBetween(checkIn?: string | null, checkOut?: string | null) {
  if (!checkIn || !checkOut) return 0;
  const [inHour = 0, inMinute = 0] = checkIn.split(":").map(Number);
  const [outHour = 0, outMinute = 0] = checkOut.split(":").map(Number);
  const minutes = outHour * 60 + outMinute - (inHour * 60 + inMinute);
  return Math.max(0, Number((minutes / 60).toFixed(2)));
}

function isLate(checkIn: string) {
  return checkIn > config.LATE_AFTER;
}

attendanceRouter.use(authenticate);

attendanceRouter.get(
  "/",
  validate({ query: attendanceQuerySchema }),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as z.infer<typeof attendanceQuerySchema>;
    const privileged = ["admin", "manager", "supervisor", "accountant"].includes(req.user!.role);
    const employeeId = privileged ? query.employeeId : req.user!.employeeId;
    const where: Prisma.AttendanceRecordWhereInput = {
      ...(employeeId ? { employeeId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.startDate || query.endDate
        ? {
            date: {
              ...(query.startDate ? { gte: normalizeDate(query.startDate) } : {}),
              ...(query.endDate ? { lte: normalizeDate(query.endDate) } : {}),
            },
          }
        : {}),
    };
    const { skip, take } = getPagination(query);
    const [total, records] = await prisma.$transaction([
      prisma.attendanceRecord.count({ where }),
      prisma.attendanceRecord.findMany({
        where,
        include: { employee: true },
        orderBy: { date: "desc" },
        skip,
        take,
      }),
    ]);
    ok(res, records.map(serializeAttendance), pageMeta(total, query));
  }),
);

attendanceRouter.post(
  "/check-in",
  validate({ body: employeeActionSchema }),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof employeeActionSchema>;
    const employeeId = body.employeeId ?? req.user!.employeeId;
    requireSelfOrRoles(employeeId, req, ["admin", "manager", "supervisor"] as Role[]);
    const date = todayDate();
    const checkIn = currentTime();
    const status: AttendanceStatus = isLate(checkIn) ? "late" : "present";

    const record = await prisma.attendanceRecord.upsert({
      where: { employeeId_date: { employeeId, date } },
      update: { checkIn, status },
      create: { employeeId, date, checkIn, status, hours: 0 },
      include: { employee: true },
    });
    await audit(req, "attendance.check_in", `attendance:${record.id}`);
    ok(res, serializeAttendance(record));
  }),
);

attendanceRouter.post(
  "/check-out",
  validate({ body: employeeActionSchema }),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof employeeActionSchema>;
    const employeeId = body.employeeId ?? req.user!.employeeId;
    requireSelfOrRoles(employeeId, req, ["admin", "manager", "supervisor"] as Role[]);
    const date = todayDate();
    const existing = await prisma.attendanceRecord.findUnique({
      where: { employeeId_date: { employeeId, date } },
    });
    if (!existing?.checkIn)
      throw new ApiError(400, "CHECK_IN_REQUIRED", "Check in before checking out");
    const checkOut = currentTime();
    const record = await prisma.attendanceRecord.update({
      where: { id: existing.id },
      data: { checkOut, hours: hoursBetween(existing.checkIn, checkOut) },
      include: { employee: true },
    });
    await audit(req, "attendance.check_out", `attendance:${record.id}`);
    ok(res, serializeAttendance(record));
  }),
);

attendanceRouter.post(
  "/adjust",
  authorize("admin", "manager", "supervisor"),
  validate({ body: adjustSchema }),
  asyncHandler(async (req, res) => {
    const input = req.body as z.infer<typeof adjustSchema>;
    const date = normalizeDate(input.date);
    const record = await prisma.attendanceRecord.upsert({
      where: { employeeId_date: { employeeId: input.employeeId, date } },
      update: {
        checkIn: input.checkIn ?? null,
        checkOut: input.checkOut ?? null,
        status: input.status,
        hours: input.hours,
      },
      create: {
        employeeId: input.employeeId,
        date,
        checkIn: input.checkIn,
        checkOut: input.checkOut,
        status: input.status,
        hours: input.hours,
      },
      include: { employee: true },
    });
    await audit(req, "attendance.adjust", `attendance:${record.id}`);
    ok(res, serializeAttendance(record));
  }),
);
