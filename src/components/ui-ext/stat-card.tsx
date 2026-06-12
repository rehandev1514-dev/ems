import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: string; positive?: boolean };
  accent?: "primary" | "secondary" | "info" | "success" | "warning";
  className?: string;
}

const accents = {
  primary: "from-primary/20 to-primary/0 text-primary",
  secondary: "from-secondary/20 to-secondary/0 text-secondary",
  info: "from-[--color-info]/20 to-[--color-info]/0 text-[--color-info]",
  success: "from-[--color-success]/20 to-[--color-success]/0 text-[--color-success]",
  warning: "from-[--color-warning]/20 to-[--color-warning]/0 text-[--color-warning]",
};

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  accent = "primary",
  className,
}: StatCardProps) {
  return (
    <Card className={cn("relative overflow-hidden p-5 glass shadow-elevated", className)}>
      <div
        className={cn(
          "absolute -top-10 -right-10 size-32 rounded-full blur-3xl bg-linear-to-br opacity-60",
          accents[accent],
        )}
      />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
            {label}
          </p>
          <p className="mt-2 text-3xl font-semibold font-display">{value}</p>
          {trend && (
            <p
              className={cn(
                "mt-1.5 text-xs font-medium",
                trend.positive ? "text-[--color-success]" : "text-destructive",
              )}
            >
              {trend.positive ? "▲" : "▼"} {trend.value}
            </p>
          )}
        </div>
        <div
          className={cn(
            "size-10 rounded-lg flex items-center justify-center border border-border bg-card",
            accents[accent].replace("from-", "").split(" ")[2],
          )}
        >
          <Icon className="size-5" />
        </div>
      </div>
    </Card>
  );
}
