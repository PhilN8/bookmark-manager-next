import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { authApi } from "@/lib/api";

export const AUTH_QUERY_KEY = ["auth", "session"] as const;

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setUser } = useStore();

  const sessionQuery = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: async () => {
      const result = await authApi.getSession();
      return result.data;
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const user = sessionQuery.data ?? null;

  // Sync query result into Zustand in an effect (safe, not render-phase)
  useEffect(() => {
    if (user) {
      setUser(user as { id: string; email: string; name: string | null });
    }
  }, [user, setUser]);

  const logoutMutation = useMutation({
    mutationFn: () => authApi.signOut(),
    onSuccess: () => {
      setUser(null);
      queryClient.clear();
      router.push("/login");
      router.refresh();
    },
  });

  return {
    user,
    isLoading: sessionQuery.isLoading,
    isAuthenticated: !!user,
    logout: () => logoutMutation.mutate(),
  };
}
