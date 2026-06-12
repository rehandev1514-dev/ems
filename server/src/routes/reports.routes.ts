import { Router } from "express";
import { prisma } from "../prisma.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ok } from "../utils/api-response.js";

export const reportsRouter = Router();

reportsRouter.use(authenticate);
reportsRouter.use(authorize("admin", "manager", "accountant"));

reportsRouter.get(
  "/dashboard",
  asyncHandler(async (req, res) => {
    // A simple aggregated dashboard report example
    const [employeeCount, departmentCount, projectCount, pendingLeaves] = await Promise.all([
      prisma.employee.count({ where: { status: "active" } }),
      prisma.department.count(),
      prisma.project.count({ where: { status: "active" } }),
      prisma.leaveRequest.count({ where: { status: "pending" } }),
    ]);

    ok(res, {
      employees: employeeCount,
      departments: departmentCount,
      activeProjects: projectCount,
      pendingLeaves,
    });
  }),
);
