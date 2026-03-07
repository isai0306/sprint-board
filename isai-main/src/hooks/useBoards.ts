import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export function useBoards(workspaceId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["boards", workspaceId],
    queryFn: async () => {
      const suffix = workspaceId ? `?workspaceId=${workspaceId}` : "";
      return apiRequest<any[]>(`/boards${suffix}`);
    },
    enabled: !!user,
  });
}

export function useBoard(boardId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["board", boardId],
    queryFn: async () => apiRequest<any>(`/boards/${boardId}`),
    enabled: !!user && !!boardId,
  });
}

export function useCreateBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      description,
      workspace_id,
      github_repository_url,
      github_auto_mark_done,
    }: {
      name: string;
      description?: string;
      workspace_id: string;
      github_repository_url?: string;
      github_auto_mark_done?: boolean;
    }) => {
      return apiRequest<any>("/boards", {
        method: "POST",
        body: { name, description, workspace_id, github_repository_url, github_auto_mark_done },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boards"] });
    },
  });
}

export function useUpdateBoardGitHub() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      boardId,
      repository_url,
      auto_mark_done,
      disconnect,
    }: {
      boardId: string;
      repository_url?: string;
      auto_mark_done?: boolean;
      disconnect?: boolean;
    }) => {
      return apiRequest<any>(`/boards/${boardId}/github`, {
        method: "PATCH",
        body: { repository_url, auto_mark_done, disconnect },
      });
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["boards"] });
      queryClient.invalidateQueries({ queryKey: ["board", vars.boardId] });
      queryClient.invalidateQueries({ queryKey: ["github-dev-activity"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-dev-activity"] });
    },
  });
}

export function useBoardDeveloperActivity(boardId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["github-dev-activity", boardId],
    queryFn: async () => apiRequest<any[]>(`/boards/${boardId}/github/developers`),
    enabled: !!user && !!boardId,
  });
}

export function useDashboardDeveloperActivity(boardId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["dashboard-dev-activity", boardId],
    queryFn: async () => {
      const suffix = boardId ? `?boardId=${encodeURIComponent(boardId)}` : "";
      return apiRequest<any[]>(`/dashboard/developer-activity${suffix}`);
    },
    enabled: !!user,
  });
}
