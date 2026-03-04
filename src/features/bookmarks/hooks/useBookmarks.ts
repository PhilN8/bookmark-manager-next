import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useStore } from "@/lib/store";
import { bookmarkApi } from "@/lib/api";
import type { BookmarkFormData, BookmarkPage } from "@/lib/types";

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

const PAGE_SIZE = 20;

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

  const query = useInfiniteQuery<BookmarkPage, Error>({
    queryKey,
    queryFn: ({ pageParam }) => {
      const params: Parameters<typeof bookmarkApi.getAll>[0] = {
        workspaceId: selectedWorkspaceId!,
        limit: PAGE_SIZE,
        ...(pageParam ? { cursor: pageParam as string } : {}),
        ...filters,
      };
      return bookmarkApi.getAll(params);
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!user && !!selectedWorkspaceId,
  });

  // Flatten all pages into a single array for consumers
  const bookmarks = query.data?.pages.flatMap((page) => page.items) ?? [];

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

  const deleteBookmark = useMutation({
    mutationFn: (id: string) => bookmarkApi.hardDelete(id),
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
      const bookmark = bookmarks.find((b) => b.id === bookmarkId);
      if (!bookmark) throw new Error("Bookmark not found");
      const hasTag = bookmark.tags.some((t) => t.tag.id === tagId);
      const currentTagIds: string[] = bookmark.tags.map((t) => t.tag.id);
      const newTagIds = hasTag
        ? currentTagIds.filter((id: string) => id !== tagId)
        : [...currentTagIds, tagId];
      return bookmarkApi.update(bookmarkId, { tags: newTagIds });
    },
    onSuccess: invalidate,
  });

  return {
    bookmarks,
    isLoading: query.isLoading,
    isPending: query.isPending,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    invalidate,
    createBookmark,
    updateBookmark,
    archiveBookmark,
    deleteBookmark,
    restoreBookmark,
    moveToFolder,
    toggleTag,
  };
}
