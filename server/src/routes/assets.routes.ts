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
import { serializeAsset } from "../utils/serializers.js";

export const assetsRouter = Router();

const idParams = z.object({ id: z.string().min(1) });
const assetCategorySchema = z.enum([
  "laptop",
  "monitor",
  "keyboard",
  "mouse",
  "headset",
  "furniture",
  "other",
]);
const assetStatusSchema = z.enum(["available", "assigned", "maintenance", "retired"]);

const assetsQuerySchema = paginationQuerySchema.extend({
  status: assetStatusSchema.optional(),
  category: assetCategorySchema.optional(),
  assignedTo: z.string().optional(),
});

const assetBodySchema = z.object({
  tag: z.string().min(1).max(60),
  name: z.string().min(2).max(200),
  category: assetCategorySchema,
  serial: z.string().min(1).max(100).optional().nullable(),
  status: assetStatusSchema.default("available"),
  assignedTo: z.string().min(1).optional().nullable(),
  purchaseDate: z.coerce.date(),
  value: z.coerce.number().nonnegative(),
});

const assignBodySchema = z.object({ employeeId: z.string().min(1) });

assetsRouter.use(authenticate);

// ── List Assets ────────────────────────────────────────────────────────────
assetsRouter.get(
  "/",
  validate({ query: assetsQuerySchema }),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as z.infer<typeof assetsQuerySchema>;
    const { skip, take } = getPagination(query);
    const where: Prisma.AssetWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.category ? { category: query.category } : {}),
      ...(query.assignedTo ? { assignedTo: query.assignedTo } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: "insensitive" } },
              { tag: { contains: query.search, mode: "insensitive" } },
              { serial: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };
    const [total, assets] = await prisma.$transaction([
      prisma.asset.count({ where }),
      prisma.asset.findMany({
        where,
        include: { assignee: true },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
    ]);
    ok(res, assets.map(serializeAsset), pageMeta(total, query));
  }),
);

// ── Get Single Asset ───────────────────────────────────────────────────────
assetsRouter.get(
  "/:id",
  validate({ params: idParams }),
  asyncHandler(async (req, res) => {
    const { id } = req.params as z.infer<typeof idParams>;
    const asset = await prisma.asset.findUniqueOrThrow({
      where: { id },
      include: { assignee: true },
    });
    ok(res, serializeAsset(asset));
  }),
);

// ── Create Asset ───────────────────────────────────────────────────────────
assetsRouter.post(
  "/",
  authorize("admin", "manager"),
  validate({ body: assetBodySchema }),
  asyncHandler(async (req, res) => {
    const input = req.body as z.infer<typeof assetBodySchema>;
    const asset = await prisma.asset.create({
      data: {
        tag: input.tag,
        name: input.name,
        category: input.category,
        serial: input.serial ?? undefined,
        status: input.status,
        assignedTo: input.assignedTo ?? undefined,
        purchaseDate: input.purchaseDate,
        value: input.value,
      },
      include: { assignee: true },
    });
    await audit(req, "asset.create", `asset:${asset.id}`);
    created(res, serializeAsset(asset));
  }),
);

// ── Update Asset ───────────────────────────────────────────────────────────
assetsRouter.patch(
  "/:id",
  authorize("admin", "manager"),
  validate({ params: idParams, body: assetBodySchema.partial() }),
  asyncHandler(async (req, res) => {
    const { id } = req.params as z.infer<typeof idParams>;
    const input = req.body as Partial<z.infer<typeof assetBodySchema>>;
    const asset = await prisma.asset.update({
      where: { id },
      data: {
        ...input,
        // Treat null/undefined consistently for optional DB fields
        serial: "serial" in input ? (input.serial ?? null) : undefined,
        assignedTo: "assignedTo" in input ? (input.assignedTo ?? null) : undefined,
      },
      include: { assignee: true },
    });
    await audit(req, "asset.update", `asset:${id}`);
    ok(res, serializeAsset(asset));
  }),
);

// ── Delete Asset ───────────────────────────────────────────────────────────
assetsRouter.delete(
  "/:id",
  authorize("admin"),
  validate({ params: idParams }),
  asyncHandler(async (req, res) => {
    const { id } = req.params as z.infer<typeof idParams>;
    const asset = await prisma.asset.findUniqueOrThrow({ where: { id } });
    if (asset.status === "assigned") {
      throw new ApiError(409, "ASSET_ASSIGNED", "Unassign the asset before deleting it");
    }
    await prisma.asset.delete({ where: { id } });
    await audit(req, "asset.delete", `asset:${id}`);
    ok(res, { success: true });
  }),
);

// ── Assign Asset to Employee ───────────────────────────────────────────────
assetsRouter.post(
  "/:id/assign",
  authorize("admin", "manager"),
  validate({ params: idParams, body: assignBodySchema }),
  asyncHandler(async (req, res) => {
    const { id } = req.params as z.infer<typeof idParams>;
    const { employeeId } = req.body as z.infer<typeof assignBodySchema>;
    const current = await prisma.asset.findUniqueOrThrow({ where: { id } });
    if (current.status === "assigned") {
      throw new ApiError(
        409,
        "ASSET_ALREADY_ASSIGNED",
        "Asset is already assigned — unassign it first",
      );
    }
    const asset = await prisma.asset.update({
      where: { id },
      data: { assignedTo: employeeId, status: "assigned" },
      include: { assignee: true },
    });
    await audit(req, "asset.assign", `asset:${id}`, { employeeId });
    ok(res, serializeAsset(asset));
  }),
);

// ── Unassign Asset ─────────────────────────────────────────────────────────
assetsRouter.post(
  "/:id/unassign",
  authorize("admin", "manager"),
  validate({ params: idParams }),
  asyncHandler(async (req, res) => {
    const { id } = req.params as z.infer<typeof idParams>;
    const current = await prisma.asset.findUniqueOrThrow({ where: { id } });
    if (current.status !== "assigned") {
      throw new ApiError(400, "ASSET_NOT_ASSIGNED", "Asset is not currently assigned to anyone");
    }
    const asset = await prisma.asset.update({
      where: { id },
      data: { assignedTo: null, status: "available" },
      include: { assignee: true },
    });
    await audit(req, "asset.unassign", `asset:${id}`);
    ok(res, serializeAsset(asset));
  }),
);
