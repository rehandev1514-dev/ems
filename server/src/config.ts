import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  ACCESS_TOKEN_TTL: z.string().default("15m"),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  UPLOAD_DIR: z.string().default("uploads"),
  DEFAULT_EMPLOYEE_PASSWORD: z.string().min(8).default("demo1234"),
  // Work policy defaults — overridable via CompanySettings in DB
  LATE_AFTER: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .default("09:15"),
});

export const config = envSchema.parse(process.env);

export const isProduction = config.NODE_ENV === "production";
