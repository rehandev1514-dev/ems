import crypto from "node:crypto";
import { getCookie, setCookie, deleteCookie } from "@tanstack/react-start/server";
import { db } from "./db.server";
import type { SessionUser } from "./auth-store";

const JWT_SECRET = process.env.JWT_SECRET || "cvs-super-secret-key-12345-vertex-ems";
const ACCESS_TOKEN_EXPIRY = 900; // 15 minutes
const REFRESH_TOKEN_EXPIRY = 604800; // 7 days

function base64UrlEncode(str: string | Buffer): string {
  const buf = typeof str === "string" ? Buffer.from(str) : str;
  return buf.toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return Buffer.from(base64, "base64").toString("utf8");
}

export function signJwt(payload: any, expiresInSeconds: number): string {
  const header = { alg: "HS256", typ: "JWT" };
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const fullPayload = { ...payload, exp };
  
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  
  const signature = crypto.createHmac("sha256", JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest();
  const encodedSignature = base64UrlEncode(signature);
  
  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

export function verifyJwt(token: string): any {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    
    const checkSignature = crypto.createHmac("sha256", JWT_SECRET)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest();
    const checkEncodedSignature = base64UrlEncode(checkSignature);
    
    if (encodedSignature !== checkEncodedSignature) {
      return null;
    }
    
    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      return null; // Expired
    }
    
    return payload;
  } catch (e) {
    return null;
  }
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  employeeId: string;
  name: string;
}

export function setAuthCookies(user: SessionUser) {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    employeeId: user.employeeId,
    name: user.name
  };

  const accessToken = signJwt(payload, ACCESS_TOKEN_EXPIRY);
  const refreshToken = signJwt({ userId: user.id }, REFRESH_TOKEN_EXPIRY);

  setCookie("access_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_TOKEN_EXPIRY
  });

  setCookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_TOKEN_EXPIRY
  });
}

export function clearAuthCookies() {
  deleteCookie("access_token");
  deleteCookie("refresh_token");
}

export function getAuthenticatedUser(): SessionUser | null {
  const accessToken = getCookie("access_token");
  if (accessToken) {
    const verified = verifyJwt(accessToken);
    if (verified) {
      return {
        id: verified.userId,
        name: verified.name,
        email: verified.email,
        role: verified.role,
        employeeId: verified.employeeId
      };
    }
  }

  // If access token is missing or expired, try refresh token
  const refreshToken = getCookie("refresh_token");
  if (refreshToken) {
    const verifiedRefresh = verifyJwt(refreshToken);
    if (verifiedRefresh) {
      const employee = db.getEmployees().find(e => e.id === verifiedRefresh.userId || e.email === verifiedRefresh.userId);
      const user = db.getEmployee(verifiedRefresh.userId) || db.getEmployees().find(e => e.id === verifiedRefresh.userId);
      
      if (user) {
        const sessionUser: SessionUser = {
          id: user.id,
          name: user.fullName,
          email: user.email,
          role: user.role,
          employeeId: user.id
        };
        // Re-issue access token cookie
        setAuthCookies(sessionUser);
        return sessionUser;
      }
    }
  }

  return null;
}

export function requireAuth(): SessionUser {
  const user = getAuthenticatedUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export function requireRole(allowedRoles: string[]): SessionUser {
  const user = requireAuth();
  if (!allowedRoles.includes(user.role)) {
    throw new Error("Forbidden: Insufficient permissions");
  }
  return user;
}
