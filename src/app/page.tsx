"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Tag,
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
import { Bookmark as BookmarkType } from "@/lib/types";
import { FolderTree } from "@/features/folders";
import { BookmarkCard, BookmarkForm } from "@/features/bookmarks";
import { LoadingScreen } from "@/components/LoadingScreen";
import { ConfirmModal } from "@/components/ConfirmModal";
import { WorkspaceSwitcher } from "@/features/workspaces";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useBookmarks } from "@/features/bookmarks/hooks";
import { useFolders } from "@/features/folders/hooks";
import { useTags } from "@/features/tags/hooks";

export default function Home() {
  const router = useRouter();
  const { 
    selectedFolderId, 
    setSelectedFolderId,
    selectedTagId, 
    setSelectedTagId,
    searchQuery,
    setSearchQuery,
    showArchived,
    setShowArchived,
  } = useStore();

  const {
    bookmarks,
    isLoading,
    initialLoad,
    fetchBookmarks,
    createBookmark,
    updateBookmark,
    archiveBookmark,
    restoreBookmark,
    moveToFolder,
    toggleTag,
  } = useBookmarks();

  const {
    folders,
    fetchFolders,
    createFolder,
    updateFolder,
    deleteFolder,
  } = useFolders();

  const {
    tags,
    fetchTags,
    createTag,
    deleteTag,
  } = useTags();

  const [initialAuth, setInitialAuth] = useState(true);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: "archive" | "restore";
    bookmarkId: string;
    bookmarkTitle: string;
  }>({ isOpen: false, type: "archive", bookmarkId: "", bookmarkTitle: "" });

  const [showForm, setShowForm] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<BookmarkType | null>(null);
  const [newTagName, setNewTagName] = useState("");
  const [isCreatingTag, setIsCreatingTag] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          router.push("/login");
          return;
        }
        const data = await res.json();
        if (!data.data) {
          router.push("/login");
          return;
        }
        setInitialAuth(false);
      } catch {
        router.push("/login");
      }
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    fetchFolders();
    fetchTags();
  }, [fetchFolders, fetchTags]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleCreateFolder = async (name: string, parentId?: string) => {
    const res = await createFolder(name, parentId);
    if (res?.ok) {
      toast.success("Folder created", {
        description: `"${name}" has been added.`,
        icon: <FolderPlus className="w-4 h-4" />,
      });
    }
  };

  const handleUpdateFolder = async (id: string, name: string) => {
    const res = await updateFolder(id, name);
    if (res?.ok) {
      toast.success("Folder renamed", {
        description: `"${name}" has been updated.`,
        icon: <Pencil className="w-4 h-4" />,
      });
    }
  };

  const handleDeleteFolder = async (id: string) => {
    const folder = folders.find((f) => f.id === id);
    if (!confirm("Delete this folder? Bookmarks will be moved to root.")) return;
    const res = await deleteFolder(id);
    if (res?.ok) {
      toast.error("Folder deleted", {
        description: `"${folder?.name}" has been removed.`,
        icon: <Trash2 className="w-4 h-4" />,
      });
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    const tagName = newTagName.trim();
    const res = await createTag(tagName);
    if (res?.ok) {
      toast.success("Tag created", {
        description: `"${tagName}" has been added.`,
        icon: <Tag className="w-4 h-4" />,
      });
      setNewTagName("");
      setIsCreatingTag(false);
    }
  };

  const handleDeleteTag = async (id: string) => {
    const tag = tags.find((t) => t.id === id);
    if (!confirm("Delete this tag?")) return;
    const res = await deleteTag(id);
    if (res?.ok) {
      toast.error("Tag deleted", {
        description: `"${tag?.name}" has been removed.`,
        icon: <Trash2 className="w-4 h-4" />,
      });
    }
  };

  const handleSubmitBookmark = async (data: {
    title: string;
    description?: string;
    folderId?: string | null;
    urls: { url: string; isPrimary: boolean; label?: string }[];
    tags: string[];
  }) => {
    const isEditing = !!editingBookmark;
    let res;
    if (isEditing) {
      res = await updateBookmark(editingBookmark.id, data);
    } else {
      res = await createBookmark(data);
    }
    if (res?.ok) {
      toast.success(isEditing ? "Bookmark updated" : "Bookmark created", {
        description: isEditing
          ? `"${data.title}" has been updated.`
          : `"${data.title}" has been added.`,
        icon: <Sparkles className="w-4 h-4" />,
      });
      setShowForm(false);
      setEditingBookmark(null);
    }
  };

  const handleDeleteBookmark = async (id: string) => {
    const bookmark = bookmarks.find((b) => b.id === id);
    setConfirmModal({
      isOpen: true,
      type: "archive",
      bookmarkId: id,
      bookmarkTitle: bookmark?.title || "",
    });
  };

  const handleRestoreBookmark = async (id: string) => {
    const bookmark = bookmarks.find((b) => b.id === id);
    setConfirmModal({
      isOpen: true,
      type: "restore",
      bookmarkId: id,
      bookmarkTitle: bookmark?.title || "",
    });
  };

  const handleConfirmModal = async () => {
    const { type, bookmarkId } = confirmModal;
    let res;
    if (type === "archive") {
      res = await archiveBookmark(bookmarkId);
      if (res?.ok) {
        toast.error("Bookmark archived", {
          description: `"${confirmModal.bookmarkTitle}" has been archived.`,
          icon: <Archive className="w-4 h-4" />,
        });
      }
    } else {
      res = await restoreBookmark(bookmarkId);
      if (res?.ok) {
        toast.success("Bookmark restored", {
          description: `"${confirmModal.bookmarkTitle}" has been restored.`,
          icon: <ArchiveRestore className="w-4 h-4" />,
        });
      }
    }
    setConfirmModal({ isOpen: false, type: "archive", bookmarkId: "", bookmarkTitle: "" });
  };

  if (initialLoad || initialAuth) return <LoadingScreen />;

  return (
    <div className="flex h-screen bg-background">
      <aside className="w-72 bg-card border-r border-border flex flex-col">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-ring rounded-xl flex items-center justify-center shadow-md">
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

          <div className="p-4 border-t border-border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-sm text-foreground">Tags</h3>
              <Button variant="ghost" size="icon-xs" onClick={() => setIsCreatingTag(true)}>
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
            {isCreatingTag && (
              <div className="flex gap-2 mb-3">
                <Input
                  type="text"
                  placeholder="Tag name"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateTag();
                    if (e.key === "Escape") setIsCreatingTag(false);
                  }}
                  className="h-8 text-sm"
                  autoFocus
                />
                <Button size="sm" onClick={handleCreateTag}>Add</Button>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <div key={tag.id} className="group flex items-center gap-1">
                  <Badge
                    variant={selectedTagId === tag.id ? "default" : "secondary"}
                    className="cursor-pointer"
                    onClick={() => setSelectedTagId(selectedTagId === tag.id ? null : tag.id)}
                  >
                    {tag.name}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 hover:text-destructive"
                    onClick={() => handleDeleteTag(tag.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
              {tags.length === 0 && !isCreatingTag && (
                <p className="text-xs text-muted-foreground">No tags yet</p>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-border space-y-2">
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={handleLogout} className="flex-1 justify-start text-muted-foreground hover:text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

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
              {showArchived ? <ArchiveX className="w-4 h-4 mr-2" /> : <Archive className="w-4 h-4 mr-2" />}
              <span className="hidden sm:inline">{showArchived ? "Active" : "Archived"}</span>
            </Button>

            <Button
              className="bg-gradient-to-r from-primary to-ring hover:opacity-90"
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
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Loading...</p>
              </div>
            </div>
          ) : bookmarks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="w-24 h-24 bg-gradient-to-br from-accent to-secondary rounded-3xl flex items-center justify-center mb-6 shadow-lg">
                <Tag className="w-12 h-12 text-muted-foreground" />
              </div>
              <p className="text-xl font-semibold text-foreground mb-2">No bookmarks yet</p>
              <p className="text-sm text-muted-foreground mb-6">Start building your collection</p>
              <Button
                className="bg-gradient-to-r from-primary to-ring hover:opacity-90"
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
              {bookmarks.map((bookmark) => (
                <BookmarkCard
                  key={bookmark.id}
                  bookmark={bookmark}
                  folders={folders.map((f) => ({ id: f.id, name: f.name }))}
                  tags={tags}
                  onEdit={(bookmark) => {
                    setEditingBookmark(bookmark);
                    setShowForm(true);
                  }}
                  onDelete={handleDeleteBookmark}
                  onRestore={handleRestoreBookmark}
                  onMoveFolder={moveToFolder}
                  onToggleTag={toggleTag}
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
          tags={tags}
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
        title={confirmModal.type === "archive" ? "Archive bookmark?" : "Restore bookmark?"}
        message={
          confirmModal.type === "archive"
            ? `Are you sure you want to archive "${confirmModal.bookmarkTitle}"? You can restore it later from the archived view.`
            : `Are you sure you want to restore "${confirmModal.bookmarkTitle}"? It will be moved back to your active bookmarks.`
        }
        confirmLabel={confirmModal.type === "archive" ? "Archive" : "Restore"}
        variant={confirmModal.type === "archive" ? "danger" : "success"}
        icon={confirmModal.type === "archive" ? "archive" : "restore"}
        onConfirm={handleConfirmModal}
        onCancel={() => setConfirmModal({ isOpen: false, type: "archive", bookmarkId: "", bookmarkTitle: "" })}
      />
    </div>
  );
}
