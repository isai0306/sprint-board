import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import AppLayout from "@/layouts/AppLayout";
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import OAuthCallbackPage from "@/pages/OAuthCallbackPage";
import DashboardPage from "@/pages/DashboardPage";
import WorkspacesPage from "@/pages/WorkspacesPage";
import BoardsPage from "@/pages/BoardsPage";
import KanbanBoardPage from "@/pages/KanbanBoardPage";
import ProfilePage from "@/pages/ProfilePage";
import SettingsPage from "@/pages/SettingsPage";
import NotFound from "@/pages/NotFound";
import RealtimeSync from "@/components/RealtimeSync";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <RealtimeSync />
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/workspaces" element={<WorkspacesPage />} />
                <Route path="/boards" element={<BoardsPage />} />
                <Route path="/board/:boardId" element={<KanbanBoardPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
