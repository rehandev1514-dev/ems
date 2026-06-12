import { Router } from "express";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "../prisma.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ok } from "../utils/api-response.js";
import { getPagination, pageMeta, paginationQuerySchema } from "../utils/pagination.js";

export const auditLogsRouter = Router();

const auditLogsQuerySchema = paginationQuerySchema.extend({
  action: z.string().optional(),
  actorId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

auditLogsRouter.use(authenticate);
auditLogsRouter.use(authorize("admin", "manager", "supervisor"));

auditLogsRouter.get(
  "/",
  validate({ query: auditLogsQuerySchema }),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as z.infer<typeof auditLogsQuerySchema>;
    const { skip, take } = getPagination(query);

    const where: Prisma.AuditLogWhereInput = {
      ...(query.search
        ? {
            OR: [
              { action: { contains: query.search, mode: "insensitive" } },
              { target: { contains: query.search, mode: "insensitive" } },
              { actorName: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(query.action ? { action: query.action } : {}),
      ...(query.actorId ? { actorId: query.actorId } : {}),
      ...(query.startDate || query.endDate
        ? {
            timestamp: {
              ...(query.startDate ? { gte: new Date(query.startDate) } : {}),
              ...(query.endDate ? { lte: new Date(query.endDate) } : {}),
            },
          }
        : {}),
    };

    const [total, logs] = await prisma.$transaction([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: "desc" },
        skip,
        take,
      }),
    ]);

    ok(res, logs, pageMeta(total, query));
  }),
);
