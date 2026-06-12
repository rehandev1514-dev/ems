import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui-ext/status-badge";
import { projects, employeeById } from "@/lib/mock-data";
import { formatCurrency, formatDate, initials } from "@/lib/format";
import { Plus, CalendarRange, Wallet } from "lucide-react";

export function ProjectsPage() {
  return (
    <>
      <PageHeader
        title="Projects"
        description="Track engagements, milestones, budgets and team allocation."
        actions={
          <Button className="gradient-primary text-primary-foreground shadow-glow">
            <Plus className="size-4" /> New project
          </Button>
        }
      />

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {projects.map((p) => (
          <Card key={p.id} className="p-5 glass shadow-elevated flex flex-col">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-display text-lg font-semibold">{p.name}</h3>
                <p className="text-xs text-muted-foreground">{p.client}</p>
              </div>
              <StatusBadge status={p.status} />
            </div>

            <div className="mt-2">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium tabular-nums">{p.progress}%</span>
              </div>
              <Progress value={p.progress} className="h-1.5" />
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
              <div className="rounded-lg border border-border p-2.5">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <CalendarRange className="size-3.5" /> Deadline
                </div>
                <div className="mt-1 text-sm font-medium">{formatDate(p.deadline)}</div>
              </div>
              <div className="rounded-lg border border-border p-2.5">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Wallet className="size-3.5" /> Budget
                </div>
                <div className="mt-1 text-sm font-medium tabular-nums">
                  {formatCurrency(p.budget)}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
              <div className="flex -space-x-2">
                {p.memberIds.slice(0, 4).map((id) => {
                  const m = employeeById(id);
                  return m ? (
                    <Avatar key={id} className="size-7 ring-2 ring-card">
                      <AvatarFallback className="text-[10px] gradient-primary text-primary-foreground">
                        {initials(m.fullName)}
                      </AvatarFallback>
                    </Avatar>
                  ) : null;
                })}
                {p.memberIds.length > 4 && (
                  <div className="size-7 rounded-full bg-muted ring-2 ring-card text-[10px] flex items-center justify-center">
                    +{p.memberIds.length - 4}
                  </div>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                Started {formatDate(p.startDate)}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
