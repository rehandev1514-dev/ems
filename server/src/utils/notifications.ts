import type { NotificationKind, Role } from "@prisma/client";
import { prisma } from "../prisma.js";
import { emitToEmployee, emitToRole } from "../realtime.js";
import { serializeNotificationRecipient } from "./serializers.js";

type NotificationInput = {
  title: string;
  body: string;
  kind: NotificationKind;
  employeeIds?: string[];
  roles?: Role[];
};

export async function createNotification(input: NotificationInput) {
  const explicitIds = input.employeeIds ?? [];
  const roleEmployees = input.roles?.length
    ? await prisma.employee.findMany({
        where: { role: { in: input.roles }, status: { not: "terminated" } },
        select: { id: true },
      })
    : [];
  const employeeIds = Array.from(
    new Set([...explicitIds, ...roleEmployees.map((employee) => employee.id)]),
  );

  if (employeeIds.length === 0) return null;

  const notification = await prisma.notification.create({
    data: {
      title: input.title,
      body: input.body,
      kind: input.kind,
      recipients: { create: employeeIds.map((employeeId) => ({ employeeId })) },
    },
    include: { recipients: { include: { notification: true } } },
  });

  for (const recipient of notification.recipients) {
    emitToEmployee(
      recipient.employeeId,
      "notification:new",
      serializeNotificationRecipient(recipient),
    );
  }

  for (const role of input.roles ?? []) {
    emitToRole(role, "notification:new", {
      title: input.title,
      body: input.body,
      kind: input.kind,
    });
  }

  return notification;
}
