"use client";

import {
  Link,
  Edit,
  Trash2,
  ExternalLink,
  Folder,
  ArchiveRestore,
} from "lucide-react";
import { Bookmark } from "@/lib/types";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  onMoveFolder: (bookmarkId: string, folderId: string) => void;
  onToggleTag: (bookmarkId: string, tagId: string) => void;
}

export function BookmarkCard({
  bookmark,
  folders,
  tags,
  onEdit,
  onDelete,
  onRestore,
  onMoveFolder,
  onToggleTag,
}: BookmarkCardProps) {
  const primaryUrl = bookmark.urls.find((u) => u.isPrimary) || bookmark.urls[0];

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
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onRestore?.(bookmark.id)}
              className="hover:text-green-500"
            >
              <ArchiveRestore className="w-4 h-4" />
            </Button>
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

      {bookmark.urls.length > 0 && (
        <div className="mt-4 space-y-1.5">
          {bookmark.urls.slice(0, 3).map((url) => (
            <div key={url.id} className="flex items-center gap-2 text-sm">
              <Link className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span
                className={cn(
                  "truncate text-muted-foreground",
                  url.isPrimary && "text-foreground font-medium",
                )}
              >
                {url.label || url.url}
              </span>
              {url.isPrimary && (
                <span className="text-[10px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded-full">
                  Primary
                </span>
              )}
            </div>
          ))}
          {bookmark.urls.length > 3 && (
            <p className="text-xs text-muted-foreground">
              +{bookmark.urls.length - 3} more
            </p>
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
