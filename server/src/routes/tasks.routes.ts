import { Router } from "express";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "../prisma.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { ApiError } from "../middleware/error.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/async-handler.js";
import { created, ok } from "../utils/api-response.js";
import { audit } from "../utils/audit.js";
import { getPagination, pageMeta, paginationQuerySchema } from "../utils/pagination.js";
import { serializeTask } from "../utils/serializers.js";
import { createNotification } from "../utils/notifications.js";

export const tasksRouter = Router();

const idParams = z.object({ id: z.string().min(1) });
const taskPrioritySchema = z.enum(["low", "medium", "high", "critical"]);
const taskStatusSchema = z.enum(["todo", "in_progress", "review", "done"]);

const tasksQuerySchema = paginationQuerySchema.extend({
  projectId: z.string().optional(),
  assigneeId: z.string().optional(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
});

const taskBodySchema = z.object({
  title: z.string().min(2).max(200),
  projectId: z.string().min(1),
  assigneeId: z.string().min(1),
  priority: taskPrioritySchema.default("medium"),
  status: taskStatusSchema.default("todo"),
  deadline: z.coerce.date(),
});

const statusBodySchema = z.object({ status: taskStatusSchema });

tasksRouter.use(authenticate);

// ── List Tasks ─────────────────────────────────────────────────────────────
tasksRouter.get(
  "/",
  validate({ query: tasksQuerySchema }),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as z.infer<typeof tasksQuerySchema>;
    const { skip, take } = getPagination(query);
    const isEmployee = req.user!.role === "employee";

    const where: Prisma.TaskWhereInput = {
      ...(query.projectId ? { projectId: query.projectId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.priority ? { priority: query.priority } : {}),
      // Employees only see tasks assigned to them
      ...(isEmployee
        ? { assigneeId: req.user!.employeeId }
        : query.assigneeId
          ? { assigneeId: query.assigneeId }
          : {}),
      ...(query.search ? { title: { contains: query.search, mode: "insensitive" } } : {}),
    };

    const [total, tasks] = await prisma.$transaction([
      prisma.task.count({ where }),
      prisma.task.findMany({
        where,
        include: { project: true, assignee: true },
        orderBy: { deadline: "asc" },
        skip,
        take,
      }),
    ]);
    ok(res, tasks.map(serializeTask), pageMeta(total, query));
  }),
);

// ── Get Single Task ────────────────────────────────────────────────────────
tasksRouter.get(
  "/:id",
  validate({ params: idParams }),
  asyncHandler(async (req, res) => {
    const { id } = req.params as z.infer<typeof idParams>;
    const task = await prisma.task.findUniqueOrThrow({
      where: { id },
      include: { project: true, assignee: true },
    });
    ok(res, serializeTask(task));
  }),
);

// ── Create Task ────────────────────────────────────────────────────────────
tasksRouter.post(
  "/",
  authorize("admin", "manager", "supervisor"),
  validate({ body: taskBodySchema }),
  asyncHandler(async (req, res) => {
    const input = req.body as z.infer<typeof taskBodySchema>;
    const task = await prisma.task.create({
      data: input,
      include: { project: true, assignee: true },
    });
    await createNotification({
      title: "New task assigned",
      body: `You have been assigned: ${task.title}`,
      kind: "task",
      employeeIds: [input.assigneeId],
    });
    await audit(req, "task.create", `task:${task.id}`);
    created(res, serializeTask(task));
  }),
);

// ── Update Task (full edit — privileged only) ──────────────────────────────
tasksRouter.patch(
  "/:id",
  validate({ params: idParams, body: taskBodySchema.partial() }),
  asyncHandler(async (req, res) => {
    const { id } = req.params as z.infer<typeof idParams>;
    const input = req.body as Partial<z.infer<typeof taskBodySchema>>;
    const existing = await prisma.task.findUniqueOrThrow({ where: { id } });

    const isPrivileged = ["admin", "manager", "supervisor"].includes(req.user!.role);
    const isAssignee = existing.assigneeId === req.user!.employeeId;
    if (!isPrivileged && !isAssignee) {
      throw new ApiError(403, "FORBIDDEN", "You can only update tasks assigned to you");
    }
    // Assignees cannot reassign or move tasks between projects
    if (!isPrivileged && (input.assigneeId || input.projectId)) {
      throw new ApiError(
        403,
        "FORBIDDEN",
        "Only managers can reassign tasks or move them between projects",
      );
    }

    const task = await prisma.task.update({
      where: { id },
      data: input,
      include: { project: true, assignee: true },
    });
    await audit(req, "task.update", `task:${id}`);
    ok(res, serializeTask(task));
  }),
);

// ── Update Task Status (assignee or manager) ───────────────────────────────
tasksRouter.patch(
  "/:id/status",
  validate({ params: idParams, body: statusBodySchema }),
  asyncHandler(async (req, res) => {
    const { id } = req.params as z.infer<typeof idParams>;
    const { status } = req.body as z.infer<typeof statusBodySchema>;
    const existing = await prisma.task.findUniqueOrThrow({ where: { id } });

    const isPrivileged = ["admin", "manager", "supervisor"].includes(req.user!.role);
    if (!isPrivileged && existing.assigneeId !== req.user!.employeeId) {
      throw new ApiError(403, "FORBIDDEN", "You can only update the status of your own tasks");
    }

    const task = await prisma.task.update({
      where: { id },
      data: { status },
      include: { project: true, assignee: true },
    });
    await audit(req, "task.status_change", `task:${id}`, {
      from: existing.status,
      to: status,
    });
    ok(res, serializeTask(task));
  }),
);

// ── Delete Task ────────────────────────────────────────────────────────────
tasksRouter.delete(
  "/:id",
  authorize("admin", "manager"),
  validate({ params: idParams }),
  asyncHandler(async (req, res) => {
    const { id } = req.params as z.infer<typeof idParams>;
    await prisma.task.delete({ where: { id } });
    await audit(req, "task.delete", `task:${id}`);
    ok(res, { success: true });
  }),
);
