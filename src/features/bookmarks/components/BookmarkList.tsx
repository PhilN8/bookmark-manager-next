"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useBookmarks } from "../hooks/useBookmarks";
import { useFolders } from "@/features/folders/hooks/useFolders";
import { useTags } from "@/features/tags/hooks/useTags";
import { useStore } from "@/lib/store";
import { BookmarkCard } from "./BookmarkCard";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import type { Bookmark, Folder, Tag } from "@/lib/types";

interface ConfirmAction {
  type: "archive" | "restore" | "delete";
  bookmarkId: string;
  bookmarkTitle: string;
}

interface BookmarkListProps {
  onEditBookmark: (bookmark: Bookmark) => void;
  onConfirmAction: (action: ConfirmAction) => void;
  onAddNew: () => void;
}

export function BookmarkList({
  onEditBookmark,
  onConfirmAction,
  onAddNew,
}: BookmarkListProps) {
  const {
    bookmarks,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    invalidate,
    moveToFolder,
    toggleTag,
  } = useBookmarks();
  const { folders } = useFolders();
  const { tags } = useTags();
  const { searchQuery, showArchived } = useStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-primary animate-pulse" />
          </div>
          <p className="text-sm font-medium text-muted-foreground animate-pulse">
            Loading your collection...
          </p>
        </div>
      </div>
    );
  }

  if (bookmarks.length === 0) {
    if (searchQuery) {
      return (
        <EmptyState
          title="No results found"
          description={`We couldn't find any bookmarks matching "${searchQuery}". Try a different search term.`}
          icon="search"
        />
      );
    }

    if (showArchived) {
      return (
        <EmptyState
          title="Archive is empty"
          description="Your archived bookmarks will appear here. Archiving helps keep your main workspace tidy."
          icon="archive"
        />
      );
    }

    return (
      <EmptyState
        title="Your workspace is empty"
        description="Start building your personal library by adding your first bookmark. Organize with folders and tags."
        icon="bookmarks"
        action={{
          label: "Add your first bookmark",
          onClick: onAddNew,
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {bookmarks.map((bookmark: Bookmark) => (
          <BookmarkCard
            key={bookmark.id}
            bookmark={bookmark}
            folders={folders.map((f: Folder) => ({ id: f.id, name: f.name }))}
            tags={tags.map((t: Tag) => ({ id: t.id, name: t.name }))}
            onEdit={onEditBookmark}
            onDelete={(id) => {
              const bm = bookmarks.find((b: Bookmark) => b.id === id);
              onConfirmAction({
                type: "archive",
                bookmarkId: id,
                bookmarkTitle: bm?.title ?? "",
              });
            }}
            onRestore={(id) => {
              const bm = bookmarks.find((b: Bookmark) => b.id === id);
              onConfirmAction({
                type: "restore",
                bookmarkId: id,
                bookmarkTitle: bm?.title ?? "",
              });
            }}
            onHardDelete={(id) => {
              const bm = bookmarks.find((b: Bookmark) => b.id === id);
              onConfirmAction({
                type: "delete",
                bookmarkId: id,
                bookmarkTitle: bm?.title ?? "",
              });
            }}
            onMoveFolder={(bookmarkId, folderId) =>
              moveToFolder.mutate({ bookmarkId, folderId })
            }
            onToggleTag={(bookmarkId, tagId) =>
              toggleTag.mutate({ bookmarkId, tagId })
            }
            onUrlsChanged={() => invalidate()}
          />
        ))}
      </div>

      {hasNextPage && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading more...
              </>
            ) : (
              "Load more"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

