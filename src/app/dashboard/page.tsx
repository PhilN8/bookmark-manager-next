"use client";

import { useState } from "react";
import {
  Search,
  Plus,
  Archive,
  ArchiveRestore,
  ArchiveX,
  Sparkles,
  Trash2,
  Menu,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { useStore } from "@/lib/store";
import { useAuth } from "@/features/auth";
import { BookmarkList, BookmarkForm } from "@/features/bookmarks";
import { LoadingScreen } from "@/components/LoadingScreen";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useBookmarks } from "@/features/bookmarks/hooks";
import type { Bookmark as BookmarkType, BookmarkFormData } from "@/lib/types";

export default function DashboardPage() {
  const router = useRouter();
  const { searchQuery, setSearchQuery, showArchived, setShowArchived } =
    useStore();

  const {
    createBookmark,
    updateBookmark,
    archiveBookmark,
    deleteBookmark,
    restoreBookmark,
  } = useBookmarks();

  const { selectedWorkspaceId } = useStore();
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
  if (!user) return null; // Will redirect via useEffect

  return (
    <div className="flex h-screen bg-background">
      {/* ── Desktop Sidebar ─────────────────────────────────────────────── */}
      <aside className="hidden lg:flex w-72 flex-col">
        <Sidebar />
      </aside>

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-card border-b border-border p-4">
          <div className="flex items-center gap-4">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="p-0 w-72 border-r border-border"
              >
                <SheetHeader className="sr-only">
                  <SheetTitle>Navigation Menu</SheetTitle>
                </SheetHeader>
                <Sidebar />
              </SheetContent>
            </Sheet>

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
