import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Github, Mail, Lock } from "lucide-react";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotPassword, setForgotPassword] = useState("");
  const [forgotConfirm, setForgotConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const { signIn, socialSignIn, forgotPassword: forgotPasswordRequest } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailRegex.test(email.trim())) {
      toast.error("Please enter a valid email");
      return;
    }

    setLoading(true);
    try {
      await signIn(email.trim(), password);
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailRegex.test(forgotEmail.trim())) {
      toast.error("Please enter a valid email");
      return;
    }
    if (forgotPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (forgotPassword !== forgotConfirm) {
      toast.error("Passwords do not match");
      return;
    }

    setForgotLoading(true);
    try {
      await forgotPasswordRequest(forgotEmail.trim(), forgotPassword);
      toast.success("Password reset successful. You can now sign in.");
      setForgotOpen(false);
      setForgotEmail("");
      setForgotPassword("");
      setForgotConfirm("");
    } catch (err: any) {
      toast.error(err.message || "Password reset failed");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleSocialSignIn = async (provider: "google" | "github") => {
    try {
      await socialSignIn(provider);
      toast.success(`Signed in with ${provider}`);
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message || `Failed to sign in with ${provider}`);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#040507] px-4 py-6 text-white sm:px-8 sm:py-10">
      <div className="pointer-events-none absolute -left-20 top-1/2 h-[26rem] w-[26rem] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,#6d28d955_0%,#0ea5e922_40%,transparent_70%)] blur-2xl" />
      <div className="pointer-events-none absolute -right-24 top-16 h-[20rem] w-[20rem] rounded-full bg-[radial-gradient(circle,#06b6d455_0%,transparent_70%)] blur-2xl" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mx-auto w-full max-w-6xl overflow-hidden rounded-[26px] border border-white/10 bg-[linear-gradient(135deg,#07090c_0%,#05070a_40%,#040506_100%)] shadow-[0_40px_120px_rgba(0,0,0,0.8)]"
      >
        <div className="grid gap-8 px-5 py-8 sm:px-8 sm:py-10 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="relative hidden min-h-[26rem] overflow-hidden rounded-2xl border border-white/10 bg-black/30 p-7 lg:block">
            <div className="pointer-events-none absolute -left-10 top-1/2 h-[20rem] w-[20rem] -translate-y-1/2 rounded-full bg-[conic-gradient(from_45deg,#111827,#7c3aed,#06b6d4,#111827)] opacity-70 blur-2xl" />
            <div className="pointer-events-none absolute -right-8 bottom-8 h-56 w-56 rounded-full bg-[radial-gradient(circle,#22d3ee66_0%,transparent_70%)] blur-2xl" />
            <div className="relative z-10 mt-28 max-w-sm">
              <p className="text-xs uppercase tracking-[0.22em] text-white/50">Next generation</p>
              <h1 className="mt-3 text-4xl font-semibold leading-tight text-white">
                Technical workflow in one unified sprint ecosystem
              </h1>
              <p className="mt-4 text-sm text-white/60">
                Track boards, commits, and team delivery from one control surface.
              </p>
            </div>
          </section>

          <Card className="border-white/10 bg-white/[0.03] text-white backdrop-blur-xl">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl">Welcome back</CardTitle>
              <CardDescription className="text-white/60">Login to your account to continue</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white/80">Email</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="border-white/15 bg-black/30 pl-9 text-white placeholder:text-white/35"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white/80">Password</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="border-white/15 bg-black/30 pl-9 text-white placeholder:text-white/35"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
                    <DialogTrigger asChild>
                      <button type="button" className="text-xs text-white/60 hover:text-white">
                        Forgot password?
                      </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md border-white/10 bg-[#0a0d12] text-white">
                      <DialogHeader>
                        <DialogTitle>Reset Password</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleForgotPassword} className="space-y-3">
                        <div className="space-y-1">
                          <Label>Email</Label>
                          <Input
                            type="email"
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>New Password</Label>
                          <Input
                            type="password"
                            value={forgotPassword}
                            onChange={(e) => setForgotPassword(e.target.value)}
                            minLength={6}
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Confirm Password</Label>
                          <Input
                            type="password"
                            value={forgotConfirm}
                            onChange={(e) => setForgotConfirm(e.target.value)}
                            minLength={6}
                            required
                          />
                        </div>
                        <Button type="submit" className="w-full" disabled={forgotLoading}>
                          {forgotLoading ? "Resetting..." : "Reset Password"}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                <Button type="submit" className="w-full bg-white text-black hover:bg-white/90" disabled={loading}>
                  {loading ? "Signing in..." : "Login"}
                </Button>
              </form>

              <div className="my-4 flex items-center gap-3 text-xs text-white/45">
                <div className="h-px flex-1 bg-white/15" />
                <span>OR CONTINUE WITH</span>
                <div className="h-px flex-1 bg-white/15" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="border-white/20 bg-black/30 text-white hover:bg-white/10"
                  onClick={() => handleSocialSignIn("google")}
                >
                  <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-black">G</span>
                  Google
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="border-white/20 bg-black/30 text-white hover:bg-white/10"
                  onClick={() => handleSocialSignIn("github")}
                >
                  <Github className="mr-2 h-4 w-4" />
                  GitHub
                </Button>
              </div>

              <p className="mt-5 text-center text-sm text-white/60">
                Don't have an account?{" "}
                <Link to="/signup" className="text-white hover:underline">
                  Register now
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
