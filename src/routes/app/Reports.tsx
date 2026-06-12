import { useState } from "react";
import { useQuery } from "@/lib/api/query-hooks";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileDown, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { toast } from "sonner";
import {
  getEmployeesFn,
  getAttendanceFn,
  getLeavesFn,
  getProjectsFn,
  getAssetsFn,
  getDepartmentsFn,
} from "@/lib/api/app.functions";

const reports = [
  { id: "emp", title: "Employee report", desc: "Headcount, status, designation, and salary logs." },
  {
    id: "att",
    title: "Attendance report",
    desc: "Daily attendance logs, check-in/out times, and hours.",
  },
  {
    id: "leave",
    title: "Leave report",
    desc: "Leave applications, date ranges, and approval stats.",
  },
  { id: "proj", title: "Project report", desc: "Project progress, client listings, and budgets." },
  {
    id: "asset",
    title: "Asset report",
    desc: "Inventory tags, categories, values, and assignees.",
  },
];

export function ReportsPage() {
  const [exportingType, setExportingType] = useState<string | null>(null);

  // Queries
  const { data: employees = [], isLoading: loadEmp } = useQuery({
    queryKey: ["employees"],
    queryFn: getEmployeesFn,
  });
  const { data: attendance = [], isLoading: loadAtt } = useQuery({
    queryKey: ["attendance"],
    queryFn: getAttendanceFn,
  });
  const { data: leaves = [], isLoading: loadLeave } = useQuery({
    queryKey: ["leaves"],
    queryFn: getLeavesFn,
  });
  const { data: projects = [], isLoading: loadProj } = useQuery({
    queryKey: ["projects"],
    queryFn: getProjectsFn,
  });
  const { data: assets = [], isLoading: loadAsset } = useQuery({
    queryKey: ["assets"],
    queryFn: getAssetsFn,
  });
  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: getDepartmentsFn,
  });

  const loading = loadEmp || loadAtt || loadLeave || loadProj || loadAsset;

  const deptData = departments.map((d) => {
    const count = employees.filter((e) => e.departmentId === d.id && e.status === "active").length;
    return { name: d.code, count };
  });

  const trend = attendance.reduce<Record<string, number>>((acc, a) => {
    acc[a.date] = (acc[a.date] ?? 0) + (a.status === "present" || a.status === "late" ? 1 : 0);
    return acc;
  }, {});

  const trendData = Object.entries(trend)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-10)
    .map(([date, present]) => ({
      date: new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
      present,
    }));

  const totals = {
    emp: employees.length,
    att: attendance.length,
    leave: leaves.length,
    proj: projects.length,
    asset: assets.length,
  };

  // CSV/Excel Generator helper
  const downloadCSV = (filename: string, headers: string[], rows: string[][]) => {
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((val) => `"${(val || "").replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PDF Generation helper (renders a styled print view in a new window)
  const generatePDF = (title: string, headers: string[], rows: string[][]) => {
    const win = window.open("", "_blank");
    if (!win) {
      toast.error("Popup blocked! Please allow popups to export PDFs.");
      return;
    }

    const html = `
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; }
            h1 { font-family: 'Space Grotesk', sans-serif; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 24px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #cbd5e1; padding: 10px 14px; text-align: left; font-size: 13px; }
            th { background-color: #f1f5f9; font-weight: 600; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .footer { margin-top: 40px; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 12px; text-align: right; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <p>Generated on: ${new Date().toLocaleString()}</p>
          <table>
            <thead>
              <tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>
            </thead>
            <tbody>
              ${rows.map((row) => `<tr>${row.map((val) => `<td>${val || "—"}</td>`).join("")}</tr>`).join("")}
            </tbody>
          </table>
          <div class="footer">VertexEMS Enterprise Platform · Code Vertex Solutions</div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    win.document.write(html);
    win.document.close();
  };

  const handleExport = (reportId: string, format: "pdf" | "excel" | "csv") => {
    setExportingType(`${reportId}-${format}`);

    let headers: string[] = [];
    let rows: string[][] = [];
    let filename = `${reportId}_report`;
    let title = "";

    try {
      if (reportId === "emp") {
        title = "Employees Master Directory";
        filename = "employees_master_report";
        headers = [
          "Employee ID",
          "Code",
          "Full Name",
          "Email",
          "Phone",
          "CNIC",
          "Designation",
          "Joining Date",
          "Status",
          "Salary (PKR)",
          "Role",
        ];
        rows = employees.map((e) => [
          e.id,
          e.employeeCode,
          e.fullName,
          e.email,
          e.phone,
          e.cnic,
          e.designation,
          e.joiningDate,
          e.status,
          e.salary.toString(),
          e.role,
        ]);
      } else if (reportId === "att") {
        title = "Attendance Logs";
        filename = "attendance_summary_report";
        headers = ["Employee Name", "Date", "Check In", "Check Out", "Hours Worked", "Status"];
        rows = attendance.map((a) => {
          const emp = employees.find((e) => e.id === a.employeeId);
          return [
            emp?.fullName || a.employeeId,
            a.date,
            a.checkIn || "",
            a.checkOut || "",
            `${a.hours}h`,
            a.status,
          ];
        });
      } else if (reportId === "leave") {
        title = "Leaves Ledger";
        filename = "leave_applications_report";
        headers = [
          "Employee Name",
          "Leave Type",
          "Start Date",
          "End Date",
          "Total Days",
          "Reason",
          "Status",
          "Applied At",
        ];
        rows = leaves.map((l) => {
          const emp = employees.find((e) => e.id === l.employeeId);
          return [
            emp?.fullName || l.employeeId,
            l.type,
            l.startDate,
            l.endDate,
            l.days.toString(),
            l.reason,
            l.status,
            l.appliedAt,
          ];
        });
      } else if (reportId === "proj") {
        title = "Project Status & Utilizations";
        filename = "projects_progress_report";
        headers = [
          "Project ID",
          "Project Name",
          "Client",
          "Start Date",
          "Deadline",
          "Budget (PKR)",
          "Progress",
          "Status",
        ];
        rows = projects.map((p) => [
          p.id,
          p.name,
          p.client,
          p.startDate,
          p.deadline,
          p.budget.toString(),
          `${p.progress}%`,
          p.status,
        ]);
      } else if (reportId === "asset") {
        title = "Assets Master Directory";
        filename = "assets_inventory_report";
        headers = [
          "Asset Tag",
          "Asset Name",
          "Category",
          "Serial Number",
          "Purchase Date",
          "Value (PKR)",
          "Status",
          "Assigned To",
        ];
        rows = assets.map((a) => {
          const emp = employees.find((e) => e.id === a.assignedTo);
          return [
            a.tag,
            a.name,
            a.category,
            a.serial,
            a.purchaseDate,
            a.value.toString(),
            a.status,
            emp?.fullName || "Unassigned",
          ];
        });
      }

      if (format === "csv" || format === "excel") {
        downloadCSV(`${filename}.csv`, headers, rows);
        toast.success(`Exported ${format.toUpperCase()} successfully.`);
      } else if (format === "pdf") {
        generatePDF(title, headers, rows);
        toast.success(`Exported PDF successfully.`);
      }
    } catch (e) {
      toast.error("Export failed. Please try again.");
    } finally {
      setExportingType(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Reports & analytics"
        description="Generate and export detailed reports across modules."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleExport("emp", "pdf")} disabled={loading}>
              <FileText className="size-4 mr-1.5" /> Export All PDF
            </Button>
            <Button variant="outline" onClick={() => handleExport("emp", "csv")} disabled={loading}>
              <FileDown className="size-4 mr-1.5" /> Export All CSV
            </Button>
          </div>
        }
      />

      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="grid lg:grid-cols-2 gap-4 mb-6">
            <Card className="p-5 glass shadow-elevated">
              <h3 className="font-display font-semibold">Headcount by department</h3>
              <p className="text-xs text-muted-foreground mb-4">Active employees</p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={deptData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={11} />
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
            <Card className="p-5 glass shadow-elevated">
              <h3 className="font-display font-semibold">Attendance trend</h3>
              <p className="text-xs text-muted-foreground mb-4">Daily present count</p>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="date" stroke="var(--color-muted-foreground)" fontSize={11} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-popover)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="present"
                    stroke="var(--color-secondary)"
                    strokeWidth={2.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.map((r) => (
              <Card
                key={r.id}
                className="p-5 glass shadow-elevated hover:border-primary/40 transition-colors flex flex-col justify-between"
              >
                <div>
                  <h3 className="font-display font-semibold">{r.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{r.desc}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mt-3">
                    {totals[r.id as keyof typeof totals]} records available
                  </p>
                  <div className="mt-4 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExport(r.id, "pdf")}
                      disabled={exportingType !== null}
                    >
                      {exportingType === `${r.id}-pdf` ? (
                        <Loader2 className="size-3 animate-spin mr-1" />
                      ) : null}{" "}
                      PDF
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExport(r.id, "excel")}
                      disabled={exportingType !== null}
                    >
                      {exportingType === `${r.id}-excel` ? (
                        <Loader2 className="size-3 animate-spin mr-1" />
                      ) : null}{" "}
                      Excel
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExport(r.id, "csv")}
                      disabled={exportingType !== null}
                    >
                      {exportingType === `${r.id}-csv` ? (
                        <Loader2 className="size-3 animate-spin mr-1" />
                      ) : null}{" "}
                      CSV
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </>
  );
}
