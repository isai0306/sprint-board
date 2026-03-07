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
    <header className="flex h-14 items-center gap-4 border-b border-white/10 bg-black/30 px-4 backdrop-blur-xl">
      <SidebarTrigger />

      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search tasks..."
            className="h-9 border border-white/15 bg-black/40 pl-9 text-slate-100 placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-slate-300 hover:bg-white/10 hover:text-white">
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative text-slate-300 hover:bg-white/10 hover:text-white">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-destructive">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 border-white/10 bg-[#0b0e13] text-slate-100">
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
          className="text-slate-300 hover:bg-white/10 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
