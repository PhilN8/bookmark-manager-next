import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useStore } from "@/lib/store";
import { bookmarkApi } from "@/lib/api";
import type { BookmarkFormData } from "@/lib/types";

export function bookmarkKeys(
  workspaceId: string | null,
  filters?: {
    q?: string;
    folder?: string | null;
    tag?: string | null;
    archived?: boolean;
  }
) {
  return ["bookmarks", workspaceId, filters] as const;
}

export function useBookmarks() {
  const queryClient = useQueryClient();
  const { user, selectedWorkspaceId, selectedFolderId, selectedTagId, showArchived, searchQuery } =
    useStore();

  const filters = {
    q: searchQuery || undefined,
    folder: selectedFolderId || undefined,
    tag: selectedTagId || undefined,
    archived: showArchived || undefined,
  };

  const queryKey = bookmarkKeys(selectedWorkspaceId, filters);

  const query = useQuery({
    queryKey,
    queryFn: () => {
      const params = new URLSearchParams();
      params.set("workspaceId", selectedWorkspaceId!);
      if (filters.q) params.set("q", filters.q);
      if (filters.folder) params.set("folder", filters.folder);
      if (filters.tag) params.set("tag", filters.tag);
      if (filters.archived) params.set("archived", "true");
      return fetch(`/api/bookmarks?${params}`).then((r) => r.json());
    },
    enabled: !!user && !!selectedWorkspaceId,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["bookmarks", selectedWorkspaceId] });

  const createBookmark = useMutation({
    mutationFn: (data: BookmarkFormData & { workspaceId: string }) =>
      bookmarkApi.create(data),
    onSuccess: invalidate,
  });

  const updateBookmark = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<BookmarkFormData & { archived: boolean }>;
    }) => bookmarkApi.update(id, data),
    onSuccess: invalidate,
  });

  const archiveBookmark = useMutation({
    mutationFn: (id: string) => bookmarkApi.archive(id),
    onSuccess: invalidate,
  });

  const restoreBookmark = useMutation({
    mutationFn: (id: string) => bookmarkApi.update(id, { archived: false }),
    onSuccess: invalidate,
  });

  const moveToFolder = useMutation({
    mutationFn: ({ bookmarkId, folderId }: { bookmarkId: string; folderId: string | null }) =>
      bookmarkApi.moveToFolder(bookmarkId, folderId),
    onSuccess: invalidate,
  });

  const toggleTag = useMutation({
    mutationFn: ({ bookmarkId, tagId }: { bookmarkId: string; tagId: string }) => {
      const bookmark = query.data?.find((b: { id: string }) => b.id === bookmarkId);
      if (!bookmark) throw new Error("Bookmark not found");
      const hasTag = bookmark.tags.some((t: { tag: { id: string } }) => t.tag.id === tagId);
      const currentTagIds: string[] = bookmark.tags.map((t: { tag: { id: string } }) => t.tag.id);
      const newTagIds = hasTag
        ? currentTagIds.filter((id: string) => id !== tagId)
        : [...currentTagIds, tagId];
      return bookmarkApi.update(bookmarkId, { tags: newTagIds });
    },
    onSuccess: invalidate,
  });

  return {
    bookmarks: query.data ?? [],
    isLoading: query.isLoading,
    isPending: query.isPending,
    createBookmark,
    updateBookmark,
    archiveBookmark,
    restoreBookmark,
    moveToFolder,
    toggleTag,
  };
}
