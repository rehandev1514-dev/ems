import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-store";
import {
  LayoutDashboard, Users, Building2, CalendarCheck, Plane, FolderKanban, ListChecks,
  Boxes, FileText, Bell, BarChart3, Settings, ScrollText, LogOut, ChevronRight, Hexagon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/mock-data";

const nav: Array<{ to: string; label: string; icon: typeof LayoutDashboard; roles: Role[] }> = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "employee", "hr", "manager", "supervisor", "accountant"] },
  { to: "/employees", label: "Employees", icon: Users, roles: ["admin", "hr", "manager"] },
  { to: "/departments", label: "Departments", icon: Building2, roles: ["admin", "hr"] },
  { to: "/attendance", label: "Attendance", icon: CalendarCheck, roles: ["admin", "employee", "hr", "manager", "supervisor"] },
  { to: "/leaves", label: "Leaves", icon: Plane, roles: ["admin", "employee", "hr", "manager", "supervisor"] },
  { to: "/projects", label: "Projects", icon: FolderKanban, roles: ["admin", "employee", "manager", "supervisor"] },
  { to: "/tasks", label: "Tasks", icon: ListChecks, roles: ["admin", "employee", "manager", "supervisor"] },
  { to: "/assets", label: "Assets", icon: Boxes, roles: ["admin", "hr", "accountant"] },
  { to: "/documents", label: "Documents", icon: FileText, roles: ["admin", "employee", "hr"] },
  { to: "/notifications", label: "Notifications", icon: Bell, roles: ["admin", "employee", "hr", "manager", "supervisor", "accountant"] },
  { to: "/reports", label: "Reports", icon: BarChart3, roles: ["admin", "hr", "manager", "accountant"] },
  { to: "/audit-logs", label: "Audit Logs", icon: ScrollText, roles: ["admin", "hr", "accountant"] },
  { to: "/settings", label: "Settings", icon: Settings, roles: ["admin", "employee", "hr", "manager", "supervisor", "accountant"] },
];

export function Sidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const navigate = useNavigate();

  if (!user) return null;

  const items = nav.filter((n) => n.roles.includes(user.role));

  return (
    <aside className="hidden md:flex w-64 min-w-[16rem] max-w-[16rem] flex-col border-r border-border bg-sidebar/80 backdrop-blur-xl h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-sidebar-border shrink-0">
        <div className="size-9 rounded-lg gradient-primary flex items-center justify-center shadow-glow shrink-0">
          <Hexagon className="size-5 text-primary-foreground" strokeWidth={2.5} />
        </div>
        <div className="leading-tight min-w-0">
          <div className="text-sm font-semibold tracking-tight truncate">VertexEMS</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground truncate">Code Vertex</div>
        </div>
      </div>

      {/* Nav — scrollable */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4 space-y-0.5">
        <div className="px-2 pb-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Workspace</div>
        {items.map((item) => {
          const active = path === item.to || path.startsWith(item.to + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all",
                active
                  ? "bg-linear-to-r from-primary/15 to-secondary/5 text-foreground shadow-[inset_0_0_0_1px_var(--color-border)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50",
              )}
            >
              <Icon className={cn("size-4 shrink-0", active && "text-primary")} />
              <span className="flex-1 truncate">{item.label}</span>
              {active && <ChevronRight className="size-3.5 text-primary shrink-0" />}
            </Link>
          );
        })}
      </nav>

      {/* Sign out — always visible at bottom */}
      <div className="border-t border-sidebar-border p-3 shrink-0">
        <div className="mb-2 px-3 py-2">
          <div className="text-xs font-medium truncate">{user.name}</div>
          <div className="text-[10px] text-muted-foreground capitalize">{user.role}</div>
        </div>
        <button
          onClick={async () => {
            await logout();
            navigate({ to: "/auth" });
          }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 transition-colors"
        >
          <LogOut className="size-4 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
