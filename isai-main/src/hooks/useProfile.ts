import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      return apiRequest<any>("/profiles/me");
    },
    enabled: !!user,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: {
      username?: string;
      avatar_url?: string;
      role?: string;
      bio?: string;
      location?: string;
      timezone?: string;
      phone?: string;
      company?: string;
      website?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");
      await apiRequest("/profiles/me", {
        method: "PATCH",
        body: updates,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}
