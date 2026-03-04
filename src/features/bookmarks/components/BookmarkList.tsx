"use client";

import { Archive, Loader2, Plus } from "lucide-react";
import { useBookmarks } from "../hooks/useBookmarks";
import { useFolders } from "@/features/folders/hooks/useFolders";
import { BookmarkCard } from "./BookmarkCard";
import { Button } from "@/components/ui/button";
import type { Bookmark, Folder } from "@/lib/types";

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="w-24 h-24 bg-linear-to-br from-accent to-secondary rounded-3xl flex items-center justify-center mb-6 shadow-lg">
          <Archive className="w-12 h-12 text-muted-foreground" />
        </div>
        <p className="text-xl font-semibold text-foreground mb-2">
          No bookmarks yet
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          Start building your collection
        </p>
        <Button
          className="bg-linear-to-r from-primary to-ring hover:opacity-90"
          onClick={onAddNew}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add your first bookmark
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {bookmarks.map((bookmark: Bookmark) => (
          <BookmarkCard
            key={bookmark.id}
            bookmark={bookmark}
            folders={folders.map((f: Folder) => ({ id: f.id, name: f.name }))}
            tags={[]}
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

