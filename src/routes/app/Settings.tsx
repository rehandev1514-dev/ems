import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Hexagon } from "lucide-react";

export function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage company profile, security, and notification preferences."
      />

      <Tabs defaultValue="company">
        <TabsList>
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <Card className="glass shadow-elevated p-6 max-w-3xl">
            <div className="flex items-center gap-4 pb-6 border-b border-border">
              <div className="size-14 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
                <Hexagon className="size-7 text-primary-foreground" strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold">Code Vertex Solutions</h3>
                <p className="text-sm text-muted-foreground">
                  Enterprise software studio · Karachi, Pakistan
                </p>
              </div>
              <Button variant="outline" className="ml-auto">
                Replace logo
              </Button>
            </div>
            <form
              className="grid sm:grid-cols-2 gap-4 mt-6"
              onSubmit={(e) => {
                e.preventDefault();
                toast.success("Company settings saved");
              }}
            >
              <div className="space-y-1.5">
                <Label>Company name</Label>
                <Input defaultValue="Code Vertex Solutions" />
              </div>
              <div className="space-y-1.5">
                <Label>Legal email</Label>
                <Input defaultValue="hello@codevertex.io" />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input defaultValue="+92 21 1234 5678" />
              </div>
              <div className="space-y-1.5">
                <Label>Website</Label>
                <Input defaultValue="https://codevertex.io" />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label>Address</Label>
                <Input defaultValue="Office 405, Shaheen Complex, Karachi" />
              </div>
              <div className="sm:col-span-2">
                <Button className="gradient-primary text-primary-foreground">Save changes</Button>
              </div>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card className="glass shadow-elevated p-6 max-w-3xl space-y-5">
            <Section title="Password" desc="Use a strong, unique password.">
              <Button variant="outline">Change password</Button>
            </Section>
            <Separator />
            <Section title="Two-factor authentication" desc="Add an extra layer using TOTP.">
              <Switch defaultChecked />
            </Section>
            <Separator />
            <Section title="Session timeout" desc="Auto sign-out after inactivity.">
              <Input type="number" defaultValue={30} className="w-24" />
            </Section>
            <Separator />
            <Section title="Active sessions" desc="Sign out of all other browsers.">
              <Button variant="outline">Revoke all</Button>
            </Section>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="glass shadow-elevated p-6 max-w-3xl space-y-5">
            <Section title="Email — leave requests" desc="Get notified of new requests.">
              <Switch defaultChecked />
            </Section>
            <Separator />
            <Section title="Email — task assignments" desc="When a task is assigned to you.">
              <Switch defaultChecked />
            </Section>
            <Separator />
            <Section title="Email — attendance anomalies" desc="Late arrivals, missed days.">
              <Switch />
            </Section>
            <Separator />
            <Section title="In-app notifications" desc="Show real-time alerts in the topbar.">
              <Switch defaultChecked />
            </Section>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}

function Section({
  title,
  desc,
  children,
}: {
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="font-medium">{title}</div>
        <div className="text-sm text-muted-foreground">{desc}</div>
      </div>
      {children}
    </div>
  );
}
