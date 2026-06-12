import { Link } from "react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@/lib/api/query-hooks";
import { useAuth } from "@/lib/auth-store";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/ui-ext/status-badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, UserPlus, Mail, Phone, MoreHorizontal, Trash, Edit } from "lucide-react";
import { formatCurrency, formatDate, initials } from "@/lib/format";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getEmployeesFn,
  getDepartmentsFn,
  createEmployeeFn,
  updateEmployeeFn,
  deleteEmployeeFn,
} from "@/lib/api/app.functions";
import type { Employee, Role, EmploymentStatus } from "@/lib/mock-data";

export function EmployeesPage() {
  const queryClient = useQueryClient();
  const caller = useAuth((s) => s.user);

  // Queries
  const { data: employees = [], isLoading: loadingEmployees } = useQuery({
    queryKey: ["employees"],
    queryFn: () => getEmployeesFn(),
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: () => getDepartmentsFn(),
  });

  // State
  const [q, setQ] = useState("");
  const [dept, setDept] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // Dialog State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    cnic: "",
    address: "",
    gender: "male" as "male" | "female" | "other",
    dob: "",
    departmentId: "d1",
    designation: "",
    joiningDate: "",
    status: "active" as EmploymentStatus,
    salary: 100000,
    role: "employee" as Role,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (newEmp: typeof formData) => createEmployeeFn({ data: newEmp }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Employee added successfully");
      setIsCreateOpen(false);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create employee");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Employee> }) =>
      updateEmployeeFn({ data: { id, updates } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Employee updated successfully");
      setIsEditOpen(false);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update employee");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEmployeeFn({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Employee deleted successfully");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to delete employee");
    },
  });

  // Handler functions
  const openCreateDialog = () => {
    setFormData({
      fullName: "",
      email: "",
      phone: "+92 300 0000000",
      cnic: "42101-0000000-0",
      address: "DHA, Karachi",
      gender: "male",
      dob: "1995-01-01",
      departmentId: departments[0]?.id || "d1",
      designation: "Software Engineer",
      joiningDate: new Date().toISOString().slice(0, 10),
      status: "active",
      salary: 150000,
      role: "employee",
    });
    setIsCreateOpen(true);
  };

  const openEditDialog = (emp: Employee) => {
    setEditingEmp(emp);
    setFormData({
      fullName: emp.fullName,
      email: emp.email,
      phone: emp.phone,
      cnic: emp.cnic,
      address: emp.address,
      gender: emp.gender,
      dob: emp.dob,
      departmentId: emp.departmentId,
      designation: emp.designation,
      joiningDate: emp.joiningDate,
      status: emp.status,
      salary: emp.salary,
      role: emp.role,
    });
    setIsEditOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEmp) {
      updateMutation.mutate({ id: editingEmp.id, updates: formData });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this employee?")) {
      deleteMutation.mutate(id);
    }
  };

  // Filter calculations
  const filtered = employees.filter((e) => {
    if (dept !== "all" && e.departmentId !== dept) return false;
    if (status !== "all" && e.status !== status) return false;
    if (
      q &&
      !`${e.fullName} ${e.email} ${e.employeeCode} ${e.designation}`
        .toLowerCase()
        .includes(q.toLowerCase())
    )
      return false;
    return true;
  });

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const view = filtered.slice((page - 1) * pageSize, page * pageSize);

  const isHRorAdmin = caller?.role === "admin" || caller?.role === "manager";
  const canSeeSalary = caller?.role === "admin" || caller?.role === "accountant";

  return (
    <>
      <PageHeader
        title="Employees"
        description="Manage your workforce, profiles, departments, and employment status."
        actions={
          isHRorAdmin && (
            <Button
              onClick={openCreateDialog}
              className="gradient-primary text-primary-foreground shadow-glow"
            >
              <UserPlus className="size-4" /> Add employee
            </Button>
          )
        }
      />

      <Card className="glass shadow-elevated p-4">
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, code…"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              className="pl-9 bg-muted/40"
            />
          </div>
          <Select
            value={dept}
            onValueChange={(v) => {
              setDept(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full md:w-52">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All departments</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="on_leave">On leave</SelectItem>
              <SelectItem value="probation">Probation</SelectItem>
              <SelectItem value="terminated">Terminated</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loadingEmployees ? (
          <div className="text-center py-12 text-muted-foreground">Loading employees...</div>
        ) : (
          <div className="overflow-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Joined</TableHead>
                  {canSeeSalary && <TableHead>Salary</TableHead>}
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {view.map((e) => (
                  <TableRow key={e.id} className="group">
                    <TableCell>
                      <Link
                        to={`/employees/${e.id}`}
                        className="flex items-center gap-3 hover:text-primary"
                      >
                        <Avatar className="size-9">
                          <AvatarFallback className="text-xs gradient-primary text-primary-foreground">
                            {initials(e.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium">{e.fullName}</div>
                          <div className="text-xs text-muted-foreground">
                            {e.employeeCode} · {e.email}
                          </div>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm">
                      {departments.find((d) => d.id === e.departmentId)?.name || "—"}
                    </TableCell>
                    <TableCell className="text-sm">{e.designation}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(e.joiningDate)}
                    </TableCell>
                    {canSeeSalary && (
                      <TableCell className="text-sm tabular-nums">
                        {formatCurrency(e.salary)}
                      </TableCell>
                    )}
                    <TableCell>
                      <StatusBadge status={e.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex size-8 items-center justify-center rounded-md hover:bg-accent">
                          <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/employees/${e.id}`}>View profile</Link>
                          </DropdownMenuItem>

                          {isHRorAdmin && (
                            <>
                              <DropdownMenuItem onClick={() => openEditDialog(e)}>
                                <Edit className="size-3.5 mr-1" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(e.id)}
                                className="text-destructive"
                              >
                                <Trash className="size-3.5 mr-1" /> Terminate/Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {view.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={canSeeSalary ? 7 : 6}
                      className="text-center py-12 text-muted-foreground"
                    >
                      No employees match your filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
          <span>
            Showing {view.length} of {filtered.length}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* CREATE DIALOG */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[500px] bg-card">
          <form onSubmit={handleCreateSubmit}>
            <DialogHeader>
              <DialogTitle>Add Employee</DialogTitle>
              <DialogDescription>Create a new employee profile in the system.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
              <div className="space-y-1">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cnic">CNIC</Label>
                  <Input
                    id="cnic"
                    value={formData.cnic}
                    onChange={(e) => setFormData({ ...formData, cnic: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="gender">Gender</Label>
                  <select
                    id="gender"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as never })}
                    className="w-full rounded-md border border-input bg-background px-3 h-10 text-sm"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-1 col-span-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="department">Department</Label>
                  <select
                    id="department"
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 h-10 text-sm"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="designation">Designation</Label>
                  <Input
                    id="designation"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="joiningDate">Joining Date</Label>
                  <Input
                    id="joiningDate"
                    type="date"
                    value={formData.joiningDate}
                    onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as never })}
                    className="w-full rounded-md border border-input bg-background px-3 h-10 text-sm"
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending Approval</option>
                    <option value="on_leave">On Leave</option>
                    <option value="probation">Probation</option>
                    <option value="terminated">Terminated</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="role">Role</Label>
                  <select
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as never })}
                    className="w-full rounded-md border border-input bg-background px-3 h-10 text-sm"
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="salary">Salary (PKR)</Label>
                <Input
                  id="salary"
                  type="number"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                Add Employee
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px] bg-card">
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle>Edit Employee Details</DialogTitle>
              <DialogDescription>
                Modify fields for employee: {editingEmp?.fullName}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
              <div className="space-y-1">
                <Label htmlFor="editFullName">Full Name</Label>
                <Input
                  id="editFullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="editEmail">Email</Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="editPhone">Phone</Label>
                  <Input
                    id="editPhone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="editCnic">CNIC</Label>
                  <Input
                    id="editCnic"
                    value={formData.cnic}
                    onChange={(e) => setFormData({ ...formData, cnic: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="editAddress">Address</Label>
                <Input
                  id="editAddress"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="editGender">Gender</Label>
                  <select
                    id="editGender"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as never })}
                    className="w-full rounded-md border border-input bg-background px-3 h-10 text-sm"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-1 col-span-2">
                  <Label htmlFor="editDob">Date of Birth</Label>
                  <Input
                    id="editDob"
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="editDepartment">Department</Label>
                  <select
                    id="editDepartment"
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 h-10 text-sm"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="editDesignation">Designation</Label>
                  <Input
                    id="editDesignation"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="editJoiningDate">Joining Date</Label>
                  <Input
                    id="editJoiningDate"
                    type="date"
                    value={formData.joiningDate}
                    onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="editStatus">Status</Label>
                  <select
                    id="editStatus"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as never })}
                    className="w-full rounded-md border border-input bg-background px-3 h-10 text-sm"
                  >
                    <option value="active">Active</option>
                    <option value="pending">Pending Approval</option>
                    <option value="on_leave">On Leave</option>
                    <option value="probation">Probation</option>
                    <option value="terminated">Terminated</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="editRole">Role</Label>
                  <select
                    id="editRole"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as never })}
                    className="w-full rounded-md border border-input bg-background px-3 h-10 text-sm"
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="editSalary">Salary (PKR)</Label>
                <Input
                  id="editSalary"
                  type="number"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
