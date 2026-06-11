import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-store";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/ui-ext/status-badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency, formatDate, initials } from "@/lib/format";
import { 
  ArrowLeft, Mail, Phone, MapPin, Calendar, IdCard, Briefcase, 
  Upload, Trash2, FileText, Download, Edit
} from "lucide-react";
import { toast } from "sonner";
import { 
  getEmployeeByIdFn, 
  getAttendanceFn, 
  getLeavesFn, 
  getProjectsFn, 
  getDocumentsFn, 
  getAssetsFn, 
  updateEmployeeFn,
  uploadDocumentFn,
  deleteDocumentFn
} from "@/lib/api/app.functions";
import type { Employee, Role, EmploymentStatus } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/employees/$id")({
  component: EmployeeProfile,
});

function EmployeeProfile() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const caller = useAuth((s) => s.user);

  // States
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [docType, setDocType] = useState<"contract" | "certificate" | "id" | "offer_letter" | "other">("contract");
  const [uploading, setUploading] = useState(false);

  // Edit Form State
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    cnic: "",
    address: "",
    gender: "male" as "male" | "female" | "other",
    dob: "",
    designation: "",
    status: "active" as EmploymentStatus,
    salary: 0,
    role: "employee" as Role
  });

  // Queries
  const { data: emp, isLoading: loadingEmp, error: empError } = useQuery({
    queryKey: ["employee", id],
    queryFn: async () => {
      const res = await getEmployeeByIdFn({ data: { id } });
      setFormData({
        fullName: res.fullName,
        email: res.email,
        phone: res.phone,
        cnic: res.cnic,
        address: res.address,
        gender: res.gender,
        dob: res.dob,
        designation: res.designation,
        status: res.status,
        salary: res.salary,
        role: res.role
      });
      return res;
    }
  });

  const { data: allAttendance = [] } = useQuery({
    queryKey: ["attendance"],
    queryFn: () => getAttendanceFn()
  });

  const { data: allLeaves = [] } = useQuery({
    queryKey: ["leaves"],
    queryFn: () => getLeavesFn()
  });

  const { data: allProjects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: () => getProjectsFn()
  });

  const { data: allDocs = [] } = useQuery({
    queryKey: ["documents"],
    queryFn: () => getDocumentsFn()
  });

  const { data: allAssets = [] } = useQuery({
    queryKey: ["assets"],
    queryFn: () => getAssetsFn()
  });

  // Mutations
  const updateMutation = useMutation({
    mutationFn: (updates: Partial<Employee>) => updateEmployeeFn({ data: { id, updates } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee", id] });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Profile updated successfully");
      setIsEditOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update profile");
    }
  });

  const uploadDocMutation = useMutation({
    mutationFn: (payload: { name: string; type: any; employeeId: string; fileBase64: string }) => 
      uploadDocumentFn({ data: payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document uploaded successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to upload document");
    }
  });

  const deleteDocMutation = useMutation({
    mutationFn: (docId: string) => deleteDocumentFn({ data: { id: docId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document deleted");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete document");
    }
  });

  if (loadingEmp) {
    return <div className="text-center py-12">Loading profile...</div>;
  }

  if (empError || !emp) {
    return (
      <div className="text-center py-12 text-destructive">
        Error loading profile: {empError?.message || "Employee not found"}
      </div>
    );
  }

  // Filter lists for this specific employee
  const empAttendance = allAttendance.filter((a) => a.employeeId === emp.id);
  const empLeaves = allLeaves.filter((l) => l.employeeId === emp.id);
  const empProjects = allProjects.filter((p) => p.memberIds.includes(emp.id));
  const empDocs = allDocs.filter((d) => d.employeeId === emp.id);
  const empAssets = allAssets.filter((a) => a.assignedTo === emp.id);

  // File Upload Helper
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      uploadDocMutation.mutate({
        name: file.name,
        type: docType,
        employeeId: emp.id,
        fileBase64: base64
      });
      setUploading(false);
    };
    reader.onerror = () => {
      toast.error("Failed to read file");
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const isHRorAdmin = caller?.role === "admin" || caller?.role === "manager";
  const canEditSelf = caller?.id === emp.id;
  const canSeeSalary = caller?.role === "admin" || caller?.role === "accountant";

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
            <p className="text-muted-foreground">{emp.designation}</p>
            <div className="mt-3 grid sm:grid-cols-2 gap-1.5 text-sm">
              <div className="flex items-center gap-2"><Mail className="size-3.5 text-muted-foreground" /> {emp.email}</div>
              <div className="flex items-center gap-2"><Phone className="size-3.5 text-muted-foreground" /> {emp.phone}</div>
              <div className="flex items-center gap-2"><IdCard className="size-3.5 text-muted-foreground" /> {emp.cnic}</div>
              <div className="flex items-center gap-2"><Calendar className="size-3.5 text-muted-foreground" /> Joined {formatDate(emp.joiningDate)}</div>
              <div className="flex items-center gap-2 sm:col-span-2"><MapPin className="size-3.5 text-muted-foreground" /> {emp.address}</div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {(isHRorAdmin || canEditSelf) && (
              <Button variant="outline" onClick={() => setIsEditOpen(true)}>
                <Edit className="size-4 mr-1.5" /> Edit profile
              </Button>
            )}
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
                <Row label="Designation" value={emp.designation} />
                <Row label="Joining date" value={formatDate(emp.joiningDate)} />
                {canSeeSalary && <Row label="Salary" value={formatCurrency(emp.salary)} />}
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
            {empAttendance.length === 0 ? <p className="text-sm text-muted-foreground">No attendance history.</p> : (
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
            )}
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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
              <h3 className="font-display font-semibold">Documents on File</h3>
              
              {(isHRorAdmin || canEditSelf) && (
                <div className="flex items-center gap-2">
                  <select 
                    value={docType}
                    onChange={(e) => setDocType(e.target.value as any)}
                    className="rounded-md border border-input bg-background px-2 h-9 text-xs"
                  >
                    <option value="contract">Contract</option>
                    <option value="certificate">Certificate</option>
                    <option value="id">ID Copy</option>
                    <option value="offer_letter">Offer Letter</option>
                    <option value="other">Other</option>
                  </select>
                  <Label htmlFor="doc-upload" className="cursor-pointer inline-flex items-center justify-center rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 px-3 h-9">
                    <Upload className="size-3.5 mr-1" /> {uploading ? "Uploading..." : "Upload File"}
                  </Label>
                  <input id="doc-upload" type="file" onChange={handleFileUpload} className="hidden" />
                </div>
              )}
            </div>

            {empDocs.length === 0 ? <p className="text-sm text-muted-foreground">No documents on file.</p> : (
              <ul className="divide-y divide-border">
                {empDocs.map((d) => (
                  <li key={d.id} className="py-3 flex items-center gap-3 text-sm">
                    <FileText className="size-4 text-muted-foreground" />
                    <span className="flex-1 font-medium">{d.name}</span>
                    <span className="text-xs text-muted-foreground capitalize">{d.type.replace("_", " ")}</span>
                    <span className="text-xs text-muted-foreground">{d.sizeKb} KB</span>
                    
                    <div className="flex gap-2">
                      <Button size="icon" variant="ghost" className="size-8" onClick={() => toast.success("Downloading document...")}>
                        <Download className="size-4" />
                      </Button>
                      {(isHRorAdmin || canEditSelf) && (
                        <Button size="icon" variant="ghost" className="size-8 text-destructive" onClick={() => {
                          if (confirm("Delete this document?")) {
                            deleteDocMutation.mutate(d.id);
                          }
                        }}>
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </div>
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
                    <span className="flex-1 font-medium">{a.name}</span>
                    <span className="text-xs text-muted-foreground">{a.tag}</span>
                    <StatusBadge status={a.status} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* EDIT PROFILE DIALOG */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px] bg-card">
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle>Edit Profile Details</DialogTitle>
              <DialogDescription>Modify info details for {emp.fullName}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
              <div className="space-y-1">
                <Label htmlFor="editFullName">Full Name</Label>
                <Input id="editFullName" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="editEmail">Email</Label>
                <Input id="editEmail" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required disabled={!isHRorAdmin} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="editPhone">Phone</Label>
                  <Input id="editPhone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="editCnic">CNIC</Label>
                  <Input id="editCnic" value={formData.cnic} onChange={(e) => setFormData({...formData, cnic: e.target.value})} required disabled={!isHRorAdmin} />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="editAddress">Address</Label>
                <Input id="editAddress" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} required />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="editGender">Gender</Label>
                  <select id="editGender" value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value as any})} className="w-full rounded-md border border-input bg-background px-3 h-10 text-sm">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-1 col-span-2">
                  <Label htmlFor="editDob">Date of Birth</Label>
                  <Input id="editDob" type="date" value={formData.dob} onChange={(e) => setFormData({...formData, dob: e.target.value})} required />
                </div>
              </div>
              {isHRorAdmin && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="editDesignation">Designation</Label>
                      <Input id="editDesignation" value={formData.designation} onChange={(e) => setFormData({...formData, designation: e.target.value})} required />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="editStatus">Status</Label>
                      <select id="editStatus" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value as any})} className="w-full rounded-md border border-input bg-background px-3 h-10 text-sm">
                        <option value="active">Active</option>
                        <option value="pending">Pending Approval</option>
                        <option value="on_leave">On Leave</option>
                        <option value="probation">Probation</option>
                        <option value="terminated">Terminated</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="editRole">Role</Label>
                      <select id="editRole" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value as any})} className="w-full rounded-md border border-input bg-background px-3 h-10 text-sm">
                        <option value="employee">Employee</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="editSalary">Salary (PKR)</Label>
                      <Input id="editSalary" type="number" value={formData.salary} onChange={(e) => setFormData({...formData, salary: Number(e.target.value)})} required />
                    </div>
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={updateMutation.isPending}>Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
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
