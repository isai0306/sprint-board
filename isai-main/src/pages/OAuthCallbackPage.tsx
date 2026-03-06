import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function OAuthCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { completeOAuthLogin } = useAuth();

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      toast.error("OAuth login failed");
      navigate("/login", { replace: true });
      return;
    }

    completeOAuthLogin(token)
      .then(() => {
        toast.success("Signed in successfully");
        navigate("/dashboard", { replace: true });
      })
      .catch((err: any) => {
        toast.error(err?.message || "OAuth login failed");
        navigate("/login", { replace: true });
      });
  }, [completeOAuthLogin, navigate, params]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}
