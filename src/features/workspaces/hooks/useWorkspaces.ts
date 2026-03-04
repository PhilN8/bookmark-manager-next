import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useStore } from "@/lib/store";
import { workspaceApi } from "@/lib/api";

export function useWorkspaces() {
  const queryClient = useQueryClient();
  const { user, selectedWorkspaceId, setSelectedWorkspaceId } = useStore();

  const query = useQuery({
    queryKey: ["workspaces", user?.id],
    queryFn: async () => {
      const data = await workspaceApi.getAll(user!.id);
      // Auto-select the first workspace if none is selected
      if (data.length > 0 && !selectedWorkspaceId) {
        setSelectedWorkspaceId(data[0].id);
      }
      return data;
    },
    enabled: !!user,
  });

  const createWorkspace = useMutation({
    mutationFn: (name: string) => workspaceApi.create(name, user!.id),
    onSuccess: (newWorkspace) => {
      setSelectedWorkspaceId(newWorkspace.id);
      queryClient.invalidateQueries({ queryKey: ["workspaces", user?.id] });
    },
  });

  const deleteWorkspace = useMutation({
    mutationFn: (id: string) => workspaceApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces", user?.id] });
    },
  });

  return {
    workspaces: query.data ?? [],
    isLoading: query.isLoading,
    createWorkspace,
    deleteWorkspace,
  };
}
