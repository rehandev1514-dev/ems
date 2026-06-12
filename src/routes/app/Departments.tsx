import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { departments, employees, employeeById } from "@/lib/mock-data";
import { Building2, Plus, Users } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials, formatDate } from "@/lib/format";

export function DepartmentsPage() {
  return (
    <>
      <PageHeader
        title="Departments"
        description="Organize teams, assign managers, and monitor headcount distribution."
        actions={
          <Button className="gradient-primary text-primary-foreground shadow-glow">
            <Plus className="size-4" /> New department
          </Button>
        }
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map((d) => {
          const manager = d.managerId ? employeeById(d.managerId) : null;
          const members = employees.filter((e) => e.departmentId === d.id);
          return (
            <Card
              key={d.id}
              className="p-5 glass shadow-elevated hover:border-primary/40 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="size-11 rounded-xl gradient-primary/15 bg-primary/10 flex items-center justify-center">
                  <Building2 className="size-5 text-primary" />
                </div>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {d.code}
                </span>
              </div>
              <h3 className="font-display text-lg font-semibold">{d.name}</h3>
              <p className="text-xs text-muted-foreground">Created {formatDate(d.createdAt)}</p>

              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  {manager ? (
                    <>
                      <Avatar className="size-7">
                        <AvatarFallback className="text-[10px]">
                          {initials(manager.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="leading-tight">
                        <div className="text-xs font-medium">{manager.fullName.split(" ")[0]}</div>
                        <div className="text-[10px] text-muted-foreground">Manager</div>
                      </div>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">No manager assigned</span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="size-4" /> {members.length}
                </div>
              </div>

              <div className="mt-3 flex -space-x-2">
                {members.slice(0, 5).map((m) => (
                  <Avatar key={m.id} className="size-7 ring-2 ring-card">
                    <AvatarFallback className="text-[10px] gradient-primary text-primary-foreground">
                      {initials(m.fullName)}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {members.length > 5 && (
                  <div className="size-7 rounded-full bg-muted ring-2 ring-card text-[10px] flex items-center justify-center">
                    +{members.length - 5}
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
