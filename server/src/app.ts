import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { config } from "./config.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import { authRouter } from "./routes/auth.routes.js";
import { employeesRouter } from "./routes/employees.routes.js";
import { departmentsRouter } from "./routes/departments.routes.js";
import { attendanceRouter } from "./routes/attendance.routes.js";
import { leavesRouter } from "./routes/leaves.routes.js";
import { projectsRouter } from "./routes/projects.routes.js";
import { tasksRouter } from "./routes/tasks.routes.js";
import { assetsRouter } from "./routes/assets.routes.js";
import { documentsRouter } from "./routes/documents.routes.js";
import { notificationsRouter } from "./routes/notifications.routes.js";
import { auditLogsRouter } from "./routes/audit-logs.routes.js";
import { reportsRouter } from "./routes/reports.routes.js";
import { settingsRouter } from "./routes/settings.routes.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: config.CORS_ORIGIN, credentials: true }));
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 300,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan("dev"));

  app.get("/health", (_req, res) => res.json({ status: "ok", service: "vertex-ems-server" }));
  app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "vertex-ems-server" }));

  app.use("/api/auth", authRouter);
  app.use("/api/employees", employeesRouter);
  app.use("/api/departments", departmentsRouter);
  app.use("/api/attendance", attendanceRouter);
  app.use("/api/leaves", leavesRouter);
  app.use("/api/projects", projectsRouter);
  app.use("/api/tasks", tasksRouter);
  app.use("/api/assets", assetsRouter);
  app.use("/api/documents", documentsRouter);
  app.use("/api/notifications", notificationsRouter);
  app.use("/api/audit-logs", auditLogsRouter);
  app.use("/api/reports", reportsRouter);
  app.use("/api/settings", settingsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
