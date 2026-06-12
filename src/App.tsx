import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router";
import { Loader2 } from "lucide-react";
import { AppLayout } from "./routes/AppLayout";
import { AuthGuard } from "./routes/AuthGuard";

// Auth pages (small, eager load)
import { LoginPage } from "./routes/auth/LoginPage";
import { SignupPage } from "./routes/auth/SignupPage";
import { ForgotPage } from "./routes/auth/ForgotPage";

// App pages (lazy loaded)
const Dashboard = lazy(() =>
  import("./routes/app/Dashboard").then((m) => ({ default: m.Dashboard })),
);
const Employees = lazy(() =>
  import("./routes/app/Employees").then((m) => ({ default: m.EmployeesPage })),
);
const EmployeeDetail = lazy(() =>
  import("./routes/app/EmployeeDetail").then((m) => ({ default: m.EmployeeProfile })),
);
const Attendance = lazy(() =>
  import("./routes/app/Attendance").then((m) => ({ default: m.AttendancePage })),
);
const Leaves = lazy(() => import("./routes/app/Leaves").then((m) => ({ default: m.LeavesPage })));
const Documents = lazy(() =>
  import("./routes/app/Documents").then((m) => ({ default: m.DocumentsPage })),
);
const Assets = lazy(() => import("./routes/app/Assets").then((m) => ({ default: m.AssetsPage })));
const Projects = lazy(() =>
  import("./routes/app/Projects").then((m) => ({ default: m.ProjectsPage })),
);
const Tasks = lazy(() => import("./routes/app/Tasks").then((m) => ({ default: m.TasksPage })));
const Departments = lazy(() =>
  import("./routes/app/Departments").then((m) => ({ default: m.DepartmentsPage })),
);
const Reports = lazy(() =>
  import("./routes/app/Reports").then((m) => ({ default: m.ReportsPage })),
);
const AuditLogs = lazy(() =>
  import("./routes/app/AuditLogs").then((m) => ({ default: m.AuditLogsPage })),
);
const Notifications = lazy(() =>
  import("./routes/app/Notifications").then((m) => ({ default: m.NotificationsPage })),
);
const Settings = lazy(() =>
  import("./routes/app/Settings").then((m) => ({ default: m.SettingsPage })),
);

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="size-8 animate-spin text-primary" />
    </div>
  );
}

export function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Redirect root to auth */}
        <Route path="/" element={<Navigate to="/auth" replace />} />

        {/* Auth routes */}
        <Route path="/auth" element={<LoginPage />} />
        <Route path="/auth/signup" element={<SignupPage />} />
        <Route path="/auth/forgot" element={<ForgotPage />} />

        {/* Protected app routes */}
        <Route element={<AuthGuard />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/employees/:id" element={<EmployeeDetail />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/leaves" element={<Leaves />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/assets" element={<Assets />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/departments" element={<Departments />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/audit-logs" element={<AuditLogs />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </Suspense>
  );
}
