import type { Role } from "@prisma/client";

export interface AuthenticatedUser {
  id: string;
  employeeId: string;
  email: string;
  name: string;
  role: Role;
}

export interface JwtPayload {
  sub: string;
  employeeId: string;
  email: string;
  name: string;
  role: Role;
  tokenType: "access" | "refresh";
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      requestId?: string;
    }
  }
}

export {};
