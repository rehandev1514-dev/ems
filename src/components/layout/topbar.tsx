import { useAuth } from "@/lib/auth-store";
import { useNavigate } from "react-router";
import { Bell, Search, LogOut, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { initials } from "@/lib/format";
import { notifications } from "@/lib/mock-data";

const roleLabels: Record<string, string> = {
  admin: "Administrator",
  hr: "HR Specialist",
  manager: "Manager",
  employee: "Employee",
  supervisor: "Supervisor",
  accountant: "Accountant",
};

export function Topbar() {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const navigate = useNavigate();
  if (!user) return null;

  const unread = notifications.filter((n) => n.unread).length;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/70 backdrop-blur-xl px-4 md:px-6">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search employees, projects, tasks…"
          className="pl-9 h-9 bg-muted/40 border-border focus-visible:ring-primary/40"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger className="relative inline-flex items-center justify-center size-9 rounded-lg border border-border bg-card hover:bg-accent transition-colors">
            <Bell className="size-4" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 size-4 rounded-full text-[10px] font-semibold gradient-primary text-primary-foreground flex items-center justify-center">
                {unread}
              </span>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.slice(0, 5).map((n) => (
              <DropdownMenuItem key={n.id} className="flex-col items-start gap-1 py-2">
                <div className="flex w-full items-center gap-2">
                  <span className="font-medium text-sm">{n.title}</span>
                  {n.unread && <span className="ml-auto size-1.5 rounded-full bg-primary" />}
                </div>
                <span className="text-xs text-muted-foreground">{n.body}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User profile menu — no role switching */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-lg border border-border bg-card hover:bg-accent px-2 py-1.5 transition-colors">
            <Avatar className="size-7">
              <AvatarFallback className="gradient-primary text-primary-foreground text-xs font-semibold">
                {initials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:block text-left leading-tight">
              <div className="text-xs font-medium">{user.name}</div>
              <div className="text-[10px] text-muted-foreground">
                {roleLabels[user.role] ?? user.role}
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>
              <div className="text-sm font-medium">{user.name}</div>
              <div className="text-xs text-muted-foreground font-normal">{user.email}</div>
              <div className="text-xs text-primary font-medium mt-0.5 capitalize">
                {roleLabels[user.role] ?? user.role}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2">
              <User className="size-4" /> My profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 text-destructive focus:text-destructive"
              onClick={async () => {
                await logout();
                navigate("/auth");
              }}
            >
              <LogOut className="size-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
