import { Link } from "react-router";
import { useAuth } from "@/lib/auth-store";
import { StatCard } from "@/components/ui-ext/stat-card";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/ui-ext/status-badge";
import {
  Users,
  Building2,
  CalendarCheck,
  Plane,
  FolderKanban,
  ListChecks,
  Boxes,
  TrendingUp,
  Plus,
  UserPlus,
  FileBarChart,
  Clock,
  CheckCircle2,
} from "lucide-react";
import {
  employees,
  departments,
  attendance,
  leaveRequests,
  projects,
  tasks,
  assets,
  employeeById,
  projectById,
} from "@/lib/mock-data";
import { formatDate, initials } from "@/lib/format";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { useMemo } from "react";

export function Dashboard() {
  const user = useAuth((s) => s.user)!;
  if (user.role === "employee") return <EmployeeDashboard />;
  return <AdminDashboard />;
}

function AdminDashboard() {
  const user = useAuth((s) => s.user)!;
  const activeEmps = employees.filter((e) => e.status === "active").length;
  const presentToday = attendance.filter(
    (a) => a.date === attendance[0]?.date && a.status === "present",
  ).length;
  const attendanceRate = Math.round((presentToday / Math.max(employees.length, 1)) * 100);
  const pendingLeaves = leaveRequests.filter((l) => l.status === "pending").length;
  const activeProjects = projects.filter((p) => p.status === "active").length;
  const pendingTasks = tasks.filter((t) => t.status !== "done").length;

  const attendanceTrend = useMemo(() => {
    const map: Record<string, { date: string; present: number; late: number; absent: number }> = {};
    attendance.forEach((a) => {
      const k = a.date;
      map[k] ??= { date: k, present: 0, late: 0, absent: 0 };
      if (a.status === "present") map[k].present++;
      else if (a.status === "late") map[k].late++;
      else if (a.status === "absent") map[k].absent++;
    });
    return Object.values(map)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14)
      .map((r) => ({
        ...r,
        label: new Date(r.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
      }));
  }, []);

  const deptDist = departments.map((d) => ({ name: d.name, value: d.headcount }));
  const colors = [
    "var(--color-chart-1)",
    "var(--color-chart-2)",
    "var(--color-chart-3)",
    "var(--color-chart-4)",
    "var(--color-chart-5)",
    "var(--color-primary)",
  ];

  const leaveStats = [
    { type: "Annual", count: leaveRequests.filter((l) => l.type === "annual").length },
    { type: "Sick", count: leaveRequests.filter((l) => l.type === "sick").length },
    { type: "Casual", count: leaveRequests.filter((l) => l.type === "casual").length },
    { type: "Emergency", count: leaveRequests.filter((l) => l.type === "emergency").length },
  ];

  return (
    <>
      <PageHeader
        title={`Hi, ${user.name}`}
        description="Here's what's happening across Code Vertex Solutions today."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/reports">
                <FileBarChart className="size-4" /> Reports
              </Link>
            </Button>
            <Button className="gradient-primary text-primary-foreground shadow-glow" asChild>
              <Link to="/employees">
                <UserPlus className="size-4" /> Add employee
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total employees"
          value={employees.length}
          icon={Users}
          accent="primary"
          trend={{ value: "+2 this month", positive: true }}
        />
        <StatCard
          label="Active"
          value={activeEmps}
          icon={CheckCircle2}
          accent="success"
          trend={{
            value: `${Math.round((activeEmps / employees.length) * 100)}% of total`,
            positive: true,
          }}
        />
        <StatCard
          label="Departments"
          value={departments.length}
          icon={Building2}
          accent="secondary"
        />
        <StatCard
          label="Attendance rate"
          value={`${attendanceRate}%`}
          icon={CalendarCheck}
          accent="info"
          trend={{ value: "Today", positive: true }}
        />
        <StatCard
          label="Leave requests"
          value={pendingLeaves}
          icon={Plane}
          accent="warning"
          trend={{ value: "Pending review" }}
        />
        <StatCard
          label="Active projects"
          value={activeProjects}
          icon={FolderKanban}
          accent="primary"
        />
        <StatCard label="Pending tasks" value={pendingTasks} icon={ListChecks} accent="info" />
        <StatCard label="Company assets" value={assets.length} icon={Boxes} accent="secondary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
        <Card className="lg:col-span-2 p-5 glass shadow-elevated">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-semibold">Attendance trends</h3>
              <p className="text-xs text-muted-foreground">Last 14 working days</p>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[--color-chart-1]" /> Present
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[--color-chart-2]" /> Late
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-destructive" /> Absent
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={attendanceTrend}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="label" stroke="var(--color-muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: "var(--color-popover)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="present"
                stroke="var(--color-chart-1)"
                fill="url(#g1)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="late"
                stroke="var(--color-chart-2)"
                fill="url(#g2)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="absent"
                stroke="var(--color-destructive)"
                fill="transparent"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5 glass shadow-elevated">
          <h3 className="font-display font-semibold">Department distribution</h3>
          <p className="text-xs text-muted-foreground mb-2">Headcount by team</p>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={deptDist}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={2}
              >
                {deptDist.map((_, i) => (
                  <Cell key={i} fill={colors[i % colors.length]} stroke="var(--color-background)" />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "var(--color-popover)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 text-xs">
            {deptDist.map((d, i) => (
              <div key={d.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span
                    className="size-2 rounded-full"
                    style={{ background: colors[i % colors.length] }}
                  />
                  {d.name}
                </span>
                <span className="text-muted-foreground">{d.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        <Card className="p-5 glass shadow-elevated">
          <h3 className="font-display font-semibold">Leave statistics</h3>
          <p className="text-xs text-muted-foreground mb-4">By type, last 90 days</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={leaveStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="type" stroke="var(--color-muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: "var(--color-popover)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="count" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="lg:col-span-2 p-5 glass shadow-elevated">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-semibold">Project progress</h3>
              <p className="text-xs text-muted-foreground">Active engagements</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/projects">
                View all <TrendingUp className="size-4" />
              </Link>
            </Button>
          </div>
          <div className="space-y-4">
            {projects.slice(0, 4).map((p) => (
              <div key={p.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <div className="text-sm font-medium">{p.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.client} · Due {formatDate(p.deadline)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={p.status} />
                    <span className="text-sm font-semibold tabular-nums w-10 text-right">
                      {p.progress}%
                    </span>
                  </div>
                </div>
                <Progress value={p.progress} className="h-1.5" />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <Card className="p-5 glass shadow-elevated">
          <h3 className="font-display font-semibold mb-3">Recent leave requests</h3>
          <div className="space-y-3">
            {leaveRequests.slice(0, 5).map((l) => {
              const emp = employeeById(l.employeeId);
              return (
                <div key={l.id} className="flex items-center gap-3">
                  <Avatar className="size-9">
                    <AvatarFallback className="text-xs">
                      {initials(emp?.fullName ?? "?")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{emp?.fullName}</div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {l.type} leave · {l.days}d · {formatDate(l.startDate)}
                    </div>
                  </div>
                  <StatusBadge status={l.status} />
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-5 glass shadow-elevated">
          <h3 className="font-display font-semibold mb-3">Quick actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { to: "/employees", label: "Add employee", icon: UserPlus },
              { to: "/departments", label: "Create department", icon: Building2 },
              { to: "/projects", label: "New project", icon: FolderKanban },
              { to: "/reports", label: "Generate report", icon: FileBarChart },
            ].map((a) => (
              <Link
                key={a.to}
                to={a.to}
                className="group relative rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-accent/40 transition-all p-4"
              >
                <a.icon className="size-5 text-primary mb-2" />
                <div className="text-sm font-medium">{a.label}</div>
                <Plus className="absolute top-3 right-3 size-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

function EmployeeDashboard() {
  const user = useAuth((s) => s.user)!;
  const me = employeeById(user.employeeId) ?? employees[0];
  const myAttendance = attendance.filter((a) => a.employeeId === me.id);
  const presentDays = myAttendance.filter(
    (a) => a.status === "present" || a.status === "late",
  ).length;
  const myTasks = tasks.filter((t) => t.assigneeId === me.id);
  const myLeaves = leaveRequests.filter((l) => l.employeeId === me.id);
  const myProjects = projects.filter((p) => p.memberIds.includes(me.id));
  const upcoming = myTasks
    .filter((t) => t.status !== "done")
    .sort((a, b) => a.deadline.localeCompare(b.deadline))
    .slice(0, 5);

  return (
    <>
      <PageHeader
        title={`Hi, ${user.name}`}
        description="Your personal workspace at Code Vertex Solutions."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/leaves">
                <Plane className="size-4" /> Apply leave
              </Link>
            </Button>
            <Button className="gradient-primary text-primary-foreground shadow-glow" asChild>
              <Link to="/attendance">
                <Clock className="size-4" /> Mark attendance
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="My attendance"
          value={`${presentDays}/${myAttendance.length}`}
          icon={CalendarCheck}
          accent="success"
          trend={{ value: "Last 30 days" }}
        />
        <StatCard
          label="Assigned tasks"
          value={myTasks.length}
          icon={ListChecks}
          accent="primary"
          trend={{
            value: `${myTasks.filter((t) => t.status === "in_progress").length} in progress`,
          }}
        />
        <StatCard
          label="Pending requests"
          value={myLeaves.filter((l) => l.status === "pending").length}
          icon={Plane}
          accent="warning"
        />
        <StatCard
          label="Active projects"
          value={myProjects.length}
          icon={FolderKanban}
          accent="info"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
        <Card className="lg:col-span-2 p-5 glass shadow-elevated">
          <h3 className="font-display font-semibold mb-3">Upcoming deadlines</h3>
          <div className="space-y-3">
            {upcoming.length === 0 && (
              <p className="text-sm text-muted-foreground">All caught up — nothing pending. 🎉</p>
            )}
            {upcoming.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/40 transition-colors"
              >
                <div className="size-10 rounded-lg gradient-primary/10 bg-primary/10 flex items-center justify-center">
                  <ListChecks className="size-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{t.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {projectById(t.projectId)?.name} · Due {formatDate(t.deadline)}
                  </div>
                </div>
                <StatusBadge status={t.priority} />
                <StatusBadge status={t.status} />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5 glass shadow-elevated">
          <h3 className="font-display font-semibold mb-3">My projects</h3>
          <div className="space-y-4">
            {myProjects.map((p) => (
              <div key={p.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="text-sm font-medium truncate">{p.name}</div>
                  <span className="text-xs tabular-nums">{p.progress}%</span>
                </div>
                <Progress value={p.progress} className="h-1.5" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
