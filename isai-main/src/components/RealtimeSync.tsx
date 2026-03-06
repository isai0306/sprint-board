import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { getToken } from "@/lib/api";

export default function RealtimeSync() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;
    const token = getToken();
    if (!token) return;

    const apiUrl = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/$/, "");
    const source = new EventSource(`${apiUrl}/events?token=${encodeURIComponent(token)}`);

    source.addEventListener("tasks.synced_from_commit", (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data || "{}");
        const taskIds = Array.isArray(data.taskIds) ? data.taskIds : [];
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
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
