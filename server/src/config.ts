import "dotenv/config";
import { z } from "zod";

// Fallback DIRECT_URL to DATABASE_URL if missing to prevent startup failures on single-URL setups
if (process.env.DATABASE_URL && !process.env.DIRECT_URL) {
  process.env.DIRECT_URL = process.env.DATABASE_URL;
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  ACCESS_TOKEN_TTL: z.string().default("15m"),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  UPLOAD_DIR: z.string().default("uploads"),
  DEFAULT_EMPLOYEE_PASSWORD: z.string().min(8).default("demo1234"),
  SUPABASE_URL: z.string().optional().default(""),
  SUPABASE_ANON_KEY: z.string().optional().default(""),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().default(""),
  // Work policy defaults — overridable via CompanySettings in DB
  LATE_AFTER: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .default("09:15"),
});

let parsedEnv;
try {
  parsedEnv = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error("❌ Invalid or missing environment variables:");
    for (const issue of error.issues) {
      console.error(`   - ${issue.path.join(".")}: ${issue.message}`);
    }
  } else {
    console.error("❌ Failed to parse environment variables:", error);
  }
  process.exit(1);
}

export const config = parsedEnv;

export const isProduction = config.NODE_ENV === "production";
