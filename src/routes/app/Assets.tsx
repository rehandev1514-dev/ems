import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { assets, employeeById } from "@/lib/mock-data";
import { StatusBadge } from "@/components/ui-ext/status-badge";
import { Plus, Search, Boxes } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AssetsPage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const filtered = assets.filter((a) => {
    if (cat !== "all" && a.category !== cat) return false;
    if (q && !`${a.name} ${a.tag} ${a.serial}`.toLowerCase().includes(q.toLowerCase()))
      return false;
    return true;
  });

  const totalValue = assets.reduce((s, a) => s + a.value, 0);

  return (
    <>
      <PageHeader
        title="Company assets"
        description="Inventory of laptops, peripherals, furniture and other equipment."
        actions={
          <Button className="gradient-primary text-primary-foreground shadow-glow">
            <Plus className="size-4" /> Add asset
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total assets", value: assets.length },
          { label: "Assigned", value: assets.filter((a) => a.status === "assigned").length },
          { label: "Available", value: assets.filter((a) => a.status === "available").length },
          { label: "Total value", value: formatCurrency(totalValue) },
        ].map((s) => (
          <Card key={s.label} className="p-5 glass shadow-elevated">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{s.label}</p>
            <p className="mt-2 text-2xl font-display font-semibold">{s.value}</p>
          </Card>
        ))}
      </div>

      <Card className="glass shadow-elevated p-4">
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, tag, serial…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9 bg-muted/40"
            />
          </div>
          <Select value={cat} onValueChange={setCat}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              <SelectItem value="laptop">Laptops</SelectItem>
              <SelectItem value="monitor">Monitors</SelectItem>
              <SelectItem value="keyboard">Keyboards</SelectItem>
              <SelectItem value="mouse">Mice</SelectItem>
              <SelectItem value="headset">Headsets</SelectItem>
              <SelectItem value="furniture">Furniture</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Tag</TableHead>
                <TableHead>Serial</TableHead>
                <TableHead>Assigned to</TableHead>
                <TableHead>Purchased</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="size-8 rounded-md bg-muted flex items-center justify-center">
                        <Boxes className="size-4 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">{a.name}</div>
                        <div className="text-xs text-muted-foreground capitalize">{a.category}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-mono">{a.tag}</TableCell>
                  <TableCell className="text-sm font-mono text-muted-foreground">
                    {a.serial}
                  </TableCell>
                  <TableCell className="text-sm">
                    {a.assignedTo ? (
                      employeeById(a.assignedTo)?.fullName
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{formatDate(a.purchaseDate)}</TableCell>
                  <TableCell className="text-sm tabular-nums">{formatCurrency(a.value)}</TableCell>
                  <TableCell>
                    <StatusBadge status={a.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </>
  );
}
