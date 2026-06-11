import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { employees, departments, departmentById } from "@/lib/mock-data";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui-ext/status-badge";
import { Search, UserPlus, Mail, Phone, MoreHorizontal } from "lucide-react";
import { formatCurrency, formatDate, initials } from "@/lib/format";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/_app/employees")({ component: EmployeesPage });

function EmployeesPage() {
  const [q, setQ] = useState("");
  const [dept, setDept] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const filtered = employees.filter((e) => {
    if (dept !== "all" && e.departmentId !== dept) return false;
    if (status !== "all" && e.status !== status) return false;
    if (q && !`${e.fullName} ${e.email} ${e.employeeCode} ${e.designation}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const view = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <>
      <PageHeader
        title="Employees"
        description="Manage your workforce, profiles, departments, and employment status."
        actions={
          <Button className="gradient-primary text-primary-foreground shadow-glow">
            <UserPlus className="size-4" /> Add employee
          </Button>
        }
      />

      <Card className="glass shadow-elevated p-4">
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input placeholder="Search by name, email, code…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} className="pl-9 bg-muted/40" />
          </div>
          <Select value={dept} onValueChange={(v) => { setDept(v); setPage(1); }}>
            <SelectTrigger className="w-full md:w-52"><SelectValue placeholder="Department" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All departments</SelectItem>
              {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="w-full md:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="on_leave">On leave</SelectItem>
              <SelectItem value="probation">Probation</SelectItem>
              <SelectItem value="terminated">Terminated</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Salary</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {view.map((e) => (
                <TableRow key={e.id} className="group">
                  <TableCell>
                    <Link to="/employees/$id" params={{ id: e.id }} className="flex items-center gap-3 hover:text-primary">
                      <Avatar className="size-9"><AvatarFallback className="text-xs gradient-primary text-primary-foreground">{initials(e.fullName)}</AvatarFallback></Avatar>
                      <div>
                        <div className="text-sm font-medium">{e.fullName}</div>
                        <div className="text-xs text-muted-foreground">{e.employeeCode} · {e.email}</div>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">{departmentById(e.departmentId)?.name}</TableCell>
                  <TableCell className="text-sm">{e.designation}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(e.joiningDate)}</TableCell>
                  <TableCell className="text-sm tabular-nums">{formatCurrency(e.salary)}</TableCell>
                  <TableCell><StatusBadge status={e.status} /></TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex size-8 items-center justify-center rounded-md hover:bg-accent">
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild><Link to="/employees/$id" params={{ id: e.id }}>View profile</Link></DropdownMenuItem>
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem><Mail className="size-3.5" /> Email</DropdownMenuItem>
                        <DropdownMenuItem><Phone className="size-3.5" /> Call</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Terminate</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {view.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">No employees match your filters.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
          <span>Showing {view.length} of {filtered.length}</span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page === pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      </Card>
    </>
  );
}
