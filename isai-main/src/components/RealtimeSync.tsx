import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { API_URL, getToken } from "@/lib/api";

export default function RealtimeSync() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;
    const token = getToken();
    if (!token) return;

    if (!API_URL) return;
    const source = new EventSource(`${API_URL}/events?token=${encodeURIComponent(token)}`);

    source.addEventListener("tasks.synced_from_commit", (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data || "{}");
        const taskIds = Array.isArray(data.taskIds) ? data.taskIds : [];
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
        queryClient.invalidateQueries({ queryKey: ["boards"] });
        queryClient.invalidateQueries({ queryKey: ["github-dev-activity"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard-dev-activity"] });
        for (const taskId of taskIds) {
          queryClient.invalidateQueries({ queryKey: ["comments", taskId] });
        }
      } catch {
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
      }
    });

    return () => {
      source.close();
    };
  }, [queryClient, user]);

  return null;
}
