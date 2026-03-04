"use client";

import { useState } from "react";
import {
  Search,
  Plus,
  Archive,
  Bookmark,
  ArchiveRestore,
  ArchiveX,
  LogOut,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useStore } from "@/lib/store";
import { useAuth } from "@/features/auth";
import { FolderList } from "@/features/folders";
import { BookmarkList, BookmarkForm } from "@/features/bookmarks";
import { TagList } from "@/features/tags";
import { LoadingScreen } from "@/components/LoadingScreen";
import { ConfirmModal } from "@/components/ConfirmModal";
import { WorkspaceSwitcher } from "@/features/workspaces";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBookmarks } from "@/features/bookmarks/hooks";
import type { Bookmark as BookmarkType, BookmarkFormData } from "@/lib/types";

export default function Home() {
  const { searchQuery, setSearchQuery, showArchived, setShowArchived } =
    useStore();

  const { isLoading: authLoading, logout } = useAuth();

  const {
    createBookmark,
    updateBookmark,
    archiveBookmark,
    deleteBookmark,
    restoreBookmark,
  } = useBookmarks();

  const { selectedWorkspaceId } = useStore();

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: "archive" | "restore" | "delete";
    bookmarkId: string;
    bookmarkTitle: string;
  }>({ isOpen: false, type: "archive", bookmarkId: "", bookmarkTitle: "" });

  const [showForm, setShowForm] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<BookmarkType | null>(
    null,
  );

  // ── Bookmark form handlers ────────────────────────────────────────────────
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

  // ── Confirm modal handler ─────────────────────────────────────────────────
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
    } else if (type === "restore") {
      restoreBookmark.mutate(bookmarkId, {
        onSuccess: () =>
          toast.success("Bookmark restored", {
            description: `"${bookmarkTitle}" has been restored.`,
            icon: <ArchiveRestore className="w-4 h-4" />,
          }),
      });
    } else {
      deleteBookmark.mutate(bookmarkId, {
        onSuccess: () =>
          toast.success("Bookmark deleted", {
            description: `"${bookmarkTitle}" has been permanently deleted.`,
            icon: <Trash2 className="w-4 h-4" />,
          }),
        onError: () => toast.error("Failed to permanently delete bookmark"),
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
            <FolderList />
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
          <BookmarkList
            onEditBookmark={(bm) => {
              setEditingBookmark(bm);
              setShowForm(true);
            }}
            onConfirmAction={({ type, bookmarkId, bookmarkTitle }) =>
              setConfirmModal({ isOpen: true, type, bookmarkId, bookmarkTitle })
            }
            onAddNew={() => {
              setEditingBookmark(null);
              setShowForm(true);
            }}
          />
        </div>
      </main>

      {showForm && (
        <BookmarkForm
          bookmark={editingBookmark}
          folders={[]}
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
            : confirmModal.type === "restore"
              ? "Restore bookmark?"
              : "Permanently delete?"
        }
        message={
          confirmModal.type === "archive"
            ? `Are you sure you want to archive "${confirmModal.bookmarkTitle}"? You can restore it later from the archived view.`
            : confirmModal.type === "restore"
              ? `Are you sure you want to restore "${confirmModal.bookmarkTitle}"? It will be moved back to your active bookmarks.`
              : `Are you sure you want to permanently delete "${confirmModal.bookmarkTitle}"? This action cannot be undone.`
        }
        confirmLabel={
          confirmModal.type === "archive"
            ? "Archive"
            : confirmModal.type === "restore"
              ? "Restore"
              : "Delete permanently"
        }
        variant={
          confirmModal.type === "archive" || confirmModal.type === "delete"
            ? "danger"
            : "success"
        }
        icon={
          confirmModal.type === "archive"
            ? "archive"
            : confirmModal.type === "restore"
              ? "restore"
              : "delete"
        }
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
