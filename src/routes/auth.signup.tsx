import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Hexagon, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { Role } from "@/lib/mock-data";

export const Route = createFileRoute("/auth/signup")({
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const signup = useAuth((s) => s.signup);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [departmentId, setDepartmentId] = useState("d1");
  const [designation, setDesignation] = useState("Software Engineer");
  const [role, setRole] = useState<Role>("employee");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/dashboard" });
  }, [user, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName || !email || !password || !designation) {
      toast.error("All fields are required");
      return;
    }
    setLoading(true);
    try {
      const res = await signup(fullName, email, password, departmentId, designation, role);
      if (res && (res as any).isPending) {
        toast.success("Registration request submitted! Your account is pending administrator approval.");
        navigate({ to: "/auth" });
      } else {
        toast.success(`Welcome, ${fullName.split(" ")[0]}! Your account has been registered.`);
        navigate({ to: "/dashboard" });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to register account");
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
            <div className="text-xs uppercase tracking-[0.18em] opacity-80">Code Vertex Solutions</div>
          </div>
        </div>

        <div className="relative text-primary-foreground space-y-6">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] bg-white/15 backdrop-blur px-3 py-1.5 rounded-full border border-white/20">
            <Sparkles className="size-3.5" /> Enterprise EMS Platform
          </div>
          <h1 className="font-display text-5xl font-semibold leading-[1.05] max-w-md">
            Join the premium enterprise workspace today.
          </h1>
          <p className="text-base opacity-90 max-w-md">
            Set up your professional identity, select your workspace department,
            and access unified tracking features instantly.
          </p>
          <div className="grid grid-cols-3 gap-4 max-w-md pt-4">
            {[["12+", "Modules"], ["RBAC", "First-class"], ["Realtime", "Insights"]].map(([v, l]) => (
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
      <div className="flex items-center justify-center p-6 md:p-12 overflow-y-auto">
        <Card className="w-full max-w-md glass shadow-elevated p-8 my-8">
          <div className="lg:hidden flex items-center gap-2.5 mb-6">
            <div className="size-9 rounded-lg gradient-primary flex items-center justify-center">
              <Hexagon className="size-5 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <div className="font-display font-semibold">VertexEMS</div>
          </div>

          <h2 className="font-display text-2xl font-semibold">Create your workspace account</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Complete the form below to register on the platform.
          </p>

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Doe" required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Work Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane.doe@codevertex.io" required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="department">Department</Label>
                <select 
                  id="department"
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 h-10 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="d1">Engineering</option>
                  <option value="d2">Design</option>
                  <option value="d3">Human Resources</option>
                  <option value="d4">Sales & Marketing</option>
                  <option value="d5">Finance</option>
                  <option value="d6">Operations</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="role">Work Role</Label>
                <select 
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="w-full rounded-md border border-input bg-background px-3 h-10 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="accountant">Accountant</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="designation">Designation</Label>
              <Input id="designation" type="text" value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="Software Engineer" required />
            </div>

            <Button type="submit" className="w-full gradient-primary text-primary-foreground hover:opacity-95 shadow-glow h-10 mt-2" disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : "Register Account"}
            </Button>

            <div className="text-center text-sm text-muted-foreground mt-4">
              Already have an account?{" "}
              <Link to="/auth" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
