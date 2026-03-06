import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useStore } from "@/lib/store";
import { tagApi } from "@/lib/api";

export function useTags() {
  const queryClient = useQueryClient();
  const { user, selectedWorkspaceId } = useStore();

  const query = useQuery({
    queryKey: ["tags", selectedWorkspaceId],
    queryFn: () => tagApi.getAll(selectedWorkspaceId!),
    enabled: !!user && !!selectedWorkspaceId,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["tags", selectedWorkspaceId] });

  const createTag = useMutation({
    mutationFn: (name: string) => tagApi.create(name, selectedWorkspaceId!),
    onSuccess: invalidate,
  });

  const deleteTagMutation = useMutation({
    mutationFn: (id: string) => tagApi.delete(id),
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });

  return {
    tags: query.data ?? [],
    isLoading: query.isLoading,
    createTag: (name: string, options?: Parameters<typeof createTag.mutate>[1]) => createTag.mutate(name, options),
    deleteTag: (id: string, options?: Parameters<typeof deleteTagMutation.mutate>[1]) => deleteTagMutation.mutate(id, options),
    isCreating: createTag.isPending,
    isDeleting: deleteTagMutation.isPending,
  };
}
