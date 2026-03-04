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

  const deleteTag = useMutation({
    mutationFn: (id: string) => tagApi.delete(id),
    onSuccess: invalidate,
  });

  return {
    tags: query.data ?? [],
    isLoading: query.isLoading,
    createTag,
    deleteTag,
  };
}
