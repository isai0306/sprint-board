import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";

export function useComments(taskId?: string) {
  return useQuery({
    queryKey: ["comments", taskId],
    queryFn: async () => apiRequest<any[]>(`/comments?taskId=${taskId}`),
    enabled: !!taskId,
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ task_id, content }: { task_id: string; content: string }) => {
      return apiRequest<any>("/comments", {
        method: "POST",
        body: { task_id, content },
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["comments", variables.task_id] });
    },
  });
}
