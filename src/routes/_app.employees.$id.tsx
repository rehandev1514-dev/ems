import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { employees, departmentById, attendance, leaveRequests, projects, documents, assets } from "@/lib/mock-data";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/ui-ext/status-badge";
import { formatCurrency, formatDate, initials } from "@/lib/format";
import { ArrowLeft, Mail, Phone, MapPin, Calendar, IdCard, Briefcase } from "lucide-react";

export const Route = createFileRoute("/_app/employees/$id")({
  component: EmployeeProfile,
  loader: ({ params }) => {
    const emp = employees.find((e) => e.id === params.id);
    if (!emp) throw notFound();
    return { emp };
  },
});

function EmployeeProfile() {
  const { emp } = Route.useLoaderData();
  const dept = departmentById(emp.departmentId);
  const empAttendance = attendance.filter((a) => a.employeeId === emp.id);
  const empLeaves = leaveRequests.filter((l) => l.employeeId === emp.id);
  const empProjects = projects.filter((p) => p.memberIds.includes(emp.id));
  const empDocs = documents.filter((d) => d.employeeId === emp.id);
  const empAssets = assets.filter((a) => a.assignedTo === emp.id);

  return (
    <>
      <Link to="/employees" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="size-4" /> Back to employees
      </Link>

      <Card className="relative overflow-hidden glass shadow-elevated p-6 mb-6">
        <div className="absolute inset-x-0 top-0 h-24 gradient-primary opacity-30" />
        <div className="relative flex flex-col md:flex-row gap-6 items-start">
          <Avatar className="size-24 ring-4 ring-background shadow-elevated">
            <AvatarFallback className="text-2xl gradient-primary text-primary-foreground font-display">{initials(emp.fullName)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-2xl font-semibold">{emp.fullName}</h1>
              <StatusBadge status={emp.status} />
            </div>
            <p className="text-muted-foreground">{emp.designation} · {dept?.name}</p>
            <div className="mt-3 grid sm:grid-cols-2 gap-1.5 text-sm">
              <div className="flex items-center gap-2"><Mail className="size-3.5 text-muted-foreground" /> {emp.email}</div>
              <div className="flex items-center gap-2"><Phone className="size-3.5 text-muted-foreground" /> {emp.phone}</div>
              <div className="flex items-center gap-2"><IdCard className="size-3.5 text-muted-foreground" /> {emp.cnic}</div>
              <div className="flex items-center gap-2"><Calendar className="size-3.5 text-muted-foreground" /> Joined {formatDate(emp.joiningDate)}</div>
              <div className="flex items-center gap-2 sm:col-span-2"><MapPin className="size-3.5 text-muted-foreground" /> {emp.address}</div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button variant="outline">Edit profile</Button>
            <Button className="gradient-primary text-primary-foreground">Send message</Button>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="overview">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="leaves">Leaves</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="p-5 glass">
              <h3 className="font-display font-semibold mb-3">Employment</h3>
              <dl className="space-y-2 text-sm">
                <Row label="Employee ID" value={emp.employeeCode} />
                <Row label="Department" value={dept?.name ?? "—"} />
                <Row label="Designation" value={emp.designation} />
                <Row label="Joining date" value={formatDate(emp.joiningDate)} />
                <Row label="Salary" value={formatCurrency(emp.salary)} />
                <Row label="Status" value={<StatusBadge status={emp.status} />} />
              </dl>
            </Card>
            <Card className="p-5 glass">
              <h3 className="font-display font-semibold mb-3">Personal</h3>
              <dl className="space-y-2 text-sm">
                <Row label="Full name" value={emp.fullName} />
                <Row label="Gender" value={<span className="capitalize">{emp.gender}</span>} />
                <Row label="Date of birth" value={formatDate(emp.dob)} />
                <Row label="CNIC" value={emp.cnic} />
                <Row label="Phone" value={emp.phone} />
                <Row label="Address" value={emp.address} />
              </dl>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="attendance">
          <Card className="p-5 glass">
            <h3 className="font-display font-semibold mb-3">Last 30 days</h3>
            <div className="grid grid-cols-7 gap-1.5">
              {empAttendance.map((a) => (
                <div key={a.id} className="aspect-square rounded-md border border-border flex flex-col items-center justify-center text-[10px]"
                  style={{
                    background: a.status === "present" ? "color-mix(in oklab, var(--color-success) 18%, transparent)"
                      : a.status === "late" ? "color-mix(in oklab, var(--color-warning) 18%, transparent)"
                      : a.status === "half_day" ? "color-mix(in oklab, var(--color-warning) 12%, transparent)"
                      : a.status === "leave" ? "color-mix(in oklab, var(--color-info) 18%, transparent)"
                      : a.status === "absent" ? "color-mix(in oklab, var(--color-destructive) 18%, transparent)" : undefined,
                  }}>
                  <span className="font-medium">{new Date(a.date).getDate()}</span>
                  <span className="text-[9px] text-muted-foreground capitalize">{a.status.replace("_", " ")}</span>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="leaves">
          <Card className="p-5 glass">
            {empLeaves.length === 0 ? <p className="text-sm text-muted-foreground">No leave history.</p> : (
              <ul className="divide-y divide-border">
                {empLeaves.map((l) => (
                  <li key={l.id} className="py-3 flex items-center gap-3">
                    <div className="flex-1">
                      <div className="text-sm font-medium capitalize">{l.type} leave · {l.days} day{l.days > 1 ? "s" : ""}</div>
                      <div className="text-xs text-muted-foreground">{formatDate(l.startDate)} → {formatDate(l.endDate)} · {l.reason}</div>
                    </div>
                    <StatusBadge status={l.status} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="projects">
          <Card className="p-5 glass">
            {empProjects.length === 0 ? <p className="text-sm text-muted-foreground">Not assigned to any projects.</p> : (
              <ul className="divide-y divide-border">
                {empProjects.map((p) => (
                  <li key={p.id} className="py-3 flex items-center gap-3">
                    <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center"><Briefcase className="size-4 text-primary" /></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.client} · {p.progress}%</div>
                    </div>
                    <StatusBadge status={p.status} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card className="p-5 glass">
            {empDocs.length === 0 ? <p className="text-sm text-muted-foreground">No documents on file.</p> : (
              <ul className="divide-y divide-border">
                {empDocs.map((d) => (
                  <li key={d.id} className="py-3 flex items-center gap-3 text-sm">
                    <span className="flex-1">{d.name}</span>
                    <span className="text-xs text-muted-foreground capitalize">{d.type.replace("_", " ")}</span>
                    <span className="text-xs text-muted-foreground">{(d.sizeKb / 1024).toFixed(2)} MB</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="assets">
          <Card className="p-5 glass">
            {empAssets.length === 0 ? <p className="text-sm text-muted-foreground">No assigned assets.</p> : (
              <ul className="divide-y divide-border">
                {empAssets.map((a) => (
                  <li key={a.id} className="py-3 flex items-center gap-3 text-sm">
                    <span className="flex-1">{a.name}</span>
                    <span className="text-xs text-muted-foreground">{a.tag}</span>
                    <StatusBadge status={a.status} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-right">{value}</dd>
    </div>
  );
}

// keep tree-shake quiet
void PageHeader;
