import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ok } from "../utils/api-response.js";
import { audit } from "../utils/audit.js";

export const settingsRouter = Router();

const settingsBodySchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(5).optional(),
  address: z.string().min(5).optional(),
  timezone: z.string().min(2).optional(),
  workStart: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  workEnd: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  lateAfter: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
});

settingsRouter.use(authenticate);

settingsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    let settings = await prisma.companySettings.findFirst();

    // Auto-initialize if not exists
    if (!settings) {
      settings = await prisma.companySettings.create({
        data: {},
      });
    }

    ok(res, settings);
  }),
);

settingsRouter.patch(
  "/",
  authorize("admin"),
  validate({ body: settingsBodySchema }),
  asyncHandler(async (req, res) => {
    const input = req.body as z.infer<typeof settingsBodySchema>;

    let settings = await prisma.companySettings.findFirst();
    if (!settings) {
      settings = await prisma.companySettings.create({ data: input });
    } else {
      settings = await prisma.companySettings.update({
        where: { id: settings.id },
        data: input,
      });
    }

    await audit(req, "settings.update", "company");
    ok(res, settings);
  }),
);
