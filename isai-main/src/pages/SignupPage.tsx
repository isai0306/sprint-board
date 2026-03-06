import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Github, UserRound, Mail, Lock, Sparkles } from "lucide-react";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUp, socialSignIn } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const inviteToken = params.get("invite");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailRegex.test(email.trim())) {
      toast.error("Please enter a valid email");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      await signUp(email.trim(), password, username.trim(), inviteToken);
      toast.success("Account created!");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSocial = async (provider: "google" | "github") => {
    try {
      await socialSignIn(provider);
      toast.success(`Signed up with ${provider}`);
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Social signup failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#eceef1] p-4 sm:p-8">
      <div className="mx-auto max-w-6xl rounded-[28px] bg-[radial-gradient(circle_at_75%_10%,#38bdf833_0%,transparent_45%),linear-gradient(135deg,#07111a_0%,#082633_45%,#112543_100%)] px-6 py-8 text-white shadow-2xl sm:px-10 sm:py-12">
        <div className="mb-8 flex items-center justify-center gap-2 text-cyan-200">
          <Sparkles className="h-5 w-5" />
          <span className="font-semibold tracking-wide">ISAI Workspace</span>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-extrabold text-cyan-100 sm:text-5xl">Launch Your Team Workspace</h1>
          <p className="mt-2 text-lg text-cyan-300">Create account and start shipping faster</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="mx-auto mt-8 max-w-md">
          <Card className="border-cyan-400/20 bg-[#06080ed9] text-white shadow-xl backdrop-blur">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Create account</CardTitle>
              <CardDescription className="text-cyan-200">Get started with your new project hub</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-cyan-100">Username</Label>
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-300/60" />
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="border-cyan-400/20 bg-slate-900/70 pl-9 text-white"
                      placeholder="Your name"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-cyan-100">Email</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-300/60" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="border-cyan-400/20 bg-slate-900/70 pl-9 text-white"
                      placeholder="you@example.com"
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
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="border-cyan-400/20 bg-slate-900/70 pl-9 text-white"
                      minLength={6}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-cyan-500 text-black hover:bg-cyan-400" disabled={loading}>
                  {loading ? "Creating account..." : "Create account"}
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
                  onClick={() => handleSocial("google")}
                >
                  <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-black">G</span>
                  Google
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="border-slate-600 bg-slate-900/40 text-white hover:bg-slate-800"
                  onClick={() => handleSocial("github")}
                >
                  <Github className="mr-2 h-4 w-4" />
                  GitHub
                </Button>
              </div>

              <p className="mt-5 text-center text-sm text-cyan-200">
                Already have an account?{" "}
                <Link to="/login" className="text-cyan-300 hover:text-cyan-100 hover:underline">
                  Sign in
                </Link>
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
