import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui-ext/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Check, X } from "lucide-react";
import { formatDate, initials } from "@/lib/format";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth-store";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getLeavesFn, getEmployeesFn, applyLeaveFn, updateLeaveStatusFn } from "@/lib/api/app.functions";

export const Route = createFileRoute("/_app/leaves")({ component: LeavesPage });

function LeavesPage() {
  const queryClient = useQueryClient();
  const user = useAuth((s) => s.user)!;
  const isAdmin = user.role !== "employee";
  const [tab, setTab] = useState<"all" | "pending" | "approved" | "rejected">("all");

  // Queries
  const { data: leaveRequests = [], isLoading: loadingLeaves } = useQuery({
    queryKey: ["leaves"],
    queryFn: () => getLeavesFn()
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: () => getEmployeesFn()
  });

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "approved" | "rejected" }) => 
      updateLeaveStatusFn({ data: { id, status } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaves"] });
      toast.success("Leave request status updated");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update leave request");
    }
  });

  const handleApprove = (id: string) => {
    updateStatusMutation.mutate({ id, status: "approved" });
  };

  const handleReject = (id: string) => {
    updateStatusMutation.mutate({ id, status: "rejected" });
  };

  const mine = leaveRequests.filter((l) => l.employeeId === user.employeeId);
  const base = isAdmin ? leaveRequests : mine;
  const view = tab === "all" ? base : base.filter((l) => l.status === tab);

  return (
    <>
      <PageHeader
        title="Leave management"
        description={isAdmin ? "Review and approve leave requests across the organization." : "Apply for leave and track your balance and history."}
        actions={<ApplyLeaveDialog />}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {([
          { label: "Annual balance", value: "14 days", accent: "from-primary/20" },
          { label: "Sick balance", value: "8 days", accent: "from-[--color-info]/20" },
          { label: "Casual balance", value: "5 days", accent: "from-secondary/20" },
          { label: "Pending requests", value: mine.filter((l) => l.status === "pending").length, accent: "from-[--color-warning]/20" },
        ]).map((s) => (
          <Card key={s.label} className={`relative overflow-hidden p-5 glass shadow-elevated`}>
            <div className={`absolute -top-10 -right-10 size-32 rounded-full blur-3xl bg-linear-to-br ${s.accent} to-transparent opacity-60`} />
            <p className="relative text-xs uppercase tracking-widest text-muted-foreground">{s.label}</p>
            <p className="relative mt-2 text-2xl font-display font-semibold">{s.value}</p>
          </Card>
        ))}
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
        
        {loadingLeaves ? (
          <div className="text-center py-12 text-muted-foreground">Loading leave requests...</div>
        ) : (
          <TabsContent value={tab}>
            <Card className="glass shadow-elevated p-4 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {isAdmin && <TableHead>Employee</TableHead>}
                    <TableHead>Type</TableHead>
                    <TableHead>From → To</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    {isAdmin && <TableHead className="text-right">Action</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {view.map((l) => {
                    const emp = employees.find(e => e.id === l.employeeId);
                    return (
                      <TableRow key={l.id}>
                        {isAdmin && (
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="size-7"><AvatarFallback className="text-[10px]">{initials(emp?.fullName ?? "?")}</AvatarFallback></Avatar>
                              <span className="text-sm">{emp?.fullName || "Unknown"}</span>
                            </div>
                          </TableCell>
                        )}
                        <TableCell className="text-sm capitalize">{l.type}</TableCell>
                        <TableCell className="text-sm">{formatDate(l.startDate)} → {formatDate(l.endDate)}</TableCell>
                        <TableCell className="text-sm tabular-nums">{l.days}</TableCell>
                        <TableCell className="text-sm max-w-xs truncate">{l.reason}</TableCell>
                        <TableCell><StatusBadge status={l.status} /></TableCell>
                        {isAdmin && (
                          <TableCell className="text-right">
                            {l.status === "pending" ? (
                              <div className="flex gap-1 justify-end">
                                <Button size="sm" variant="outline" className="text-success hover:bg-success/15" onClick={() => handleApprove(l.id)} disabled={updateStatusMutation.isPending}>
                                  <Check className="size-3.5" />
                                </Button>
                                <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/15" onClick={() => handleReject(l.id)} disabled={updateStatusMutation.isPending}>
                                  <X className="size-3.5" />
                                </Button>
                              </div>
                            ) : <span className="text-xs text-muted-foreground">—</span>}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                  {view.length === 0 && (
                    <TableRow><TableCell colSpan={isAdmin ? 7 : 5} className="text-center py-10 text-muted-foreground">No leave requests.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </>
  );
}

function ApplyLeaveDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"annual" | "sick" | "casual" | "emergency">("annual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  const applyMutation = useMutation({
    mutationFn: (payload: { type: any; startDate: string; endDate: string; reason: string }) => 
      applyLeaveFn({ data: payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaves"] });
      toast.success("Leave request submitted successfully");
      setOpen(false);
      setStartDate("");
      setEndDate("");
      setReason("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to submit leave request");
    }
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!type || !startDate || !endDate || !reason) {
      toast.error("Please fill in all fields");
      return;
    }
    applyMutation.mutate({ type, startDate, endDate, reason });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gradient-primary text-primary-foreground shadow-glow"><Plus className="size-4" /> Apply leave</Button>
      </DialogTrigger>
      <DialogContent className="bg-card">
        <DialogHeader>
          <DialogTitle>Apply for leave</DialogTitle>
          <DialogDescription>Submit a leave request for review by your manager.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="leaveType">Leave type</Label>
            <select id="leaveType" value={type} onChange={(e) => setType(e.target.value as any)} className="w-full rounded-md border border-input bg-background px-3 h-10 text-sm">
              <option value="annual">Annual</option>
              <option value="sick">Sick</option>
              <option value="casual">Casual</option>
              <option value="emergency">Emergency</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="startDate">Start date</Label>
              <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="endDate">End date</Label>
              <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reason">Reason</Label>
            <Textarea id="reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Briefly describe why you are requesting leave..." required />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" className="gradient-primary text-primary-foreground" disabled={applyMutation.isPending}>
              {applyMutation.isPending ? "Submitting..." : "Submit request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
