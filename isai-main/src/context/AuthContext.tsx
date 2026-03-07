import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { API_URL, apiRequest, clearToken, getToken, setToken } from "@/lib/api";
import { AppUser, AuthSession } from "@/types/auth";

interface AuthContextType {
  user: AppUser | null;
  session: AuthSession | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string, inviteToken?: string | null) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  socialSignIn: (provider: "google" | "github") => Promise<void>;
  completeOAuthLogin: (token: string) => Promise<void>;
  forgotPassword: (email: string, newPassword: string) => Promise<void>;
  signOut: () => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthResponse = {
  token: string;
  user: AppUser;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restore = async () => {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await apiRequest<{ user: AppUser }>("/auth/me", { token });
        setUser(data.user);
        setSession({ token });
      } catch {
        clearToken();
        setUser(null);
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    restore();
  }, []);

  const setAuth = (payload: AuthResponse) => {
    setToken(payload.token);
    setUser(payload.user);
    setSession({ token: payload.token });
  };

  const signUp = async (email: string, password: string, username: string, inviteToken?: string | null) => {
    const payload = await apiRequest<AuthResponse>("/auth/signup", {
      method: "POST",
      body: { email, password, username, inviteToken: inviteToken || undefined },
    });
    setAuth(payload);
  };

  const signIn = async (email: string, password: string) => {
    const payload = await apiRequest<AuthResponse>("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    setAuth(payload);
  };

  const socialSignIn = async (provider: "google" | "github") => {
    const returnTo = window.location.origin;
    window.location.href = `${API_URL}/auth/${provider}?returnTo=${encodeURIComponent(returnTo)}`;
  };

  const completeOAuthLogin = async (token: string) => {
    const data = await apiRequest<{ user: AppUser }>("/auth/me", { token });
    setToken(token);
    setSession({ token });
    setUser(data.user);
  };

  const forgotPassword = async (email: string, newPassword: string) => {
    await apiRequest<{ ok: boolean }>("/auth/forgot-password", {
      method: "POST",
      body: { email, newPassword },
    });
  };

  const signOut = async () => {
    clearToken();
    setUser(null);
    setSession(null);
  };

  const changePassword = async (newPassword: string) => {
    await apiRequest<{ ok: boolean }>("/auth/change-password", {
      method: "POST",
      body: { newPassword },
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signUp,
        signIn,
        socialSignIn,
        completeOAuthLogin,
        forgotPassword,
        signOut,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
