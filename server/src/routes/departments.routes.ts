import { Router } from "express";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "../prisma.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/async-handler.js";
import { created, ok } from "../utils/api-response.js";
import { audit } from "../utils/audit.js";
import { getPagination, pageMeta, paginationQuerySchema } from "../utils/pagination.js";
import { serializeDepartment } from "../utils/serializers.js";

export const departmentsRouter = Router();

const idParams = z.object({ id: z.string().min(1) });
const departmentsQuerySchema = paginationQuerySchema.extend({
  activeOnly: z.coerce.boolean().default(false),
});
const departmentBodySchema = z.object({
  name: z.string().min(2).max(120),
  code: z.string().min(2).max(12).toUpperCase(),
  managerId: z.string().min(1).optional().nullable(),
});

departmentsRouter.use(authenticate);

departmentsRouter.get(
  "/",
  validate({ query: departmentsQuerySchema }),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as z.infer<typeof departmentsQuerySchema>;
    const { skip, take } = getPagination(query);
    const where: Prisma.DepartmentWhereInput = query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: "insensitive" } },
            { code: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {};
    const [total, departments] = await prisma.$transaction([
      prisma.department.count({ where }),
      prisma.department.findMany({
        where,
        include: { manager: true, _count: { select: { employees: true } } },
        orderBy: { name: "asc" },
        skip,
        take,
      }),
    ]);
    ok(res, departments.map(serializeDepartment), pageMeta(total, query));
  }),
);

departmentsRouter.get(
  "/:id",
  validate({ params: idParams }),
  asyncHandler(async (req, res) => {
    const { id } = req.params as z.infer<typeof idParams>;
    const department = await prisma.department.findUniqueOrThrow({
      where: { id },
      include: { manager: true, _count: { select: { employees: true } } },
    });
    ok(res, serializeDepartment(department));
  }),
);

departmentsRouter.post(
  "/",
  authorize("admin", "manager"),
  validate({ body: departmentBodySchema }),
  asyncHandler(async (req, res) => {
    const input = req.body as z.infer<typeof departmentBodySchema>;
    const department = await prisma.department.create({
      data: { name: input.name, code: input.code, managerId: input.managerId ?? undefined },
      include: { manager: true, _count: { select: { employees: true } } },
    });
    await audit(req, "department.create", `department:${department.id}`);
    created(res, serializeDepartment(department));
  }),
);

departmentsRouter.patch(
  "/:id",
  authorize("admin", "manager"),
  validate({ params: idParams, body: departmentBodySchema.partial() }),
  asyncHandler(async (req, res) => {
    const { id } = req.params as z.infer<typeof idParams>;
    const input = req.body as Partial<z.infer<typeof departmentBodySchema>>;
    const department = await prisma.department.update({
      where: { id },
      data: { name: input.name, code: input.code, managerId: input.managerId ?? undefined },
      include: { manager: true, _count: { select: { employees: true } } },
    });
    await audit(req, "department.update", `department:${id}`);
    ok(res, serializeDepartment(department));
  }),
);

departmentsRouter.delete(
  "/:id",
  authorize("admin"),
  validate({ params: idParams }),
  asyncHandler(async (req, res) => {
    const { id } = req.params as z.infer<typeof idParams>;
    await prisma.department.delete({ where: { id } });
    await audit(req, "department.delete", `department:${id}`);
    ok(res, { success: true });
  }),
);
