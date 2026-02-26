"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  Plus,
  Tag,
  Archive,
  Loader2,
  Bookmark,
  X,
  Check,
  Pencil,
  Trash2,
  FolderPlus,
  ArchiveRestore,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useDebounce } from "@/lib/useDebounce";
import { useStore } from "@/lib/store";
import { Bookmark as BookmarkType } from "@/lib/types";
import { FolderTree } from "@/components/FolderSidebar";
import { BookmarkCard } from "@/components/BookmarkCard";
import { BookmarkForm } from "@/components/BookmarkForm";
import { LoadingScreen } from "@/components/LoadingScreen";
import { ConfirmModal } from "@/components/ConfirmModal";

const API_BASE = "/api";

export default function Home() {
  const {
    bookmarks,
    setBookmarks,
    folders,
    setFolders,
    tags,
    setTags,
    selectedFolderId,
    setSelectedFolderId,
    selectedTagId,
    setSelectedTagId,
    searchQuery,
    setSearchQuery,
  } = useStore();

  const debouncedSearch = useDebounce(searchQuery, 300);

  const { showArchived, setShowArchived, isLoading, setIsLoading } = useStore();

  const [initialLoad, setInitialLoad] = useState(true);
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
  const [newTagName, setNewTagName] = useState("");
  const [isCreatingTag, setIsCreatingTag] = useState(false);

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
  }, [
    selectedFolderId,
    selectedTagId,
    showArchived,
    setBookmarks,
    setIsLoading,
    debouncedSearch,
  ]);

  const fetchFolders = useCallback(async () => {
    const res = await fetch(`${API_BASE}/folders`);
    if (res.ok) setFolders(await res.json());
  }, [setFolders]);

  const fetchTags = useCallback(async () => {
    const res = await fetch(`${API_BASE}/tags`);
    if (res.ok) setTags(await res.json());
  }, [setTags]);

  useEffect(() => {
    fetchBookmarks().then(() => setInitialLoad(false));
  }, [fetchBookmarks]);
  useEffect(() => {
    fetchFolders();
    fetchTags();
  }, [fetchFolders, fetchTags]);

  const handleCreateFolder = async (name: string, parentId?: string) => {
    const res = await fetch(`${API_BASE}/folders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, parentId }),
    });
    if (res.ok) {
      toast.success("Folder created", {
        description: `"${name}" has been added.`,
        icon: <FolderPlus className="w-4 h-4" />,
      });
      fetchFolders();
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    const tagName = newTagName.trim();
    const res = await fetch(`${API_BASE}/tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: tagName }),
    });
    if (res.ok) {
      toast.success("Tag created", {
        description: `"${tagName}" has been added.`,
        icon: <Tag className="w-4 h-4" />,
      });
      setNewTagName("");
      setIsCreatingTag(false);
      fetchTags();
    }
  };

  const handleDeleteTag = async (id: string) => {
    const tag = tags.find((t) => t.id === id);
    if (!confirm("Delete this tag?")) return;
    const res = await fetch(`${API_BASE}/tags?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.error("Tag deleted", {
        description: `"${tag?.name}" has been removed.`,
        icon: <Trash2 className="w-4 h-4" />,
      });
      fetchTags();
    }
  };

  const handleUpdateFolder = async (id: string, name: string) => {
    const res = await fetch(`${API_BASE}/folders`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name }),
    });
    if (res.ok) {
      toast.success("Folder renamed", {
        description: `"${name}" has been updated.`,
        icon: <Pencil className="w-4 h-4" />,
      });
      fetchFolders();
    }
  };

  const handleDeleteFolder = async (id: string) => {
    const folder = folders.find((f) => f.id === id);
    if (!confirm("Delete this folder? Bookmarks will be moved to root."))
      return;
    const res = await fetch(`${API_BASE}/folders?id=${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      toast.error("Folder deleted", {
        description: `"${folder?.name}" has been removed.`,
        icon: <Trash2 className="w-4 h-4" />,
      });
      fetchFolders();
    }
  };

  const handleMoveFolder = async (bookmarkId: string, folderId: string) => {
    const res = await fetch(`${API_BASE}/bookmarks/${bookmarkId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folderId: folderId || null }),
    });
    if (res.ok) fetchBookmarks();
  };

  const handleToggleTag = async (bookmarkId: string, tagId: string) => {
    // Get current bookmark to check if tag exists
    const bookmark = bookmarks.find((b) => b.id === bookmarkId);
    if (!bookmark) return;

    const hasTag = bookmark.tags.some((t) => t.tag.id === tagId);
    const currentTagIds = bookmark.tags.map((t) => t.tag.id);
    const newTagIds = hasTag
      ? currentTagIds.filter((id) => id !== tagId)
      : [...currentTagIds, tagId];

    const res = await fetch(`${API_BASE}/bookmarks/${bookmarkId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags: newTagIds }),
    });
    if (res.ok) fetchBookmarks();
  };

  const handleSubmitBookmark = async (data: {
    title: string;
    description?: string;
    folderId?: string | null;
    urls: { url: string; isPrimary: boolean; label?: string }[];
    tags: string[];
  }) => {
    const url = editingBookmark
      ? `${API_BASE}/bookmarks/${editingBookmark.id}`
      : `${API_BASE}/bookmarks`;
    const method = editingBookmark ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      toast.success(editingBookmark ? "Bookmark updated" : "Bookmark created", {
        description: editingBookmark
          ? `"${data.title}" has been updated.`
          : `"${data.title}" has been added.`,
        icon: <Check className="w-4 h-4" />,
      });
      setShowForm(false);
      setEditingBookmark(null);
      fetchBookmarks();
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
    if (type === "archive") {
      const res = await fetch(`${API_BASE}/bookmarks/${bookmarkId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.error("Bookmark archived", {
          description: `"${confirmModal.bookmarkTitle}" has been archived.`,
          icon: <Archive className="w-4 h-4" />,
        });
        fetchBookmarks();
      }
    } else {
      const res = await fetch(`${API_BASE}/bookmarks/${bookmarkId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: false }),
      });
      if (res.ok) {
        toast.success("Bookmark restored", {
          description: `"${confirmModal.bookmarkTitle}" has been restored.`,
          icon: <ArchiveRestore className="w-4 h-4" />,
        });
        fetchBookmarks();
      }
    }
    setConfirmModal({
      isOpen: false,
      type: "archive",
      bookmarkId: "",
      bookmarkTitle: "",
    });
  };

  if (initialLoad) return <LoadingScreen />;

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-72 bg-card border-r border-border flex flex-col">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Bookmark className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Pearl</h1>
              <p className="text-xs text-muted-foreground">Bookmark Manager</p>
            </div>
          </div>
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
              <button
                onClick={() => setIsCreatingTag(true)}
                aria-label="Add tag"
                className="p-1.5 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            {isCreatingTag && (
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateTag();
                    if (e.key === "Escape") setIsCreatingTag(false);
                  }}
                  placeholder="Tag name"
                  className="flex-1 px-3 py-1.5 text-sm bg-secondary text-foreground placeholder:text-muted-foreground rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-ring"
                  autoFocus
                />
                <button
                  onClick={handleCreateTag}
                  className="px-3 py-1.5 bg-primary text-primary-foreground text-sm rounded-lg hover:opacity-90"
                >
                  Add
                </button>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <div key={tag.id} className="group flex items-center gap-1">
                  <button
                    onClick={() =>
                      setSelectedTagId(selectedTagId === tag.id ? null : tag.id)
                    }
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                      selectedTagId === tag.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-accent"
                    }`}
                  >
                    {tag.name}
                  </button>
                  <button
                    onClick={() => handleDeleteTag(tag.id)}
                    aria-label={`Delete tag ${tag.name}`}
                    className="p-1 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {tags.length === 0 && !isCreatingTag && (
                <p className="text-xs text-muted-foreground">No tags yet</p>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search your bookmarks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-secondary text-foreground placeholder:text-muted-foreground rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-ring transition-all duration-200"
              />
            </div>

            <ThemeToggle />

            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                showArchived
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Archive className="w-4 h-4" />
              <span className="hidden sm:inline">
                {showArchived ? "Active" : "Archived"}
              </span>
            </button>

            <button
              onClick={() => {
                setEditingBookmark(null);
                setShowForm(true);
              }}
              className="flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground rounded-xl font-medium transition-all duration-200 hover:opacity-90 active:scale-[0.98] shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New</span>
            </button>
          </div>
        </header>

        {/* Content */}
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
              <div className="w-20 h-20 bg-secondary rounded-2xl flex items-center justify-center mb-4">
                <Tag className="w-10 h-10 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium text-foreground mb-2">
                No bookmarks yet
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Start building your collection
              </p>
              <button
                onClick={() => {
                  setEditingBookmark(null);
                  setShowForm(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium transition-all duration-200 hover:opacity-90"
              >
                <Plus className="w-4 h-4" />
                Add your first bookmark
              </button>
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
                  onMoveFolder={handleMoveFolder}
                  onToggleTag={handleToggleTag}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
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
        isOpen={confirmModal.isOpen}
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
