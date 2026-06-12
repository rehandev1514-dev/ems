import { useState } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Hexagon } from "lucide-react";
import { toast } from "sonner";

export function ForgotPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-md glass shadow-elevated p-8">
        <div className="flex items-center gap-2.5 mb-6">
          <div className="size-9 rounded-lg gradient-primary flex items-center justify-center">
            <Hexagon className="size-5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <div className="font-display font-semibold">VertexEMS</div>
        </div>
        <h2 className="font-display text-2xl font-semibold">Reset your password</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Enter your work email and we'll send you a recovery link.
        </p>
        {sent ? (
          <div className="mt-6 rounded-lg border border-[--color-success]/30 bg-[--color-success]/10 p-4 text-sm">
            If <strong>{email}</strong> exists in our directory, a reset link is on its way.
          </div>
        ) : (
          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!email) return;
              setSent(true);
              toast.success("Recovery email sent");
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="email">Work email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              className="w-full gradient-primary text-primary-foreground hover:opacity-95 shadow-glow h-10"
            >
              Send recovery link
            </Button>
          </form>
        )}
        <Link
          to="/auth"
          className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to sign in
        </Link>
      </Card>
    </div>
  );
}
