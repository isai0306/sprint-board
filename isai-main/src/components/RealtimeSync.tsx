import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { API_URL, getToken } from "@/lib/api";

const POLLING_INTERVAL = 30000; // 30 seconds fallback polling
const MAX_RECONNECT_ATTEMPTS = 5;

function invalidateAllSyncRelatedQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["tasks"] });
  queryClient.invalidateQueries({ queryKey: ["boards"] });
  queryClient.invalidateQueries({ queryKey: ["github-dev-activity"] });
  queryClient.invalidateQueries({ queryKey: ["dashboard-dev-activity"] });
}

export default function RealtimeSync() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const sseConnected = useRef(false);
  const reconnectAttempts = useRef(0);
  const pollingIntervalRef = useRef<number | null>(null);
  const lastSyncRef = useRef<string>(new Date().toISOString());

  // Polling fallback function
  const pollForUpdates = useCallback(async () => {
    const token = getToken();
    if (!token || !API_URL) return;

    try {
      const response = await fetch(`${API_URL}/sync/status?since=${encodeURIComponent(lastSyncRef.current)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) return;
      
      const data = await response.json();
      if (data.ok && (data.newCommitComments > 0 || data.updatedTasks > 0)) {
        lastSyncRef.current = data.lastSync;
        invalidateAllSyncRelatedQueries(queryClient);
      }
    } catch (error) {
      console.warn("Polling fallback failed:", error);
    }
  }, [queryClient]);

  // Start polling fallback
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) return;
    pollingIntervalRef.current = window.setInterval(pollForUpdates, POLLING_INTERVAL);
  }, [pollForUpdates]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  // Handle SSE events
  const handleSyncEvent = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data || "{}");
      const taskIds = Array.isArray(data.taskIds) ? data.taskIds : [];
      
      lastSyncRef.current = new Date().toISOString();
      invalidateAllSyncRelatedQueries(queryClient);
      
      // Also refresh specific task comments
      for (const taskId of taskIds) {
        queryClient.invalidateQueries({ queryKey: ["comments", taskId] });
      }
    } catch {
      invalidateAllSyncRelatedQueries(queryClient);
    }
  }, [queryClient]);

  useEffect(() => {
    if (!user) {
      stopPolling();
      return;
    }

    const token = getToken();
    if (!token || !API_URL) {
      startPolling();
      return;
    }

    // Try SSE connection first
    const source = new EventSource(`${API_URL}/events?token=${encodeURIComponent(token)}`);

    source.onopen = () => {
      sseConnected.current = true;
      reconnectAttempts.current = 0;
      stopPolling(); // Stop polling when SSE works
    };

    source.addEventListener("tasks.synced_from_commit", handleSyncEvent as EventListener);

    source.onerror = () => {
      sseConnected.current = false;
      source.close();
      
      // Fall back to polling after max reconnect attempts
      if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
        startPolling();
      } else {
        reconnectAttempts.current++;
      }
    };

    return () => {
      source.close();
      stopPolling();
    };
  }, [user, queryClient, handleSyncEvent, startPolling, stopPolling]);

  return null;
}
