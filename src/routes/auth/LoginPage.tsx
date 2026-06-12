import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router";
import { useAuth } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Hexagon, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

export function LoginPage() {
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const login = useAuth((s) => s.login);
  const [email, setEmail] = useState("admin@codevertex.io");
  const [password, setPassword] = useState("demo1234");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Email and password required");
      return;
    }
    setLoading(true);
    try {
      const u = await login(email, password, remember);
      toast.success(`Welcome back, ${u.name.split(" ")[0]}`);
      navigate("/dashboard");
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-90" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.25),transparent_50%)]" />
        <div className="absolute -bottom-32 -right-32 size-96 rounded-full bg-white/10 blur-3xl" />

        <div className="relative flex items-center gap-3 text-primary-foreground">
          <div className="size-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center border border-white/20">
            <Hexagon className="size-5" strokeWidth={2.5} />
          </div>
          <div className="leading-tight">
            <div className="font-display text-lg font-semibold">VertexEMS</div>
            <div className="text-xs uppercase tracking-[0.18em] opacity-80">
              Code Vertex Solutions
            </div>
          </div>
        </div>

        <div className="relative text-primary-foreground space-y-6">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] bg-white/15 backdrop-blur px-3 py-1.5 rounded-full border border-white/20">
            <Sparkles className="size-3.5" /> Enterprise EMS Platform
          </div>
          <h1 className="font-display text-5xl font-semibold leading-[1.05] max-w-md">
            Run your entire workforce from one premium workspace.
          </h1>
          <p className="text-base opacity-90 max-w-md">
            Employees, attendance, leave, projects, assets and audit logs — unified, role-aware, and
            built for scale.
          </p>
          <div className="grid grid-cols-3 gap-4 max-w-md pt-4">
            {[
              ["12+", "Modules"],
              ["RBAC", "First-class"],
              ["Realtime", "Insights"],
            ].map(([v, l]) => (
              <div key={l} className="border-l-2 border-white/30 pl-3">
                <div className="font-display text-2xl font-semibold">{v}</div>
                <div className="text-xs uppercase tracking-wider opacity-80">{l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative text-xs text-primary-foreground/80">
          © {new Date().getFullYear()} Code Vertex Solutions. All rights reserved.
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 md:p-12">
        <Card className="w-full max-w-md glass shadow-elevated p-8">
          <div className="lg:hidden flex items-center gap-2.5 mb-6">
            <div className="size-9 rounded-lg gradient-primary flex items-center justify-center">
              <Hexagon className="size-5 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <div className="font-display font-semibold">VertexEMS</div>
          </div>

          <h2 className="font-display text-2xl font-semibold">Sign in to your workspace</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Enter your credentials to access the platform.
          </p>

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <div className="space-y-1.5">
              <Label htmlFor="email">Work email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link to="/auth/forgot" className="text-xs text-primary hover:underline">
                  Forgot?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground select-none">
              <Checkbox checked={remember} onCheckedChange={(v) => setRemember(!!v)} />
              Remember me for 30 days
            </label>

            <Button
              type="submit"
              className="w-full gradient-primary text-primary-foreground hover:opacity-95 shadow-glow h-10"
              disabled={loading}
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : "Sign in"}
            </Button>

            <div className="text-center text-sm text-muted-foreground mt-4">
              Don't have an account?{" "}
              <Link to="/auth/signup" className="text-primary hover:underline font-medium">
                Register here
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
