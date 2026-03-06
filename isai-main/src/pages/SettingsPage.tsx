import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/context/ThemeContext";
import {
  useInvitations,
  useSendInvitations,
  useSettings,
  useUpdateGeneralSettings,
  useUpdateNotificationSettings,
  useUsersManagement,
} from "@/hooks/useSettings";
import { toast } from "sonner";
import { Bell, Moon, Settings2, Sun, UserPlus, Users } from "lucide-react";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { data: settings } = useSettings();
  const { data: users } = useUsersManagement();
  const { data: invitations } = useInvitations();
  const updateGeneral = useUpdateGeneralSettings();
  const updateNotifications = useUpdateNotificationSettings();
  const sendInvites = useSendInvitations();

  const [emailsInput, setEmailsInput] = useState("");
  const [groupsInput, setGroupsInput] = useState("");

  const [general, setGeneral] = useState({
    workspace_name: settings?.general?.workspace_name || "My Workspace",
    language: settings?.general?.language || "en",
    timezone: settings?.general?.timezone || "Asia/Kolkata",
    week_starts_on: settings?.general?.week_starts_on || "monday",
  });

  const [notifications, setNotifications] = useState({
    email_mentions: settings?.notifications?.email_mentions ?? true,
    email_comments: settings?.notifications?.email_comments ?? true,
    email_invites: settings?.notifications?.email_invites ?? true,
    push_enabled: settings?.notifications?.push_enabled ?? false,
    weekly_digest: settings?.notifications?.weekly_digest ?? true,
  });

  const [roles, setRoles] = useState({
    goals: "user",
    jira: "user",
    projects: "user",
    jira_admin: "none",
  });

  useEffect(() => {
    if (!settings) return;
    setGeneral({
      workspace_name: settings.general?.workspace_name || "My Workspace",
      language: settings.general?.language || "en",
      timezone: settings.general?.timezone || "Asia/Kolkata",
      week_starts_on: settings.general?.week_starts_on || "monday",
    });
    setNotifications({
      email_mentions: settings.notifications?.email_mentions ?? true,
      email_comments: settings.notifications?.email_comments ?? true,
      email_invites: settings.notifications?.email_invites ?? true,
      push_enabled: settings.notifications?.push_enabled ?? false,
      weekly_digest: settings.notifications?.weekly_digest ?? true,
    });
  }, [settings]);

  const handleSaveGeneral = async () => {
    try {
      await updateGeneral.mutateAsync(general);
      toast.success("General settings updated");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleSaveNotifications = async () => {
    try {
      await updateNotifications.mutateAsync(notifications);
      toast.success("Notification settings updated");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleSendInvites = async () => {
    const emails = emailsInput
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    if (!emails.length) {
      toast.error("Add at least one email address");
      return;
    }

    const invalid = emails.find((e) => !emailRegex.test(e));
    if (invalid) {
      toast.error(`Invalid email: ${invalid}`);
      return;
    }

    try {
      const groups = groupsInput
        .split(",")
        .map((g) => g.trim())
        .filter(Boolean);

      const result = await sendInvites.mutateAsync({
        emails,
        app_roles: roles,
        groups,
      });

      const failed = result.results.filter((r) => !r.ok);
      if (!failed.length) {
        toast.success("Invitations sent successfully");
      } else {
        toast.warning(`Some invites failed: ${failed.map((f) => f.email).join(", ")}`);
      }
      setEmailsInput("");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">General management, notifications, users, and invitations</p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="invite">Invite People</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card className="transition-all duration-300 hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Settings2 className="h-5 w-5" /> General Management</CardTitle>
              <CardDescription>Workspace preferences and appearance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Workspace Name</Label>
                  <Input
                    value={general.workspace_name}
                    onChange={(e) => setGeneral((s) => ({ ...s, workspace_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select value={general.language} onValueChange={(v) => setGeneral((s) => ({ ...s, language: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="hi">Hindi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Input
                    value={general.timezone}
                    onChange={(e) => setGeneral((s) => ({ ...s, timezone: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Week Starts On</Label>
                  <Select
                    value={general.week_starts_on}
                    onValueChange={(v) => setGeneral((s) => ({ ...s, week_starts_on: v }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monday">Monday</SelectItem>
                      <SelectItem value="sunday">Sunday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between rounded-md border p-3">
                <div className="flex items-center gap-3">
                  {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                  <div>
                    <Label>Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">Toggle dark theme</p>
                  </div>
                </div>
                <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
              </div>

              <Button onClick={handleSaveGeneral} disabled={updateGeneral.isPending}>
                {updateGeneral.isPending ? "Saving..." : "Save General Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="transition-all duration-300 hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> Notification Settings</CardTitle>
              <CardDescription>Choose how and when to receive updates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                ["Email mentions", "email_mentions"],
                ["Email comments", "email_comments"],
                ["Email invites", "email_invites"],
                ["Push notifications", "push_enabled"],
                ["Weekly digest", "weekly_digest"],
              ].map(([label, key]) => (
                <div key={key} className="flex items-center justify-between rounded-md border p-3">
                  <Label>{label}</Label>
                  <Switch
                    checked={(notifications as any)[key]}
                    onCheckedChange={(checked) =>
                      setNotifications((prev) => ({ ...prev, [key]: checked }))
                    }
                  />
                </div>
              ))}

              <Button onClick={handleSaveNotifications} disabled={updateNotifications.isPending}>
                {updateNotifications.isPending ? "Saving..." : "Save Notification Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card className="transition-all duration-300 hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> User Management</CardTitle>
              <CardDescription>Manage active users and invitation status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {users?.map((member) => (
                <div key={`${member.email}-${member.id}`} className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <p className="font-medium">{member.username}</p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">{member.role || "user"}</Badge>
                    <Badge className="capitalize">{member.status}</Badge>
                  </div>
                </div>
              ))}
              {!users?.length && <p className="text-sm text-muted-foreground">No users found</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invite">
          <Card className="transition-all duration-300 hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5" /> Invite people</CardTitle>
              <CardDescription>
                Invite teammates to collaborate. Separate multiple emails with commas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Email addresses</Label>
                <Input
                  value={emailsInput}
                  onChange={(e) => setEmailsInput(e.target.value)}
                  placeholder="Invite by email address..."
                />
                <p className="text-xs text-muted-foreground">Example: one@company.com, two@company.com</p>
              </div>

              <div className="space-y-3 rounded-md border p-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label>Goals role</Label>
                    <Select value={roles.goals} onValueChange={(v) => setRoles((s) => ({ ...s, goals: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="app_admin">App admin</SelectItem>
                        <SelectItem value="user_access_admin">User access admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Jira role</Label>
                    <Select value={roles.jira} onValueChange={(v) => setRoles((s) => ({ ...s, jira: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="app_admin">App admin</SelectItem>
                        <SelectItem value="user_access_admin">User access admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Projects role</Label>
                    <Select value={roles.projects} onValueChange={(v) => setRoles((s) => ({ ...s, projects: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="app_admin">App admin</SelectItem>
                        <SelectItem value="user_access_admin">User access admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Jira Administration</Label>
                    <Select value={roles.jira_admin} onValueChange={(v) => setRoles((s) => ({ ...s, jira_admin: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="app_admin">App admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Group membership</Label>
                  <Input
                    value={groupsInput}
                    onChange={(e) => setGroupsInput(e.target.value)}
                    placeholder="Add groups (comma separated)"
                  />
                </div>
              </div>

              <Button onClick={handleSendInvites} disabled={sendInvites.isPending}>
                {sendInvites.isPending ? "Sending invitations..." : "Send Invitations"}
              </Button>

              <Separator />

              <div className="space-y-2">
                <h3 className="font-semibold">Recent invitations</h3>
                {invitations?.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <p className="font-medium">{inv.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Expires: {new Date(inv.expires_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className="capitalize">{inv.status}</Badge>
                  </div>
                ))}
                {!invitations?.length && (
                  <p className="text-sm text-muted-foreground">No invitations sent yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
