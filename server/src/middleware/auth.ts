import type { NextFunction, Request, Response } from "express";
import type { Role } from "@prisma/client";
import { ApiError } from "./error.js";
import { verifyAccessToken } from "../utils/crypto.js";

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (!token) {
    return next(new ApiError(401, "UNAUTHORIZED", "Authentication token is required"));
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      employeeId: payload.employeeId,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    };
    return next();
  } catch {
    return next(new ApiError(401, "UNAUTHORIZED", "Invalid or expired authentication token"));
  }
}

export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new ApiError(401, "UNAUTHORIZED", "Authentication is required"));
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, "FORBIDDEN", "You do not have permission to perform this action"));
    }
    return next();
  };
}

export function requireSelfOrRoles(employeeId: string, req: Request, roles: Role[]) {
  if (!req.user) throw new ApiError(401, "UNAUTHORIZED", "Authentication is required");
  if (req.user.employeeId === employeeId || roles.includes(req.user.role)) return;
  throw new ApiError(403, "FORBIDDEN", "You can only access your own records");
}
