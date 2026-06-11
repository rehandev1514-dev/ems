import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Toaster } from "@/components/ui/sonner";
import { useAuth } from "@/lib/auth-store";
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_app")({
  // SSR-safe: don't read localStorage in beforeLoad. Gate in component instead.
  component: AppLayout,
});

function AppLayout() {
  const user = useAuth((s) => s.user);
  const loading = useAuth((s) => s.loading);
  const checkSession = useAuth((s) => s.checkSession);
  const navigate = useNavigate();

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/auth" });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
      <Toaster position="top-right" theme="dark" />
    </div>
  );
}

// Avoid unused import lint
void redirect;
