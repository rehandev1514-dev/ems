import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { tasks, employeeById, projectById } from "@/lib/mock-data";
import { StatusBadge } from "@/components/ui-ext/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus } from "lucide-react";
import { formatDate, initials } from "@/lib/format";

const columns = [
  { id: "todo", title: "To do" },
  { id: "in_progress", title: "In progress" },
  { id: "review", title: "Review" },
  { id: "done", title: "Done" },
] as const;

export function TasksPage() {
  return (
    <>
      <PageHeader
        title="Tasks"
        description="Assign, prioritize, and track work across projects."
        actions={
          <Button className="gradient-primary text-primary-foreground shadow-glow">
            <Plus className="size-4" /> New task
          </Button>
        }
      />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {columns.map((col) => {
          const items = tasks.filter((t) => t.status === col.id);
          return (
            <Card key={col.id} className="glass shadow-elevated p-4 min-h-96">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-semibold">{col.title}</h3>
                <span className="text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                  {items.length}
                </span>
              </div>
              <div className="space-y-2">
                {items.map((t) => {
                  const a = employeeById(t.assigneeId);
                  return (
                    <div
                      key={t.id}
                      className="rounded-lg border border-border bg-card hover:border-primary/40 transition-colors p-3 cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-snug">{t.title}</p>
                        <StatusBadge status={t.priority} />
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {projectById(t.projectId)?.name}
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <Avatar className="size-6">
                          <AvatarFallback className="text-[10px]">
                            {initials(a?.fullName ?? "?")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-[11px] text-muted-foreground">
                          {formatDate(t.deadline)}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {items.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-6">No tasks</p>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
