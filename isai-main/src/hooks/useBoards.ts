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

export function useCreateBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, description, workspace_id }: { name: string; description?: string; workspace_id: string }) => {
      return apiRequest<any>("/boards", {
        method: "POST",
        body: { name, description, workspace_id },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boards"] });
    },
  });
}
