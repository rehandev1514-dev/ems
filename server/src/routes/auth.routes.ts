import { Router } from "express";
import { z } from "zod";
import { Role } from "@prisma/client";
import { prisma } from "../prisma.js";
import { authenticate } from "../middleware/auth.js";
import { ApiError } from "../middleware/error.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../utils/async-handler.js";
import { created, ok } from "../utils/api-response.js";
import { audit } from "../utils/audit.js";
import {
  createOpaqueToken,
  hashPassword,
  hashToken,
  signAccessToken,
  signRefreshJwt,
  verifyPassword,
  verifyRefreshJwt,
} from "../utils/crypto.js";
import { config } from "../config.js";
import { serializeEmployee } from "../utils/serializers.js";

export const authRouter = Router();

const roleSchema = z.enum(["employee", "manager", "supervisor", "accountant"]);
const genderSchema = z.enum(["male", "female", "other"]);

const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
  remember: z.boolean().optional(),
});

const registerSchema = z.object({
  fullName: z.string().min(2).max(120),
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).max(128),
  departmentId: z.string().uuid().or(z.string().startsWith("d")).optional(),
  designation: z.string().min(2).max(120),
  role: roleSchema.default("employee"),
  phone: z.string().min(5).max(40).default("Not provided"),
  cnic: z.string().min(5).max(40).optional(),
  address: z.string().min(2).max(240).default("Not provided"),
  gender: genderSchema.default("other"),
  dob: z.coerce.date().default(() => new Date("1995-01-01T00:00:00.000Z")),
  joiningDate: z.coerce.date().default(() => new Date()),
  salary: z.coerce.number().nonnegative().default(0),
});

const refreshSchema = z.object({ refreshToken: z.string().min(20) });
const forgotSchema = z.object({ email: z.string().email().toLowerCase() });
const resetSchema = z.object({ token: z.string().min(20), password: z.string().min(8).max(128) });
const verifyEmailSchema = z.object({ token: z.string().min(20) });
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

function addDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

function sessionUser(employee: {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  status?: string;
}) {
  return {
    id: employee.id,
    employeeId: employee.id,
    name: employee.fullName,
    email: employee.email,
    role: employee.role,
    status: employee.status,
  };
}

async function createSession(
  employee: { id: string; fullName: string; email: string; role: Role },
  req: Parameters<typeof audit>[0],
) {
  const tokenPayload = {
    sub: employee.id,
    employeeId: employee.id,
    email: employee.email,
    name: employee.fullName,
    role: employee.role,
  };
  const accessToken = signAccessToken(tokenPayload);
  const refreshToken = signRefreshJwt(tokenPayload);

  await prisma.refreshToken.create({
    data: {
      employeeId: employee.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: addDays(config.REFRESH_TOKEN_TTL_DAYS),
      ip: req.ip,
      userAgent: req.get("user-agent"),
    },
  });

  return { user: sessionUser(employee), accessToken, refreshToken };
}

async function generateEmployeeCode() {
  const total = await prisma.employee.count();
  for (let next = total + 101; next < total + 1000; next += 1) {
    const employeeCode = `CVS-${String(next).padStart(3, "0")}`;
    const exists = await prisma.employee.findUnique({ where: { employeeCode } });
    if (!exists) return employeeCode;
  }
  return `CVS-${Date.now()}`;
}

async function issueAuthToken(
  employeeId: string,
  type: "password_reset" | "email_verification",
  ttlMinutes: number,
) {
  const token = createOpaqueToken();
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
  await prisma.authToken.create({
    data: { employeeId, type, tokenHash: hashToken(token), expiresAt },
  });
  return token;
}

authRouter.post(
  "/login",
  validate({ body: loginSchema }),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body as z.infer<typeof loginSchema>;
    const employee = await prisma.employee.findUnique({
      where: { email },
      include: { credential: true },
    });

    if (!employee?.credential)
      throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password");
    if (employee.credential.disabledAt || employee.status === "terminated") {
      throw new ApiError(403, "ACCOUNT_DISABLED", "This account is disabled or terminated");
    }

    const passwordOk = await verifyPassword(password, employee.credential.passwordHash);
    if (!passwordOk) throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password");

    await prisma.userCredential.update({
      where: { employeeId: employee.id },
      data: { lastLoginAt: new Date() },
    });
    const session = await createSession(employee, req);
    req.user = session.user;
    await audit(req, "auth.login", `employee:${employee.id}`);
    ok(res, session);
  }),
);

authRouter.post(
  "/register",
  validate({ body: registerSchema }),
  asyncHandler(async (req, res) => {
    const input = req.body as z.infer<typeof registerSchema>;
    const existing = await prisma.employee.findUnique({ where: { email: input.email } });
    if (existing)
      throw new ApiError(409, "EMAIL_EXISTS", "An employee with this email already exists");

    const passwordHash = await hashPassword(input.password);
    const employeeCode = await generateEmployeeCode();
    const employee = await prisma.employee.create({
      data: {
        employeeCode,
        fullName: input.fullName,
        email: input.email,
        phone: input.phone,
        cnic: input.cnic,
        address: input.address,
        gender: input.gender,
        dob: input.dob,
        departmentId: input.departmentId,
        designation: input.designation,
        joiningDate: input.joiningDate,
        status: "pending",
        salary: input.salary,
        role: input.role,
        credential: { create: { passwordHash } },
        notificationPreferences: { create: {} },
      },
    });

    const emailVerificationToken = await issueAuthToken(employee.id, "email_verification", 60 * 24);
    const session = await createSession(employee, req);
    req.user = session.user;
    await audit(req, "auth.register", `employee:${employee.id}`, { status: "pending" });
    created(res, {
      ...session,
      user: { ...session.user, isPending: true },
      emailVerificationToken,
    });
  }),
);

authRouter.post(
  "/refresh",
  validate({ body: refreshSchema }),
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body as z.infer<typeof refreshSchema>;
    const payload = verifyRefreshJwt(refreshToken);
    const stored = await prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(refreshToken) },
      include: { employee: true },
    });

    if (
      !stored ||
      stored.revokedAt ||
      stored.expiresAt < new Date() ||
      stored.employeeId !== payload.employeeId
    ) {
      throw new ApiError(401, "INVALID_REFRESH_TOKEN", "Refresh token is invalid or expired");
    }
    if (stored.employee.status === "terminated")
      throw new ApiError(403, "ACCOUNT_DISABLED", "This account is terminated");

    const session = await createSession(stored.employee, req);
    const replacement = await prisma.refreshToken.findUnique({
      where: { tokenHash: hashToken(session.refreshToken) },
    });
    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date(), replacedByTokenId: replacement?.id },
    });
    ok(res, session);
  }),
);

authRouter.post(
  "/logout",
  validate({ body: refreshSchema.partial() }),
  asyncHandler(async (req, res) => {
    const refreshToken = (req.body as Partial<z.infer<typeof refreshSchema>>).refreshToken;
    if (refreshToken) {
      await prisma.refreshToken.updateMany({
        where: { tokenHash: hashToken(refreshToken), revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    ok(res, { success: true });
  }),
);

authRouter.get(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    const employee = await prisma.employee.findUniqueOrThrow({
      where: { id: req.user!.employeeId },
      include: { department: true },
    });
    ok(res, { user: sessionUser(employee), employee: serializeEmployee(employee) });
  }),
);

authRouter.post(
  "/forgot-password",
  validate({ body: forgotSchema }),
  asyncHandler(async (req, res) => {
    const { email } = req.body as z.infer<typeof forgotSchema>;
    const employee = await prisma.employee.findUnique({ where: { email } });
    const resetToken = employee
      ? await issueAuthToken(employee.id, "password_reset", 30)
      : undefined;
    ok(res, { sent: true, ...(resetToken ? { resetToken } : {}) });
  }),
);

authRouter.post(
  "/reset-password",
  validate({ body: resetSchema }),
  asyncHandler(async (req, res) => {
    const { token, password } = req.body as z.infer<typeof resetSchema>;
    const stored = await prisma.authToken.findUnique({ where: { tokenHash: hashToken(token) } });
    if (
      !stored ||
      stored.type !== "password_reset" ||
      stored.consumedAt ||
      stored.expiresAt < new Date()
    ) {
      throw new ApiError(400, "INVALID_TOKEN", "Password reset token is invalid or expired");
    }

    await prisma.$transaction([
      prisma.userCredential.update({
        where: { employeeId: stored.employeeId },
        data: { passwordHash: await hashPassword(password) },
      }),
      prisma.authToken.update({ where: { id: stored.id }, data: { consumedAt: new Date() } }),
      prisma.refreshToken.updateMany({
        where: { employeeId: stored.employeeId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
    ok(res, { success: true });
  }),
);

authRouter.post(
  "/verify-email",
  validate({ body: verifyEmailSchema }),
  asyncHandler(async (req, res) => {
    const { token } = req.body as z.infer<typeof verifyEmailSchema>;
    const stored = await prisma.authToken.findUnique({ where: { tokenHash: hashToken(token) } });
    if (
      !stored ||
      stored.type !== "email_verification" ||
      stored.consumedAt ||
      stored.expiresAt < new Date()
    ) {
      throw new ApiError(400, "INVALID_TOKEN", "Email verification token is invalid or expired");
    }

    await prisma.$transaction([
      prisma.userCredential.update({
        where: { employeeId: stored.employeeId },
        data: { emailVerifiedAt: new Date() },
      }),
      prisma.authToken.update({ where: { id: stored.id }, data: { consumedAt: new Date() } }),
    ]);
    ok(res, { success: true });
  }),
);

authRouter.post(
  "/change-password",
  authenticate,
  validate({ body: changePasswordSchema }),
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body as z.infer<typeof changePasswordSchema>;
    const credential = await prisma.userCredential.findUniqueOrThrow({
      where: { employeeId: req.user!.employeeId },
    });
    const passwordOk = await verifyPassword(currentPassword, credential.passwordHash);
    if (!passwordOk)
      throw new ApiError(401, "INVALID_CREDENTIALS", "Current password is incorrect");

    await prisma.$transaction([
      prisma.userCredential.update({
        where: { employeeId: req.user!.employeeId },
        data: { passwordHash: await hashPassword(newPassword) },
      }),
      prisma.refreshToken.updateMany({
        where: { employeeId: req.user!.employeeId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
    await audit(req, "auth.change_password", `employee:${req.user!.employeeId}`);
    ok(res, { success: true });
  }),
);

authRouter.post(
  "/revoke-sessions",
  authenticate,
  asyncHandler(async (req, res) => {
    await prisma.refreshToken.updateMany({
      where: { employeeId: req.user!.employeeId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await audit(req, "auth.revoke_sessions", `employee:${req.user!.employeeId}`);
    ok(res, { success: true });
  }),
);
