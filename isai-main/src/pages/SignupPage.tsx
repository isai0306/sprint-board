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
    <div className="relative min-h-screen overflow-hidden bg-[#040507] px-4 py-6 text-white sm:px-8 sm:py-10">
      <div className="pointer-events-none absolute -left-20 top-1/2 h-[26rem] w-[26rem] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,#7c3aed55_0%,#0ea5e922_40%,transparent_70%)] blur-2xl" />
      <div className="pointer-events-none absolute -right-24 top-16 h-[20rem] w-[20rem] rounded-full bg-[radial-gradient(circle,#22d3ee55_0%,transparent_70%)] blur-2xl" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mx-auto w-full max-w-6xl overflow-hidden rounded-[26px] border border-white/10 bg-[linear-gradient(135deg,#07090c_0%,#05070a_40%,#040506_100%)] shadow-[0_40px_120px_rgba(0,0,0,0.8)]"
      >
        <header className="flex items-center justify-between border-b border-white/10 px-5 py-4 text-xs text-white/70 sm:px-8">
          <div className="flex items-center gap-2 text-sm font-medium text-white">
            <Sparkles className="h-4 w-4 text-cyan-300" />
            Sprint Board
          </div>
          <nav className="hidden items-center gap-7 sm:flex">
            <span>Our platform</span>
            <span>Why us</span>
            <span>About</span>
            <span>Contact</span>
          </nav>
          <Link to="/login" className="rounded-full border border-white/20 px-3 py-1 text-[11px] text-white/90 hover:bg-white/10">
            Sign in
          </Link>
        </header>

        <div className="grid gap-8 px-5 py-8 sm:px-8 sm:py-10 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="relative hidden min-h-[26rem] overflow-hidden rounded-2xl border border-white/10 bg-black/30 p-7 lg:block">
            <div className="pointer-events-none absolute -left-10 top-1/2 h-[20rem] w-[20rem] -translate-y-1/2 rounded-full bg-[conic-gradient(from_15deg,#111827,#06b6d4,#a855f7,#111827)] opacity-70 blur-2xl" />
            <div className="pointer-events-none absolute -right-8 bottom-8 h-56 w-56 rounded-full bg-[radial-gradient(circle,#a855f766_0%,transparent_70%)] blur-2xl" />
            <div className="relative z-10 mt-28 max-w-sm">
              <p className="text-xs uppercase tracking-[0.22em] text-white/50">Plan. Track. Deliver.</p>
              <h1 className="mt-3 text-4xl font-semibold leading-tight text-white">
                Your complete sprint management solution
              </h1>
              <p className="mt-4 text-sm text-white/60">
                Plan. Track. Deliver at login - manage tasks, teams, and deliverables in one unified platform.
              </p>
            </div>
          </section>

          <Card className="border-white/10 bg-white/[0.03] text-white backdrop-blur-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Create account</CardTitle>
              <CardDescription className="text-white/60">Get started with your new project hub</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-white/80">Username</Label>
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="border-white/15 bg-black/30 pl-9 text-white placeholder:text-white/35"
                      placeholder="Your name"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white/80">Email</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="border-white/15 bg-black/30 pl-9 text-white placeholder:text-white/35"
                      placeholder="you@example.com"
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
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="border-white/15 bg-black/30 pl-9 text-white placeholder:text-white/35"
                      minLength={6}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-white text-black hover:bg-white/90" disabled={loading}>
                  {loading ? "Creating account..." : "Create account"}
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
                  onClick={() => handleSocial("google")}
                >
                  <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-black">G</span>
                  Google
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="border-white/20 bg-black/30 text-white hover:bg-white/10"
                  onClick={() => handleSocial("github")}
                >
                  <Github className="mr-2 h-4 w-4" />
                  GitHub
                </Button>
              </div>

              <p className="mt-5 text-center text-sm text-white/60">
                Already have an account?{" "}
                <Link to="/login" className="text-white hover:underline">
                  Sign in
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
