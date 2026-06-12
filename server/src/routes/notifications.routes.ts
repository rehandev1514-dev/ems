import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { authenticate } from "../middleware/auth.js";
import { ApiError } from "../middleware/error.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ok } from "../utils/api-response.js";
import { getPagination, pageMeta, paginationQuerySchema } from "../utils/pagination.js";
import { serializeNotificationRecipient } from "../utils/serializers.js";

export const notificationsRouter = Router();

const idParams = z.object({ id: z.string().min(1) });

const notificationsQuerySchema = paginationQuerySchema.extend({
  // Accepts "true"/"false" query string values; any truthy string except "false"
  unread: z
    .string()
    .optional()
    .transform((v) => (v === undefined ? undefined : v !== "false" && v !== "0")),
});

notificationsRouter.use(authenticate);

// ── List My Notifications ──────────────────────────────────────────────────
notificationsRouter.get(
  "/",
  validate({ query: notificationsQuerySchema }),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as z.infer<typeof notificationsQuerySchema>;
    const { skip, take } = getPagination(query);

    const where = {
      employeeId: req.user!.employeeId,
      ...(query.unread === true ? { readAt: null } : {}),
    };

    const [total, recipients] = await prisma.$transaction([
      prisma.notificationRecipient.count({ where }),
      prisma.notificationRecipient.findMany({
        where,
        include: { notification: true },
        orderBy: { notification: { createdAt: "desc" } },
        skip,
        take,
      }),
    ]);

    ok(res, recipients.map(serializeNotificationRecipient), pageMeta(total, query));
  }),
);

// ── Unread Count ───────────────────────────────────────────────────────────
notificationsRouter.get(
  "/unread-count",
  asyncHandler(async (req, res) => {
    const count = await prisma.notificationRecipient.count({
      where: { employeeId: req.user!.employeeId, readAt: null },
    });
    ok(res, { count });
  }),
);

// ── Mark Single Notification Read ──────────────────────────────────────────
// Route: PATCH /notifications/:id/read  (id = notificationId, not recipientId)
notificationsRouter.patch(
  "/:id/read",
  validate({ params: idParams }),
  asyncHandler(async (req, res) => {
    const { id } = req.params as z.infer<typeof idParams>;

    const recipient = await prisma.notificationRecipient.findFirst({
      where: { notificationId: id, employeeId: req.user!.employeeId },
    });
    if (!recipient) {
      throw new ApiError(404, "NOT_FOUND", "Notification not found");
    }
    if (recipient.readAt) {
      // Already read — return current state without another write
      const existing = await prisma.notificationRecipient.findUnique({
        where: { id: recipient.id },
        include: { notification: true },
      });
      return ok(res, serializeNotificationRecipient(existing!));
    }

    const updated = await prisma.notificationRecipient.update({
      where: { id: recipient.id },
      data: { readAt: new Date() },
      include: { notification: true },
    });
    ok(res, serializeNotificationRecipient(updated));
  }),
);

// ── Mark All Notifications Read ────────────────────────────────────────────
notificationsRouter.patch(
  "/read-all",
  asyncHandler(async (req, res) => {
    const { count } = await prisma.notificationRecipient.updateMany({
      where: { employeeId: req.user!.employeeId, readAt: null },
      data: { readAt: new Date() },
    });
    ok(res, { success: true, updated: count });
  }),
);
