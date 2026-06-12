import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { notifications } from "@/lib/mock-data";
import { Bell, Plane, ListChecks, Clock, FolderKanban, Cog } from "lucide-react";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const icons = {
  leave: Plane,
  task: ListChecks,
  attendance: Clock,
  project: FolderKanban,
  system: Cog,
};

export function NotificationsPage() {
  return (
    <>
      <PageHeader
        title="Notifications"
        description="System and team alerts, sorted by recency."
        actions={<Button variant="outline">Mark all as read</Button>}
      />
      <Card className="glass shadow-elevated divide-y divide-border">
        {notifications.map((n) => {
          const Icon = icons[n.kind] ?? Bell;
          return (
            <div
              key={n.id}
              className={cn(
                "flex items-start gap-4 p-4 hover:bg-accent/30 transition-colors",
                n.unread && "bg-primary/3",
              )}
            >
              <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="size-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{n.title}</p>
                  {n.unread && <span className="size-1.5 rounded-full bg-primary" />}
                </div>
                <p className="text-sm text-muted-foreground">{n.body}</p>
                <p className="text-xs text-muted-foreground mt-1">{relativeTime(n.createdAt)}</p>
              </div>
            </div>
          );
        })}
      </Card>
    </>
  );
}
