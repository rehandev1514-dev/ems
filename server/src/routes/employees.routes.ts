import { Router } from "express";
import { z } from "zod";
import type { Prisma, Role } from "@prisma/client";
import { prisma } from "../prisma.js";
import { authenticate, authorize, requireSelfOrRoles } from "../middleware/auth.js";
import { ApiError } from "../middleware/error.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/async-handler.js";
import { created, ok } from "../utils/api-response.js";
import { audit } from "../utils/audit.js";
import { hashPassword } from "../utils/crypto.js";
import { getPagination, pageMeta, paginationQuerySchema } from "../utils/pagination.js";
import { serializeEmployee } from "../utils/serializers.js";
import { config } from "../config.js";

export const employeesRouter = Router();

const idParams = z.object({ id: z.string().min(1) });
const roleSchema = z.enum(["admin", "employee", "manager", "supervisor", "accountant"]);
const statusSchema = z.enum(["active", "on_leave", "probation", "terminated", "pending"]);
const genderSchema = z.enum(["male", "female", "other"]);

const employeesQuerySchema = paginationQuerySchema.extend({
  departmentId: z.string().optional(),
  role: roleSchema.optional(),
  status: statusSchema.optional(),
});

const employeeBodySchema = z.object({
  employeeCode: z.string().min(2).max(40).optional(),
  fullName: z.string().min(2).max(120),
  email: z.string().email().toLowerCase(),
  phone: z.string().min(5).max(40),
  cnic: z.string().min(5).max(40).optional().nullable(),
  address: z.string().min(2).max(240),
  gender: genderSchema,
  dob: z.coerce.date(),
  departmentId: z.string().min(1).optional().nullable(),
  designation: z.string().min(2).max(120),
  joiningDate: z.coerce.date(),
  status: statusSchema.default("pending"),
  salary: z.coerce.number().nonnegative(),
  avatar: z.string().url().optional().nullable(),
  role: roleSchema.default("employee"),
  password: z.string().min(8).max(128).optional(),
});

const employeeUpdateSchema = employeeBodySchema
  .partial()
  .omit({ password: true })
  .extend({
    password: z.string().min(8).max(128).optional(),
  });

async function generateEmployeeCode() {
  const total = await prisma.employee.count();
  for (let next = total + 101; next < total + 1500; next += 1) {
    const employeeCode = `CVS-${String(next).padStart(3, "0")}`;
    const exists = await prisma.employee.findUnique({ where: { employeeCode } });
    if (!exists) return employeeCode;
  }
  return `CVS-${Date.now()}`;
}

async function createDefaultLeaveBalances(employeeId: string) {
  const year = new Date().getFullYear();
  const entitlements = { annual: 18, sick: 10, casual: 8, emergency: 4 } as const;
  await prisma.leaveBalance.createMany({
    data: Object.entries(entitlements).map(([type, entitlement]) => ({
      employeeId,
      type: type as keyof typeof entitlements,
      year,
      entitlement,
    })),
    skipDuplicates: true,
  });
}

function employeeData(
  input: z.infer<typeof employeeBodySchema> | z.infer<typeof employeeUpdateSchema>,
) {
  return {
    employeeCode: input.employeeCode,
    fullName: input.fullName,
    email: input.email,
    phone: input.phone,
    cnic: input.cnic ?? undefined,
    address: input.address,
    gender: input.gender,
    dob: input.dob,
    departmentId: input.departmentId ?? undefined,
    designation: input.designation,
    joiningDate: input.joiningDate,
    status: input.status,
    salary: input.salary,
    avatar: input.avatar ?? undefined,
    role: input.role,
  } satisfies Prisma.EmployeeUncheckedCreateInput | Prisma.EmployeeUncheckedUpdateInput;
}

employeesRouter.use(authenticate);

employeesRouter.get(
  "/",
  validate({ query: employeesQuerySchema }),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as z.infer<typeof employeesQuerySchema>;
    const { skip, take } = getPagination(query);
    const where: Prisma.EmployeeWhereInput = {
      ...(query.departmentId ? { departmentId: query.departmentId } : {}),
      ...(query.role ? { role: query.role } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { fullName: { contains: query.search, mode: "insensitive" } },
              { email: { contains: query.search, mode: "insensitive" } },
              { employeeCode: { contains: query.search, mode: "insensitive" } },
              { designation: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };
    const sortBy = ["fullName", "employeeCode", "createdAt", "joiningDate", "salary"].includes(
      query.sortBy ?? "",
    )
      ? query.sortBy!
      : "createdAt";

    const [total, employees] = await prisma.$transaction([
      prisma.employee.count({ where }),
      prisma.employee.findMany({
        where,
        include: { department: true },
        orderBy: { [sortBy]: query.sortOrder },
        skip,
        take,
      }),
    ]);

    ok(res, employees.map(serializeEmployee), pageMeta(total, query));
  }),
);

employeesRouter.get(
  "/:id",
  validate({ params: idParams }),
  asyncHandler(async (req, res) => {
    const { id } = req.params as z.infer<typeof idParams>;
    requireSelfOrRoles(id, req, ["admin", "manager", "supervisor", "accountant"] as Role[]);
    const employee = await prisma.employee.findUniqueOrThrow({
      where: { id },
      include: { department: true },
    });
    ok(res, serializeEmployee(employee));
  }),
);

employeesRouter.post(
  "/",
  authorize("admin", "manager"),
  validate({ body: employeeBodySchema }),
  asyncHandler(async (req, res) => {
    const input = req.body as z.infer<typeof employeeBodySchema>;
    const passwordHash = await hashPassword(input.password ?? config.DEFAULT_EMPLOYEE_PASSWORD);
    const employee = await prisma.employee.create({
      data: {
        ...employeeData({
          ...input,
          employeeCode: input.employeeCode ?? (await generateEmployeeCode()),
        }),
        credential: { create: { passwordHash, emailVerifiedAt: new Date() } },
        notificationPreferences: { create: {} },
      } as Prisma.EmployeeCreateInput,
      include: { department: true },
    });
    await createDefaultLeaveBalances(employee.id);
    await audit(req, "employee.create", `employee:${employee.id}`);
    created(res, serializeEmployee(employee));
  }),
);

employeesRouter.patch(
  "/:id",
  validate({ params: idParams, body: employeeUpdateSchema }),
  asyncHandler(async (req, res) => {
    const { id } = req.params as z.infer<typeof idParams>;
    const input = req.body as z.infer<typeof employeeUpdateSchema>;
    const isSelf = req.user!.employeeId === id;
    const privileged = ["admin", "manager"].includes(req.user!.role);
    if (!isSelf && !privileged)
      throw new ApiError(403, "FORBIDDEN", "You can only update your own profile");
    if (
      isSelf &&
      !privileged &&
      (input.role || input.status || input.salary || input.departmentId)
    ) {
      throw new ApiError(
        403,
        "FORBIDDEN",
        "Role, status, salary and department changes require admin approval",
      );
    }

    const { password, ...rest } = input;
    const updated = await prisma.employee.update({
      where: { id },
      data: {
        ...employeeData(rest),
        ...(password
          ? {
              credential: {
                upsert: {
                  create: { passwordHash: await hashPassword(password) },
                  update: { passwordHash: await hashPassword(password) },
                },
              },
            }
          : {}),
      } as Prisma.EmployeeUpdateInput,
      include: { department: true },
    });
    await audit(req, "employee.update", `employee:${id}`);
    ok(res, serializeEmployee(updated));
  }),
);

employeesRouter.post(
  "/:id/approve",
  authorize("admin", "manager"),
  validate({ params: idParams }),
  asyncHandler(async (req, res) => {
    const { id } = req.params as z.infer<typeof idParams>;
    const employee = await prisma.employee.update({
      where: { id },
      data: { status: "active" },
      include: { department: true },
    });
    await audit(req, "employee.approve", `employee:${id}`);
    ok(res, serializeEmployee(employee));
  }),
);

employeesRouter.post(
  "/:id/terminate",
  authorize("admin"),
  validate({ params: idParams }),
  asyncHandler(async (req, res) => {
    const { id } = req.params as z.infer<typeof idParams>;
    const employee = await prisma.employee.update({
      where: { id },
      data: {
        status: "terminated",
        credential: { update: { disabledAt: new Date() } },
        refreshTokens: {
          updateMany: { where: { revokedAt: null }, data: { revokedAt: new Date() } },
        },
      },
      include: { department: true },
    });
    await audit(req, "employee.terminate", `employee:${id}`);
    ok(res, serializeEmployee(employee));
  }),
);

employeesRouter.delete(
  "/:id",
  authorize("admin"),
  validate({ params: idParams }),
  asyncHandler(async (req, res) => {
    const { id } = req.params as z.infer<typeof idParams>;
    await prisma.employee.delete({ where: { id } });
    await audit(req, "employee.delete", `employee:${id}`);
    ok(res, { success: true });
  }),
);
