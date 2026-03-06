import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async () => apiRequest<any>("/settings"),
  });
}

export function useUpdateGeneralSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      workspace_name?: string;
      language?: string;
      timezone?: string;
      week_starts_on?: string;
    }) => {
      return apiRequest("/settings/general", { method: "PATCH", body: payload });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}

export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      email_mentions: boolean;
      email_comments: boolean;
      email_invites: boolean;
      push_enabled: boolean;
      weekly_digest: boolean;
    }) => {
      return apiRequest("/settings/notifications", { method: "PATCH", body: payload });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}

export function useUsersManagement() {
  return useQuery({
    queryKey: ["settings-users"],
    queryFn: async () => apiRequest<any[]>("/settings/users"),
  });
}

export function useInvitations() {
  return useQuery({
    queryKey: ["settings-invitations"],
    queryFn: async () => apiRequest<any[]>("/settings/invitations"),
  });
}

export function useSendInvitations() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      emails: string[];
      app_roles: { goals: string; jira: string; projects: string; jira_admin: string };
      groups?: string[];
    }) => {
      return apiRequest<{ results: Array<{ email: string; ok: boolean; message: string }> }>("/settings/invitations", {
        method: "POST",
        body: payload,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings-users"] });
      queryClient.invalidateQueries({ queryKey: ["settings-invitations"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
