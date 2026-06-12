import type { Request } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../prisma.js";

export async function audit(
  req: Request,
  action: string,
  target: string,
  metadata?: Prisma.InputJsonValue,
) {
  await prisma.auditLog.create({
    data: {
      actorId: req.user?.employeeId,
      actorName: req.user?.name ?? "System",
      action,
      target,
      metadata,
      ip: req.ip,
    },
  });
}
