import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useStore } from "@/lib/store";

export function useTags() {
  const queryClient = useQueryClient();
  const { user, selectedWorkspaceId } = useStore();

  const query = useQuery({
    queryKey: ["tags", selectedWorkspaceId],
    queryFn: () =>
      fetch(`/api/tags?workspaceId=${selectedWorkspaceId}`).then((r) => r.json()),
    enabled: !!user && !!selectedWorkspaceId,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["tags", selectedWorkspaceId] });

  const createTag = useMutation({
    mutationFn: (name: string) =>
      fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, workspaceId: selectedWorkspaceId }),
      }).then((r) => {
        if (!r.ok) throw new Error("Failed to create tag");
        return r.json();
      }),
    onSuccess: invalidate,
  });

  const deleteTag = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/tags?id=${id}`, { method: "DELETE" }).then((r) => {
        if (!r.ok) throw new Error("Failed to delete tag");
        return r.json();
      }),
    onSuccess: invalidate,
  });

  return {
    tags: query.data ?? [],
    isLoading: query.isLoading,
    createTag,
    deleteTag,
  };
}
