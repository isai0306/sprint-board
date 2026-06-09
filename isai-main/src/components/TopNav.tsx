import { Bell, LogOut, Moon, Sun, Search } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useNotifications, useMarkNotificationRead } from "@/hooks/useNotifications";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

export function TopNav() {
  const { signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { data: notifications } = useNotifications();
  const markRead = useMarkNotificationRead();
  const navigate = useNavigate();

  const unreadCount = notifications?.filter(n => !n.read).length ?? 0;

  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center gap-4 px-6">
        <SidebarTrigger className="transition-smooth" />

        <div className="flex-1 max-w-sm">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-smooth group-focus-within:text-primary" />
            <Input
              placeholder="Search tasks..."
              className="h-10 border border-border/50 bg-muted/50 pl-9 text-foreground placeholder:text-muted-foreground transition-smooth hover:border-border/80 focus:border-primary/50 focus:bg-muted"
            />
          </div>
        </div>

        <div className="flex items-center gap-1 ml-auto">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme} 
            className="transition-smooth hover:bg-muted"
            title={theme === "dark" ? "Light mode" : "Dark mode"}
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative transition-smooth hover:bg-muted"
                title="Notifications"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-destructive animate-pulse">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="px-2 py-1.5">
                <h3 className="text-sm font-semibold text-foreground mb-2">Notifications</h3>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications && notifications.length > 0 ? (
                  notifications.slice(0, 5).map((n) => (
                    <DropdownMenuItem
                      key={n.id}
                      onClick={() => markRead.mutate(n.id)}
                      className={`cursor-pointer transition-smooth ${n.read ? "opacity-50" : "bg-muted/30"}`}
                    >
                      <span className="text-sm truncate">{n.message}</span>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                    No notifications yet
                  </div>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon"
            onClick={async () => { await signOut(); navigate("/login"); }}
            className="transition-smooth hover:bg-destructive/10 hover:text-destructive"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}