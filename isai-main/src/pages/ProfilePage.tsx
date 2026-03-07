import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Invalid image"));
    img.src = src;
  });
}

async function compressToAvatar(dataUrl: string): Promise<string> {
  const img = await loadImage(dataUrl);
  const maxSize = 256;
  const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to process image");

  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", 0.82);
}

export default function ProfilePage() {
  const { user, changePassword } = useAuth();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();

  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");
  const [bio, setBio] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [timezone, setTimezone] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (!profile) return;
    setUsername(profile.username || "");
    setRole(profile.role || "");
    setBio(profile.bio || "");
    setCompany(profile.company || "");
    setLocation(profile.location || "");
    setTimezone(profile.timezone || "");
    setPhone(profile.phone || "");
    setWebsite(profile.website || "");
    setAvatarUrl(profile.avatar_url || "");
  }, [profile]);

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    try {
      const raw = await readFileAsDataUrl(file);
      const compressed = await compressToAvatar(raw);
      if (compressed.length > 700000) {
        toast.error("Image is too large. Please upload a smaller image.");
        return;
      }
      setAvatarUrl(compressed);
    } catch (err: any) {
      toast.error(err.message || "Failed to load image");
    } finally {
      e.currentTarget.value = "";
    }
  };

  const handleSaveProfile = async () => {
    if (!username.trim()) {
      toast.error("Username is required");
      return;
    }

    try {
      await updateProfile.mutateAsync({
        username: username.trim(),
        role: role.trim(),
        bio: bio.trim(),
        company: company.trim(),
        location: location.trim(),
        timezone: timezone.trim(),
        phone: phone.trim(),
        website: website.trim(),
        avatar_url: avatarUrl.trim(),
      });
      toast.success("Profile updated!");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    try {
      await changePassword(newPassword);
      toast.success("Password updated!");
      setNewPassword("");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-muted-foreground">Manage account details and personal workspace identity</p>
      </div>

      <Card className="transition-all duration-300 hover:shadow-lg">
        <CardHeader>
          <CardTitle>Account Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 ring-2 ring-primary/25">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                {(username || user?.email || "U")[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{username || "User"}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
            <div className="space-y-2">
              <Label>Profile Picture URL (optional)</Label>
              <Input
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
              />
            </div>
            <div className="self-end">
              <Button type="button" variant="outline" asChild>
                <label className="cursor-pointer">
                  Upload Image
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarFileChange} />
                </label>
              </Button>
            </div>
            <div className="self-end">
              <Button type="button" variant="ghost" onClick={() => setAvatarUrl("")}>
                Remove
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Username</Label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} maxLength={50} />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Product Manager" maxLength={80} />
            </div>
            <div className="space-y-2">
              <Label>Company</Label>
              <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Acme Inc" maxLength={100} />
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Bengaluru, India" maxLength={100} />
            </div>
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Input value={timezone} onChange={(e) => setTimezone(e.target.value)} placeholder="Asia/Kolkata" maxLength={80} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 9XXXXXXXXX" maxLength={30} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Website</Label>
              <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://your-site.com" maxLength={200} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Bio</Label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Write a short bio"
                maxLength={300}
                rows={4}
              />
            </div>
          </div>

          <Button onClick={handleSaveProfile} disabled={updateProfile.isPending} className="transition-all duration-300">
            {updateProfile.isPending ? "Saving..." : "Save Profile"}
          </Button>
        </CardContent>
      </Card>

      <Card className="transition-all duration-300 hover:shadow-lg">
        <CardHeader>
          <CardTitle>Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Label>New Password</Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="********"
              minLength={6}
            />
            <Button onClick={handleUpdatePassword}>Update Password</Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
