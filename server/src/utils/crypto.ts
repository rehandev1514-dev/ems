import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../config.js";
import type { JwtPayload } from "../types.js";

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function createOpaqueToken() {
  return crypto.randomBytes(48).toString("base64url");
}

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function signAccessToken(payload: Omit<JwtPayload, "tokenType">) {
  return jwt.sign({ ...payload, tokenType: "access" }, config.JWT_ACCESS_SECRET, {
    expiresIn: config.ACCESS_TOKEN_TTL as jwt.SignOptions["expiresIn"],
  });
}

export function signRefreshJwt(payload: Omit<JwtPayload, "tokenType">) {
  return jwt.sign({ ...payload, tokenType: "refresh" }, config.JWT_REFRESH_SECRET, {
    expiresIn: `${config.REFRESH_TOKEN_TTL_DAYS}d`,
  });
}

export function verifyAccessToken(token: string) {
  const payload = jwt.verify(token, config.JWT_ACCESS_SECRET) as JwtPayload;
  if (payload.tokenType !== "access") throw new Error("Invalid token type");
  return payload;
}

export function verifyRefreshJwt(token: string) {
  const payload = jwt.verify(token, config.JWT_REFRESH_SECRET) as JwtPayload;
  if (payload.tokenType !== "refresh") throw new Error("Invalid token type");
  return payload;
}
