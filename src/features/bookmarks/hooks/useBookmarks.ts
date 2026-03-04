import { useState, useEffect, useCallback } from "react";
import { Bookmark } from "@/lib/types";
import { useStore } from "@/lib/store";

const API_BASE = "/api";

export function useBookmarks() {
  const { bookmarks, setBookmarks, isLoading, setIsLoading } = useStore();
  const { selectedFolderId, selectedTagId, showArchived } = useStore();
  const debouncedSearch = useStore((state) => state.searchQuery);
  const [initialLoad, setInitialLoad] = useState(true);

  const fetchBookmarks = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("q", debouncedSearch);
      if (selectedFolderId) params.set("folder", selectedFolderId);
      if (selectedTagId) params.set("tag", selectedTagId);
      if (showArchived) params.set("archived", "true");

      const res = await fetch(`${API_BASE}/bookmarks?${params}`);
      if (res.ok) setBookmarks(await res.json());
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedFolderId, selectedTagId, showArchived, setBookmarks, setIsLoading, debouncedSearch]);

  useEffect(() => {
    fetchBookmarks().then(() => setInitialLoad(false));
  }, [fetchBookmarks]);

  const createBookmark = async (data: {
    title: string;
    description?: string;
    folderId?: string | null;
    urls: { url: string; isPrimary: boolean; label?: string }[];
    tags: string[];
  }) => {
    const res = await fetch(`${API_BASE}/bookmarks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) fetchBookmarks();
    return res;
  };

  const updateBookmark = async (id: string, data: Partial<{
    title: string;
    description?: string;
    folderId?: string | null;
    urls: { url: string; isPrimary: boolean; label?: string }[];
    tags: string[];
    archived: boolean;
  }>) => {
    const res = await fetch(`${API_BASE}/bookmarks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) fetchBookmarks();
    return res;
  };

  const deleteBookmark = async (id: string) => {
    const res = await fetch(`${API_BASE}/bookmarks/${id}`, {
      method: "DELETE",
    });
    if (res.ok) fetchBookmarks();
    return res;
  };

  const archiveBookmark = deleteBookmark;
  
  const restoreBookmark = async (id: string) => {
    return updateBookmark(id, { archived: false });
  };

  const moveToFolder = async (bookmarkId: string, folderId: string) => {
    return updateBookmark(bookmarkId, { folderId: folderId || null });
  };

  const toggleTag = async (bookmarkId: string, tagId: string) => {
    const bookmark = bookmarks.find((b) => b.id === bookmarkId);
    if (!bookmark) return null;

    const hasTag = bookmark.tags.some((t) => t.tag.id === tagId);
    const currentTagIds = bookmark.tags.map((t) => t.tag.id);
    const newTagIds = hasTag
      ? currentTagIds.filter((id) => id !== tagId)
      : [...currentTagIds, tagId];

    return updateBookmark(bookmarkId, { tags: newTagIds });
  };

  return {
    bookmarks,
    isLoading,
    initialLoad,
    fetchBookmarks,
    createBookmark,
    updateBookmark,
    deleteBookmark,
    archiveBookmark,
    restoreBookmark,
    moveToFolder,
    toggleTag,
  };
}
