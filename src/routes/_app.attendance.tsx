import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui-ext/status-badge";
import { useAuth } from "@/lib/auth-store";
import { StatCard } from "@/components/ui-ext/stat-card";
import { Clock, LogIn, LogOut, CalendarCheck, Search, Timer } from "lucide-react";
import { formatDate, initials } from "@/lib/format";
import { toast } from "sonner";
import { getAttendanceFn, getEmployeesFn, checkInFn, checkOutFn } from "@/lib/api/app.functions";

export const Route = createFileRoute("/_app/attendance")({ component: AttendancePage });

function AttendancePage() {
  const queryClient = useQueryClient();
  const user = useAuth((s) => s.user)!;
  const [q, setQ] = useState("");
  const isAdmin = user.role !== "employee";

  // Queries
  const { data: attendance = [], isLoading: loadingAttendance } = useQuery({
    queryKey: ["attendance"],
    queryFn: () => getAttendanceFn()
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: () => getEmployeesFn()
  });

  // Mutations
  const checkInMutation = useMutation({
    mutationFn: () => checkInFn(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      toast.success("Checked in successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to check in");
    }
  });

  const checkOutMutation = useMutation({
    mutationFn: () => checkOutFn(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      toast.success("Checked out successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to check out");
    }
  });

  // Handlers
  const handleCheckIn = () => {
    checkInMutation.mutate();
  };

  const handleCheckOut = () => {
    checkOutMutation.mutate();
  };

  // Filter calculations
  const filtered = attendance.filter((r) => {
    if (!q) return true;
    const emp = employees.find(e => e.id === r.employeeId);
    return emp && `${emp.fullName} ${emp.employeeCode}`.toLowerCase().includes(q.toLowerCase());
  });

  const today = new Date().toISOString().slice(0, 10);
  const todayRows = attendance.filter((a) => a.date === today);
  const presentCount = todayRows.filter((a) => a.status === "present").length;
  const lateCount = todayRows.filter((a) => a.status === "late").length;
  const absentCount = todayRows.filter((a) => a.status === "absent").length;
  const onLeave = todayRows.filter((a) => a.status === "leave").length;

  return (
    <>
      <PageHeader
        title="Attendance"
        description={isAdmin ? "Track team attendance, late arrivals, and absences." : "Check in, check out and view your attendance history."}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCheckIn} disabled={checkInMutation.isPending}>
              <LogIn className="size-4 mr-1.5" /> Check in
            </Button>
            <Button className="gradient-primary text-primary-foreground shadow-glow" onClick={handleCheckOut} disabled={checkOutMutation.isPending}>
              <LogOut className="size-4 mr-1.5" /> Check out
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Present today" value={presentCount} icon={CalendarCheck} accent="success" />
        <StatCard label="Late" value={lateCount} icon={Timer} accent="warning" />
        <StatCard label="Absent" value={absentCount} icon={Clock} accent="primary" />
        <StatCard label="On leave" value={onLeave} icon={Clock} accent="info" />
      </div>

      <Card className="glass shadow-elevated p-4 mt-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input placeholder="Search employee…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9 bg-muted/40 max-w-sm" />
          </div>
        </div>

        {loadingAttendance ? (
          <div className="text-center py-12 text-muted-foreground">Loading attendance...</div>
        ) : (
          <div className="overflow-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  {isAdmin && <TableHead>Employee</TableHead>}
                  <TableHead>Date</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Check-out</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => {
                  const emp = employees.find(e => e.id === r.employeeId);
                  return (
                    <TableRow key={r.id}>
                      {isAdmin && (
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="size-7"><AvatarFallback className="text-[10px]">{initials(emp?.fullName ?? "?")}</AvatarFallback></Avatar>
                            <span className="text-sm">{emp?.fullName || "Unknown"}</span>
                          </div>
                        </TableCell>
                      )}
                      <TableCell className="text-sm">{formatDate(r.date)}</TableCell>
                      <TableCell className="text-sm tabular-nums">{r.checkIn ?? "—"}</TableCell>
                      <TableCell className="text-sm tabular-nums">{r.checkOut ?? "—"}</TableCell>
                      <TableCell className="text-sm tabular-nums">{r.hours}h</TableCell>
                      <TableCell><StatusBadge status={r.status} /></TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={isAdmin ? 6 : 5} className="text-center py-12 text-muted-foreground">No records found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <p className="text-xs text-muted-foreground mt-2">Employees in directory: {employees.length}. Records matched: {filtered.length}.</p>
    </>
  );
}
