import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useStore } from "@/lib/store";
import { folderApi } from "@/lib/api";

export function useFolders() {
  const queryClient = useQueryClient();
  const { user, selectedWorkspaceId } = useStore();

  const query = useQuery({
    queryKey: ["folders", selectedWorkspaceId],
    queryFn: () => folderApi.getAll(selectedWorkspaceId!),
    enabled: !!user && !!selectedWorkspaceId,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["folders", selectedWorkspaceId] });

  const createFolder = useMutation({
    mutationFn: ({ name, parentId }: { name: string; parentId?: string }) =>
      folderApi.create(name, selectedWorkspaceId!, parentId),
    onSuccess: invalidate,
  });

  const updateFolder = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => folderApi.update(id, name),
    onSuccess: invalidate,
  });

  const deleteFolder = useMutation({
    mutationFn: (id: string) => folderApi.delete(id),
    onSuccess: invalidate,
  });

  return {
    folders: query.data ?? [],
    isLoading: query.isLoading,
    createFolder,
    updateFolder,
    deleteFolder,
  };
}
