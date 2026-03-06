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
    <header className="h-14 border-b bg-card flex items-center gap-4 px-4">
      <SidebarTrigger />

      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            className="pl-9 h-9 bg-secondary border-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-muted-foreground">
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative text-muted-foreground">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-destructive">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            {notifications && notifications.length > 0 ? (
              notifications.slice(0, 5).map((n) => (
                <DropdownMenuItem
                  key={n.id}
                  onClick={() => markRead.mutate(n.id)}
                  className={n.read ? "opacity-50" : ""}
                >
                  <span className="text-sm truncate">{n.message}</span>
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem disabled>No notifications</DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="icon"
          onClick={async () => { await signOut(); navigate("/login"); }}
          className="text-muted-foreground"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
