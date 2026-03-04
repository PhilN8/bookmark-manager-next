"use client";

import { useState } from "react";
import {
  Search,
  Plus,
  Archive,
  Loader2,
  Bookmark,
  ArchiveRestore,
  ArchiveX,
  LogOut,
  Sparkles,
  FolderPlus,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useStore } from "@/lib/store";
import { useAuth } from "@/features/auth";
import { FolderTree } from "@/features/folders";
import { BookmarkCard, BookmarkForm } from "@/features/bookmarks";
import { TagList } from "@/features/tags";
import { LoadingScreen } from "@/components/LoadingScreen";
import { ConfirmModal } from "@/components/ConfirmModal";
import { WorkspaceSwitcher } from "@/features/workspaces";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBookmarks } from "@/features/bookmarks/hooks";
import { useFolders } from "@/features/folders/hooks";
import type {
  Bookmark as BookmarkType,
  BookmarkFormData,
  Folder,
} from "@/lib/types";

export default function Home() {
  const {
    selectedFolderId,
    setSelectedFolderId,
    selectedWorkspaceId,
    searchQuery,
    setSearchQuery,
    showArchived,
    setShowArchived,
  } = useStore();

  const { isLoading: authLoading, logout } = useAuth();

  const {
    bookmarks,
    isLoading: bookmarksLoading,
    createBookmark,
    updateBookmark,
    archiveBookmark,
    restoreBookmark,
    moveToFolder,
    toggleTag,
  } = useBookmarks();

  const { folders, createFolder, updateFolder, deleteFolder } = useFolders();

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: "archive" | "restore";
    bookmarkId: string;
    bookmarkTitle: string;
  }>({ isOpen: false, type: "archive", bookmarkId: "", bookmarkTitle: "" });

  const [showForm, setShowForm] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<BookmarkType | null>(
    null,
  );

  // ── Folder handlers ──────────────────────────────────────────────────────
  const handleCreateFolder = (name: string, parentId?: string) => {
    createFolder.mutate(
      { name, parentId },
      {
        onSuccess: () =>
          toast.success("Folder created", {
            description: `"${name}" has been added.`,
            icon: <FolderPlus className="w-4 h-4" />,
          }),
        onError: () => toast.error("Failed to create folder"),
      },
    );
  };

  const handleUpdateFolder = (id: string, name: string) => {
    updateFolder.mutate(
      { id, name },
      {
        onSuccess: () =>
          toast.success("Folder renamed", {
            description: `"${name}" has been updated.`,
            icon: <Pencil className="w-4 h-4" />,
          }),
        onError: () => toast.error("Failed to rename folder"),
      },
    );
  };

  const handleDeleteFolder = (id: string) => {
    const folder = folders.find((f: Folder) => f.id === id);
    if (!confirm("Delete this folder? Bookmarks will be moved to root."))
      return;
    deleteFolder.mutate(id, {
      onSuccess: () =>
        toast.error("Folder deleted", {
          description: `"${folder?.name}" has been removed.`,
          icon: <Trash2 className="w-4 h-4" />,
        }),
      onError: () => toast.error("Failed to delete folder"),
    });
  };

  // ── Bookmark handlers ─────────────────────────────────────────────────────
  const handleSubmitBookmark = (data: BookmarkFormData) => {
    const isEditing = !!editingBookmark;
    if (isEditing) {
      updateBookmark.mutate(
        { id: editingBookmark.id, data },
        {
          onSuccess: () => {
            toast.success("Bookmark updated", {
              description: `"${data.title}" has been updated.`,
              icon: <Sparkles className="w-4 h-4" />,
            });
            setShowForm(false);
            setEditingBookmark(null);
          },
          onError: () => toast.error("Failed to update bookmark"),
        },
      );
    } else {
      createBookmark.mutate(
        { ...data, workspaceId: selectedWorkspaceId! },
        {
          onSuccess: () => {
            toast.success("Bookmark created", {
              description: `"${data.title}" has been added.`,
              icon: <Sparkles className="w-4 h-4" />,
            });
            setShowForm(false);
          },
          onError: () => toast.error("Failed to create bookmark"),
        },
      );
    }
  };

  const handleDeleteBookmark = (id: string) => {
    const bookmark = bookmarks.find((b: BookmarkType) => b.id === id);
    setConfirmModal({
      isOpen: true,
      type: "archive",
      bookmarkId: id,
      bookmarkTitle: bookmark?.title || "",
    });
  };

  const handleRestoreBookmark = (id: string) => {
    const bookmark = bookmarks.find((b: BookmarkType) => b.id === id);
    setConfirmModal({
      isOpen: true,
      type: "restore",
      bookmarkId: id,
      bookmarkTitle: bookmark?.title || "",
    });
  };

  const handleConfirmModal = () => {
    const { type, bookmarkId, bookmarkTitle } = confirmModal;
    if (type === "archive") {
      archiveBookmark.mutate(bookmarkId, {
        onSuccess: () =>
          toast.error("Bookmark archived", {
            description: `"${bookmarkTitle}" has been archived.`,
            icon: <Archive className="w-4 h-4" />,
          }),
      });
    } else {
      restoreBookmark.mutate(bookmarkId, {
        onSuccess: () =>
          toast.success("Bookmark restored", {
            description: `"${bookmarkTitle}" has been restored.`,
            icon: <ArchiveRestore className="w-4 h-4" />,
          }),
      });
    }
    setConfirmModal({
      isOpen: false,
      type: "archive",
      bookmarkId: "",
      bookmarkTitle: "",
    });
  };

  if (authLoading) return <LoadingScreen />;

  return (
    <div className="flex h-screen bg-background">
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="w-72 bg-card border-r border-border flex flex-col">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-linear-to-br from-primary to-ring rounded-xl flex items-center justify-center shadow-md">
              <Bookmark className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Pearl</h1>
              <p className="text-xs text-muted-foreground">Bookmark Manager</p>
            </div>
          </div>
        </div>

        <div className="px-4 py-2">
          <WorkspaceSwitcher />
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <FolderTree
              folders={folders}
              selectedFolderId={selectedFolderId}
              onSelectFolder={setSelectedFolderId}
              onCreateFolder={handleCreateFolder}
              onUpdateFolder={handleUpdateFolder}
              onDeleteFolder={handleDeleteFolder}
            />
          </div>

          <TagList />
        </div>

        <div className="p-4 border-t border-border space-y-2">
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="flex-1 justify-start text-muted-foreground hover:text-destructive"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-card border-b border-border p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search your bookmarks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Button
              variant={showArchived ? "secondary" : "outline"}
              size="sm"
              onClick={() => setShowArchived(!showArchived)}
            >
              {showArchived ? (
                <ArchiveX className="w-4 h-4 mr-2" />
              ) : (
                <Archive className="w-4 h-4 mr-2" />
              )}
              <span className="hidden sm:inline">
                {showArchived ? "Active" : "Archived"}
              </span>
            </Button>

            <Button
              className="bg-linear-to-r from-primary to-ring hover:opacity-90"
              size="sm"
              onClick={() => {
                setEditingBookmark(null);
                setShowForm(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">New</span>
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          {bookmarksLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Loading...</p>
              </div>
            </div>
          ) : bookmarks.length === 0 ? (
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
                onClick={() => {
                  setEditingBookmark(null);
                  setShowForm(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add your first bookmark
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {bookmarks.map((bookmark: BookmarkType) => (
                <BookmarkCard
                  key={bookmark.id}
                  bookmark={bookmark}
                  folders={folders.map((f: Folder) => ({
                    id: f.id,
                    name: f.name,
                  }))}
                  tags={[]}
                  onEdit={(bm) => {
                    setEditingBookmark(bm);
                    setShowForm(true);
                  }}
                  onDelete={handleDeleteBookmark}
                  onRestore={handleRestoreBookmark}
                  onMoveFolder={(bookmarkId, folderId) =>
                    moveToFolder.mutate({ bookmarkId, folderId })
                  }
                  onToggleTag={(bookmarkId, tagId) =>
                    toggleTag.mutate({ bookmarkId, tagId })
                  }
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {showForm && (
        <BookmarkForm
          bookmark={editingBookmark}
          folders={folders}
          tags={[]}
          onSubmit={handleSubmitBookmark}
          onClose={() => {
            setShowForm(false);
            setEditingBookmark(null);
          }}
        />
      )}

      <Toaster position="bottom-right" richColors />

      <ConfirmModal
        open={confirmModal.isOpen}
        title={
          confirmModal.type === "archive"
            ? "Archive bookmark?"
            : "Restore bookmark?"
        }
        message={
          confirmModal.type === "archive"
            ? `Are you sure you want to archive "${confirmModal.bookmarkTitle}"? You can restore it later from the archived view.`
            : `Are you sure you want to restore "${confirmModal.bookmarkTitle}"? It will be moved back to your active bookmarks.`
        }
        confirmLabel={confirmModal.type === "archive" ? "Archive" : "Restore"}
        variant={confirmModal.type === "archive" ? "danger" : "success"}
        icon={confirmModal.type === "archive" ? "archive" : "restore"}
        onConfirm={handleConfirmModal}
        onCancel={() =>
          setConfirmModal({
            isOpen: false,
            type: "archive",
            bookmarkId: "",
            bookmarkTitle: "",
          })
        }
      />
    </div>
  );
}
