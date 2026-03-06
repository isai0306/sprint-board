import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export function useTasks(boardId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["tasks", boardId],
    queryFn: async () => {
      const suffix = boardId ? `?boardId=${boardId}` : "";
      return apiRequest<any[]>(`/tasks${suffix}`);
    },
    enabled: !!user,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (task: {
      board_id: string;
      title: string;
      description?: string;
      work_type?: "task" | "bug" | "story" | "epic";
      status?: "todo" | "in_progress" | "review" | "done";
      priority?: "low" | "medium" | "high" | "urgent";
      assignee_id?: string;
      reporter?: string;
      parent?: string;
      sprint?: string;
      start_date?: string;
      due_date?: string;
      linked_item_type?: string;
      linked_item_url?: string;
      attachments?: string[];
    }) => {
      return apiRequest<any>("/tasks", {
        method: "POST",
        body: task,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tasks", variables.board_id] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: {
      id: string;
      status?: "todo" | "in_progress" | "review" | "done";
      title?: string;
      description?: string;
      priority?: "low" | "medium" | "high" | "urgent";
      assignee_id?: string | null;
      reporter?: string;
      work_type?: "task" | "bug" | "story" | "epic";
      parent?: string;
      sprint?: string;
      start_date?: string | null;
      due_date?: string | null;
      linked_item_type?: string;
      linked_item_url?: string;
      attachments?: string[];
      position?: number;
    }) => {
      await apiRequest(`/tasks/${id}`, {
        method: "PATCH",
        body: updates,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/tasks/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
