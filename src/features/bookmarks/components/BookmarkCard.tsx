"use client";

import { useState } from "react";
import {
  Link,
  Edit,
  Trash2,
  ExternalLink,
  Folder,
  ArchiveRestore,
  Plus,
  X,
} from "lucide-react";
import { Bookmark, BookmarkUrl } from "@/lib/types";
import { cn } from "@/lib/utils";
import { bookmarkApi } from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface BookmarkCardProps {
  bookmark: Bookmark;
  folders: { id: string; name: string }[];
  tags: { id: string; name: string }[];
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (id: string) => void;
  onRestore?: (id: string) => void;
  onHardDelete?: (id: string) => void;
  onMoveFolder: (bookmarkId: string, folderId: string) => void;
  onToggleTag: (bookmarkId: string, tagId: string) => void;
  /** Called after a URL is added or removed so the parent can refetch */
  onUrlsChanged?: (bookmarkId: string) => void;
}

export function BookmarkCard({
  bookmark,
  folders,
  tags,
  onEdit,
  onDelete,
  onRestore,
  onHardDelete,
  onMoveFolder,
  onToggleTag,
  onUrlsChanged,
}: BookmarkCardProps) {
  const primaryUrl = bookmark.urls.find((u) => u.isPrimary) || bookmark.urls[0];

  // URL management state
  const [showUrlManager, setShowUrlManager] = useState(false);
  const [addingUrl, setAddingUrl] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newUrlLabel, setNewUrlLabel] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [isPendingUrl, setIsPendingUrl] = useState(false);
  const [removingUrlId, setRemovingUrlId] = useState<string | null>(null);

  const handleAddUrl = async () => {
    setUrlError(null);
    if (!newUrl.trim()) return;
    try {
      new URL(newUrl.trim());
    } catch {
      setUrlError("Must be a valid URL");
      return;
    }
    setIsPendingUrl(true);
    try {
      await bookmarkApi.addUrl(bookmark.id, {
        url: newUrl.trim(),
        label: newUrlLabel.trim() || undefined,
        isPrimary: false,
      });
      setNewUrl("");
      setNewUrlLabel("");
      setAddingUrl(false);
      onUrlsChanged?.(bookmark.id);
    } catch (err) {
      setUrlError(err instanceof Error ? err.message : "Failed to add URL");
    } finally {
      setIsPendingUrl(false);
    }
  };

  const handleRemoveUrl = async (urlId: string) => {
    setRemovingUrlId(urlId);
    try {
      await bookmarkApi.removeUrl(bookmark.id, urlId);
      onUrlsChanged?.(bookmark.id);
    } catch {
      // silently ignore — parent refetch will reconcile
    } finally {
      setRemovingUrlId(null);
    }
  };

  return (
    <div className="group bg-card border border-border rounded-xl p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
            {bookmark.title}
          </h3>
          {bookmark.description && (
            <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">
              {bookmark.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 transition-opacity duration-200">
          {primaryUrl && (
            <Button variant="ghost" size="icon" asChild>
              <a
                href={primaryUrl.url}
                target="_blank"
                rel="noopener noreferrer"
                title="Open URL"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={() => onEdit(bookmark)}>
            <Edit className="w-4 h-4" />
          </Button>
          {bookmark.archived ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRestore?.(bookmark.id)}
                className="hover:text-green-500"
                title="Restore bookmark"
              >
                <ArchiveRestore className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onHardDelete?.(bookmark.id)}
                className="hover:text-destructive"
                title="Permanently delete"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(bookmark.id)}
              className="hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* URL list */}
      {bookmark.urls.length > 0 && (
        <div className="mt-4 space-y-1.5">
          {(showUrlManager ? bookmark.urls : bookmark.urls.slice(0, 3)).map(
            (url: BookmarkUrl) => (
              <div key={url.id} className="flex items-center gap-2 text-sm">
                <Link className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span
                  className={cn(
                    "truncate text-muted-foreground flex-1",
                    url.isPrimary && "text-foreground font-medium",
                  )}
                >
                  {url.label || url.url}
                </span>
                {url.isPrimary && (
                  <span className="text-[10px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded-full shrink-0">
                    Primary
                  </span>
                )}
                {showUrlManager && (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive shrink-0"
                    title="Remove URL"
                    disabled={
                      bookmark.urls.length <= 1 || removingUrlId === url.id
                    }
                    onClick={() => handleRemoveUrl(url.id)}
                    aria-label={`Remove URL ${url.label || url.url}`}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ),
          )}
          {!showUrlManager && bookmark.urls.length > 3 && (
            <p className="text-xs text-muted-foreground">
              +{bookmark.urls.length - 3} more
            </p>
          )}
          {/* Manage URLs toggle */}
          <button
            type="button"
            onClick={() => {
              setShowUrlManager((v) => !v);
              setAddingUrl(false);
              setUrlError(null);
            }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors mt-1"
          >
            {showUrlManager ? "Hide URL manager" : "Manage URLs"}
          </button>
        </div>
      )}

      {/* Inline add-URL form */}
      {showUrlManager && (
        <div className="mt-2 space-y-2">
          {addingUrl ? (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Input
                  type="url"
                  placeholder="https://example.com"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddUrl();
                    if (e.key === "Escape") setAddingUrl(false);
                  }}
                  className="h-7 text-xs flex-1"
                  autoFocus
                />
                <Input
                  type="text"
                  placeholder="Label"
                  value={newUrlLabel}
                  onChange={(e) => setNewUrlLabel(e.target.value)}
                  className="h-7 text-xs w-24"
                />
                <Button
                  type="button"
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={handleAddUrl}
                  disabled={isPendingUrl}
                >
                  {isPendingUrl ? "Adding…" : "Add"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="h-7 w-7"
                  onClick={() => {
                    setAddingUrl(false);
                    setUrlError(null);
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
              {urlError && (
                <p className="text-xs text-destructive">{urlError}</p>
              )}
            </div>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setAddingUrl(true)}
            >
              <Plus className="w-3 h-3 mr-1" />
              Add URL
            </Button>
          )}
        </div>
      )}

      {bookmark.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {bookmark.tags.map(({ tag }) => (
            <Badge key={tag.id} variant="secondary" className="text-xs">
              {tag.name}
            </Badge>
          ))}
        </div>
      )}

      {bookmark.folder && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Folder className="w-3 h-3" />
          <span>{bookmark.folder.name}</span>
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground">
              <Folder className="w-3 h-3 mr-1" />
              {bookmark.folder ? "Move to..." : "Add to folder..."}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem
              onClick={() => onMoveFolder(bookmark.id, "")}
            >
              No folder
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {folders.map((folder) => (
              <DropdownMenuItem
                key={folder.id}
                onClick={() => onMoveFolder(bookmark.id, folder.id)}
              >
                {folder.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {tags.map((tag) => {
          const hasTag = bookmark.tags.some((t) => t.tag.id === tag.id);
          return (
            <Badge
              key={tag.id}
              variant={hasTag ? "default" : "secondary"}
              className="cursor-pointer text-xs"
              onClick={() => onToggleTag(bookmark.id, tag.id)}
            >
              {tag.name}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}
