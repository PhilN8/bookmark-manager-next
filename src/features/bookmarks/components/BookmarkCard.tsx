"use client";

import { useState } from "react";
import {
  Edit,
  Trash2,
  ExternalLink,
  Folder,
  ArchiveRestore,
  Plus,
  X,
  MoreHorizontal,
  Tag as TagIcon,
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
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
    <div className="group relative bg-card border border-border rounded-2xl p-6 hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-white/5 transition-all duration-300 card-hover overflow-hidden">
      {/* Decorative Gradient Accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/10 transition-colors" />

      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            {bookmark.folder && (
              <Badge
                variant="outline"
                className="h-5 px-1.5 font-normal text-[10px] uppercase tracking-wider text-muted-foreground border-muted-foreground/20"
              >
                {bookmark.folder.name}
              </Badge>
            )}
          </div>
          <h3 className="font-semibold text-lg leading-snug text-foreground tracking-tight group-hover:text-primary transition-colors">
            {bookmark.title}
          </h3>
          {bookmark.description && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
              {bookmark.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                Actions
              </DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onEdit(bookmark)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit bookmark
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                Organize
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {/* Folders Submenu */}
              {folders.map((folder) => (
                <DropdownMenuItem
                  key={folder.id}
                  onClick={() => onMoveFolder(bookmark.id, folder.id)}
                  className={cn(
                    bookmark.folderId === folder.id && "bg-muted font-medium",
                  )}
                >
                  <Folder className="w-4 h-4 mr-2" />
                  {folder.name}
                </DropdownMenuItem>
              ))}

              <DropdownMenuSeparator />

              {bookmark.archived ? (
                <>
                  <DropdownMenuItem
                    onClick={() => onRestore?.(bookmark.id)}
                    className="text-green-600 focus:text-green-600 focus:bg-green-50"
                  >
                    <ArchiveRestore className="w-4 h-4 mr-2" />
                    Restore
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onHardDelete?.(bookmark.id)}
                    className="text-destructive focus:text-destructive focus:bg-destructive/5"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete permanently
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem
                  onClick={() => onDelete(bookmark.id)}
                  className="text-destructive focus:text-destructive focus:bg-destructive/5"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Archive
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {primaryUrl && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8 rounded-full shadow-sm"
                  asChild
                >
                  <a
                    href={primaryUrl.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Open link</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      {/* URL list */}
      {bookmark.urls.length > 0 && (
        <div className="mt-5 space-y-2 border-t border-border/50 pt-4">
          {(showUrlManager ? bookmark.urls : bookmark.urls.slice(0, 2)).map(
            (url: BookmarkUrl) => (
              <div
                key={url.id}
                className="group/url flex items-center gap-2.5 text-xs"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-border shrink-0 group-hover/url:bg-primary transition-colors" />
                <span
                  className={cn(
                    "truncate text-muted-foreground flex-1",
                    url.isPrimary && "text-foreground font-medium",
                  )}
                >
                  {url.label || url.url}
                </span>
                {url.isPrimary && (
                  <span className="text-[9px] font-semibold uppercase tracking-widest text-primary/60 px-1.5 py-0.5 rounded-md bg-primary/5 shrink-0">
                    Primary
                  </span>
                )}
                {showUrlManager && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive shrink-0"
                    title="Remove URL"
                    disabled={
                      bookmark.urls.length <= 1 || removingUrlId === url.id
                    }
                    onClick={() => handleRemoveUrl(url.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ),
          )}

          <div className="flex items-center justify-between gap-4 mt-1">
            <button
              type="button"
              onClick={() => {
                setShowUrlManager((v) => !v);
                setAddingUrl(false);
                setUrlError(null);
              }}
              className="text-[10px] font-medium text-muted-foreground hover:text-primary uppercase tracking-wider transition-colors"
            >
              {showUrlManager
                ? "Close Manager"
                : `${bookmark.urls.length > 2 ? `+${bookmark.urls.length - 2} more · ` : ""}Manage Links`}
            </button>

            {showUrlManager && !addingUrl && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
                onClick={() => setAddingUrl(true)}
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Link
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Inline add-URL form */}
      {showUrlManager && addingUrl && (
        <div className="mt-3 p-3 rounded-xl bg-muted/30 border border-border/50 space-y-2">
          <div className="flex items-center gap-2">
            <Input
              type="url"
              placeholder="https://..."
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              className="h-8 text-xs flex-1 bg-background"
              autoFocus
            />
            <Input
              type="text"
              placeholder="Label"
              value={newUrlLabel}
              onChange={(e) => setNewUrlLabel(e.target.value)}
              className="h-8 text-xs w-24 bg-background"
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-[10px] uppercase"
              onClick={() => setAddingUrl(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-7 px-3 text-[10px] uppercase tracking-wider"
              onClick={handleAddUrl}
              disabled={isPendingUrl}
            >
              {isPendingUrl ? "Adding…" : "Add"}
            </Button>
          </div>
          {urlError && (
            <p className="text-[10px] text-destructive font-medium px-1">
              {urlError}
            </p>
          )}
        </div>
      )}

      {/* Tags section */}
      <div className="mt-6 flex flex-wrap gap-2">
        {bookmark.tags.length > 0 &&
          bookmark.tags.map(({ tag }) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="rounded-lg px-2 py-0.5 text-[10px] font-medium bg-muted/50 text-muted-foreground border-transparent hover:border-border transition-colors"
            >
              <TagIcon className="w-2.5 h-2.5 mr-1 opacity-50" />
              {tag.name}
            </Badge>
          ))}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center justify-center w-6 h-6 rounded-lg border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-all">
              <Plus className="w-3 h-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40">
            <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Toggle Tags
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {tags.map((tag) => {
              const hasTag = bookmark.tags.some((t) => t.tag.id === tag.id);
              return (
                <DropdownMenuItem
                  key={tag.id}
                  onClick={() => onToggleTag(bookmark.id, tag.id)}
                  className="flex items-center justify-between"
                >
                  <span className="flex items-center">
                    <TagIcon className="w-3 h-3 mr-2" />
                    {tag.name}
                  </span>
                  {hasTag && (
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
