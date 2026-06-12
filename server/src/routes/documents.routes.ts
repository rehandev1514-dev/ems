import path from "node:path";
import fs from "node:fs";
import { Router } from "express";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import multer from "multer";
import { prisma } from "../prisma.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { ApiError } from "../middleware/error.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/async-handler.js";
import { created, ok } from "../utils/api-response.js";
import { audit } from "../utils/audit.js";
import { getPagination, pageMeta, paginationQuerySchema } from "../utils/pagination.js";
import { serializeDocument } from "../utils/serializers.js";
import { config } from "../config.js";

export const documentsRouter = Router();

const UPLOAD_DIR = path.resolve(config.UPLOAD_DIR);
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

// Ensure upload directory exists at startup
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const multerStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage: multerStorage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new ApiError(
          415,
          "UNSUPPORTED_MEDIA_TYPE",
          "Only PDF, JPEG, PNG, WEBP, DOC, and DOCX files are permitted",
        ),
      );
    }
  },
});

const idParams = z.object({ id: z.string().min(1) });
const documentTypeSchema = z.enum(["contract", "certificate", "id", "offer_letter", "other"]);

const documentsQuerySchema = paginationQuerySchema.extend({
  employeeId: z.string().optional(),
  type: documentTypeSchema.optional(),
});

// Metadata arrives as multipart form fields alongside the binary file
const documentMetaSchema = z.object({
  name: z.string().min(2).max(200),
  type: documentTypeSchema,
  employeeId: z.string().min(1),
});

documentsRouter.use(authenticate);

// ── List Documents ─────────────────────────────────────────────────────────
documentsRouter.get(
  "/",
  validate({ query: documentsQuerySchema }),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as z.infer<typeof documentsQuerySchema>;
    const { skip, take } = getPagination(query);
    const privileged = ["admin", "manager", "supervisor"].includes(req.user!.role);
    // Non-privileged employees only see their own documents
    const employeeId = privileged ? query.employeeId : req.user!.employeeId;
    const where: Prisma.DocumentItemWhereInput = {
      ...(employeeId ? { employeeId } : {}),
      ...(query.type ? { type: query.type } : {}),
      ...(query.search ? { name: { contains: query.search, mode: "insensitive" } } : {}),
    };
    const [total, documents] = await prisma.$transaction([
      prisma.documentItem.count({ where }),
      prisma.documentItem.findMany({
        where,
        include: { employee: true, uploadedBy: true },
        orderBy: { uploadedAt: "desc" },
        skip,
        take,
      }),
    ]);
    ok(res, documents.map(serializeDocument), pageMeta(total, query));
  }),
);

// ── Upload Document ────────────────────────────────────────────────────────
documentsRouter.post(
  "/",
  authorize("admin", "manager", "supervisor"),
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new ApiError(400, "FILE_REQUIRED", "A file must be attached under the 'file' field");
    }
    // Parse and validate form-text metadata fields
    const meta = documentMetaSchema.parse(req.body);
    const sizeKb = Math.ceil(req.file.size / 1024);

    const document = await prisma.documentItem.create({
      data: {
        name: meta.name,
        type: meta.type,
        employeeId: meta.employeeId,
        uploadedById: req.user!.employeeId,
        storageKey: req.file.filename,
        mimeType: req.file.mimetype,
        sizeKb,
      },
      include: { employee: true, uploadedBy: true },
    });
    await audit(req, "document.upload", `document:${document.id}`, { sizeKb });
    created(res, serializeDocument(document));
  }),
);

// ── Download Document ──────────────────────────────────────────────────────
documentsRouter.get(
  "/:id/download",
  validate({ params: idParams }),
  asyncHandler(async (req, res) => {
    const { id } = req.params as z.infer<typeof idParams>;
    const document = await prisma.documentItem.findUniqueOrThrow({ where: { id } });

    const isOwner = document.employeeId === req.user!.employeeId;
    const isPrivileged = ["admin", "manager", "supervisor"].includes(req.user!.role);
    if (!isOwner && !isPrivileged) {
      throw new ApiError(403, "FORBIDDEN", "You do not have access to this document");
    }

    const filePath = path.join(UPLOAD_DIR, document.storageKey);
    if (!fs.existsSync(filePath)) {
      throw new ApiError(404, "FILE_NOT_FOUND", "The file could not be found in storage");
    }

    res.download(filePath, document.name);
  }),
);

// ── Delete Document ────────────────────────────────────────────────────────
documentsRouter.delete(
  "/:id",
  authorize("admin", "manager"),
  validate({ params: idParams }),
  asyncHandler(async (req, res) => {
    const { id } = req.params as z.infer<typeof idParams>;
    const document = await prisma.documentItem.findUniqueOrThrow({ where: { id } });
    const filePath = path.join(UPLOAD_DIR, document.storageKey);

    // Delete DB record first, then attempt file removal (best-effort)
    await prisma.documentItem.delete({ where: { id } });
    fs.unlink(filePath, (err) => {
      if (err) console.warn(`Document file not found for cleanup: ${filePath}`);
    });

    await audit(req, "document.delete", `document:${id}`);
    ok(res, { success: true });
  }),
);
