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
import { Github, Mail, Lock, Sparkles } from "lucide-react";

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
    <div className="min-h-screen bg-[#eceef1] p-4 sm:p-8">
      <div className="mx-auto max-w-6xl rounded-[28px] bg-[radial-gradient(circle_at_30%_10%,#0ea5e933_0%,transparent_40%),linear-gradient(135deg,#03161d_0%,#042d37_45%,#07252f_100%)] px-6 py-8 text-white shadow-2xl sm:px-10 sm:py-12">
        <div className="mb-8 flex items-center justify-center gap-2 text-cyan-200">
          <Sparkles className="h-5 w-5" />
          <span className="font-semibold tracking-wide">ISAI Workspace</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h1 className="text-3xl font-extrabold text-cyan-100 sm:text-5xl">Build with Confidence</h1>
          <p className="mt-2 text-lg text-cyan-300">Deploy with Ease</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="mx-auto mt-8 max-w-md"
        >
          <Card className="border-cyan-400/20 bg-[#06080ed9] text-white shadow-xl backdrop-blur">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl">Welcome back</CardTitle>
              <CardDescription className="text-cyan-200">Login to your account to continue</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-cyan-100">Email</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-300/60" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="border-cyan-400/20 bg-slate-900/70 pl-9 text-white"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-cyan-100">Password</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-300/60" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="border-cyan-400/20 bg-slate-900/70 pl-9 text-white"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
                    <DialogTrigger asChild>
                      <button type="button" className="text-xs text-cyan-300 hover:text-cyan-200">
                        Forgot password?
                      </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
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

                <Button type="submit" className="w-full bg-cyan-500 text-black hover:bg-cyan-400" disabled={loading}>
                  {loading ? "Signing in..." : "Login"}
                </Button>
              </form>

              <div className="my-4 flex items-center gap-3 text-xs text-slate-400">
                <div className="h-px flex-1 bg-slate-700" />
                <span>OR CONTINUE WITH</span>
                <div className="h-px flex-1 bg-slate-700" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="border-slate-600 bg-slate-900/40 text-white hover:bg-slate-800"
                  onClick={() => handleSocialSignIn("google")}
                >
                  <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-black">G</span>
                  Google
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="border-slate-600 bg-slate-900/40 text-white hover:bg-slate-800"
                  onClick={() => handleSocialSignIn("github")}
                >
                  <Github className="mr-2 h-4 w-4" />
                  GitHub
                </Button>
              </div>

              <p className="mt-5 text-center text-sm text-cyan-200">
                Don't have an account?{" "}
                <Link to="/signup" className="text-cyan-300 hover:text-cyan-100 hover:underline">
                  Register now
                </Link>
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
