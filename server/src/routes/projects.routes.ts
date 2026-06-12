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
import { serializeProject } from "../utils/serializers.js";

export const projectsRouter = Router();

const idParams = z.object({ id: z.string().min(1) });
const memberParams = z.object({ id: z.string().min(1), employeeId: z.string().min(1) });
const projectStatusSchema = z.enum(["planning", "active", "on_hold", "completed", "cancelled"]);

const projectsQuerySchema = paginationQuerySchema.extend({
  status: projectStatusSchema.optional(),
  memberId: z.string().optional(),
});

const projectBodySchema = z.object({
  name: z.string().min(2).max(200),
  client: z.string().min(1).max(200),
  status: projectStatusSchema.default("planning"),
  progress: z.coerce.number().int().min(0).max(100).default(0),
  startDate: z.coerce.date(),
  deadline: z.coerce.date(),
  budget: z.coerce.number().nonnegative(),
  memberIds: z.array(z.string()).optional(),
});

const memberBodySchema = z.object({ employeeId: z.string().min(1) });

projectsRouter.use(authenticate);

// ── List Projects ──────────────────────────────────────────────────────────
projectsRouter.get(
  "/",
  validate({ query: projectsQuerySchema }),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as z.infer<typeof projectsQuerySchema>;
    const { skip, take } = getPagination(query);
    const isRestrictedEmployee = req.user!.role === "employee";

    const where: Prisma.ProjectWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.memberId ? { members: { some: { employeeId: query.memberId } } } : {}),
      // Employees only see projects they belong to
      ...(isRestrictedEmployee ? { members: { some: { employeeId: req.user!.employeeId } } } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: "insensitive" } },
              { client: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [total, projects] = await prisma.$transaction([
      prisma.project.count({ where }),
      prisma.project.findMany({
        where,
        include: { members: { include: { employee: true } }, tasks: true },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
    ]);
    ok(res, projects.map(serializeProject), pageMeta(total, query));
  }),
);

// ── Get Single Project ─────────────────────────────────────────────────────
projectsRouter.get(
  "/:id",
  validate({ params: idParams }),
  asyncHandler(async (req, res) => {
    const { id } = req.params as z.infer<typeof idParams>;
    const project = await prisma.project.findUniqueOrThrow({
      where: { id },
      include: { members: { include: { employee: true } }, tasks: true },
    });
    ok(res, serializeProject(project));
  }),
);

// ── Create Project ─────────────────────────────────────────────────────────
projectsRouter.post(
  "/",
  authorize("admin", "manager"),
  validate({ body: projectBodySchema }),
  asyncHandler(async (req, res) => {
    const input = req.body as z.infer<typeof projectBodySchema>;
    const { memberIds, ...rest } = input;
    const project = await prisma.project.create({
      data: {
        ...rest,
        ...(memberIds?.length
          ? { members: { create: memberIds.map((employeeId) => ({ employeeId })) } }
          : {}),
      },
      include: { members: { include: { employee: true } }, tasks: true },
    });
    await audit(req, "project.create", `project:${project.id}`);
    created(res, serializeProject(project));
  }),
);

// ── Update Project ─────────────────────────────────────────────────────────
projectsRouter.patch(
  "/:id",
  authorize("admin", "manager"),
  validate({ params: idParams, body: projectBodySchema.partial() }),
  asyncHandler(async (req, res) => {
    const { id } = req.params as z.infer<typeof idParams>;
    const input = req.body as Partial<z.infer<typeof projectBodySchema>>;
    // memberIds handled separately via /members endpoints
    const { memberIds: _memberIds, ...rest } = input;
    const project = await prisma.project.update({
      where: { id },
      data: rest,
      include: { members: { include: { employee: true } }, tasks: true },
    });
    await audit(req, "project.update", `project:${id}`);
    ok(res, serializeProject(project));
  }),
);

// ── Delete Project ─────────────────────────────────────────────────────────
projectsRouter.delete(
  "/:id",
  authorize("admin"),
  validate({ params: idParams }),
  asyncHandler(async (req, res) => {
    const { id } = req.params as z.infer<typeof idParams>;
    await prisma.project.delete({ where: { id } });
    await audit(req, "project.delete", `project:${id}`);
    ok(res, { success: true });
  }),
);

// ── Add Project Member ─────────────────────────────────────────────────────
projectsRouter.post(
  "/:id/members",
  authorize("admin", "manager"),
  validate({ params: idParams, body: memberBodySchema }),
  asyncHandler(async (req, res) => {
    const { id } = req.params as z.infer<typeof idParams>;
    const { employeeId } = req.body as z.infer<typeof memberBodySchema>;
    await prisma.projectMember.upsert({
      where: { projectId_employeeId: { projectId: id, employeeId } },
      create: { projectId: id, employeeId },
      update: {},
    });
    const project = await prisma.project.findUniqueOrThrow({
      where: { id },
      include: { members: { include: { employee: true } }, tasks: true },
    });
    await audit(req, "project.member_add", `project:${id}`, { employeeId });
    ok(res, serializeProject(project));
  }),
);

// ── Remove Project Member ──────────────────────────────────────────────────
projectsRouter.delete(
  "/:id/members/:employeeId",
  authorize("admin", "manager"),
  validate({ params: memberParams }),
  asyncHandler(async (req, res) => {
    const { id, employeeId } = req.params as z.infer<typeof memberParams>;
    await prisma.projectMember.delete({
      where: { projectId_employeeId: { projectId: id, employeeId } },
    });
    await audit(req, "project.member_remove", `project:${id}`, { employeeId });
    ok(res, { success: true });
  }),
);
