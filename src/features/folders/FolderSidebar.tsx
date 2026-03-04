"use client";

import { useState } from "react";
import {
  Folder,
  FolderOpen,
  Plus,
  ChevronRight,
  ChevronDown,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Folder as FolderType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface FolderTreeProps {
  folders: FolderType[];
  selectedFolderId: string | null;
  onSelectFolder: (id: string | null) => void;
  onCreateFolder: (name: string, parentId?: string) => void;
  onUpdateFolder?: (id: string, name: string) => void;
  onDeleteFolder?: (id: string) => void;
}

export function FolderTree({
  folders,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
  onDeleteFolder,
}: FolderTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const handleCreateFolder = (parentId?: string) => {
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim(), parentId);
      setNewFolderName("");
      setIsCreating(null);
    }
  };

  const renderFolder = (folder: FolderType, depth: number = 0) => {
    const hasChildren = folder.children && folder.children.length > 0;
    const isExpanded = expandedIds.has(folder.id);
    const isSelected = selectedFolderId === folder.id;

    return (
      <div key={folder.id}>
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm transition-all duration-200 group",
            isSelected
              ? "bg-primary text-primary-foreground"
              : "hover:bg-accent",
          )}
          style={{ paddingLeft: `${depth * 12 + 12}px` }}
          onClick={() => onSelectFolder(folder.id)}
        >
          {hasChildren ? (
            <Button
              variant="ghost"
              size="icon-xs"
              className="h-5 w-5 p-0"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(folder.id);
              }}
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
          ) : (
            <span className="w-5" />
          )}
          {isExpanded ? (
            <FolderOpen className="w-4 h-4" />
          ) : (
            <Folder className="w-4 h-4" />
          )}
          <span className="truncate flex-1 font-medium">{folder.name}</span>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon-xs"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteFolder?.(folder.id);
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
        {isExpanded && hasChildren && (
          <div>
            {folder.children!.map((child) => renderFolder(child, depth + 1))}
          </div>
        )}
        {isCreating === folder.id && (
          <div
            className="flex items-center gap-2 px-3 py-2"
            style={{ paddingLeft: `${(depth + 1) * 12 + 12}px` }}
          >
            <Input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateFolder(folder.id);
                if (e.key === "Escape") setIsCreating(null);
              }}
              className="h-8 text-sm"
              autoFocus
            />
          </div>
        )}
      </div>
    );
  };

  const rootFolders = folders.filter((f) => !f.parentId);

  return (
    <div>
      <div className="flex items-center justify-between px-3 py-2 mb-1">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Folders
        </h3>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => setIsCreating("root")}
          title="New folder"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm transition-all duration-200 mx-2",
          selectedFolderId === null
            ? "bg-primary text-primary-foreground"
            : "hover:bg-accent",
        )}
        onClick={() => onSelectFolder(null)}
      >
        <Folder className="w-4 h-4" />
        <span className="flex-1 font-medium">All Bookmarks</span>
      </div>
      {rootFolders.map((folder) => renderFolder(folder))}
      {isCreating === "root" && (
        <div className="flex items-center gap-2 px-3 py-2 mx-2 mt-1">
          <Input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateFolder();
              if (e.key === "Escape") setIsCreating(null);
            }}
            placeholder="Folder name"
            className="h-8 text-sm"
            autoFocus
          />
        </div>
      )}
    </div>
  );
}
