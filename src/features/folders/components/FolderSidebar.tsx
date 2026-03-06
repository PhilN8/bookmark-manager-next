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
      <div key={folder.id} className="animate-in fade-in slide-in-from-left-2 duration-300">
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer text-sm transition-all duration-200 group relative mx-1",
            isSelected
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
              : "hover:bg-muted/50 text-muted-foreground hover:text-foreground",
          )}
          style={{ paddingLeft: `${depth * 12 + 12}px` }}
          onClick={() => onSelectFolder(folder.id)}
        >
          {hasChildren ? (
            <button
              className="h-5 w-5 flex items-center justify-center rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
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
            </button>
          ) : (
            <span className="w-5" />
          )}
          {isExpanded ? (
            <FolderOpen className={cn("w-4 h-4 transition-transform duration-300", isSelected ? "scale-110" : "")} />
          ) : (
            <Folder className={cn("w-4 h-4 transition-transform duration-300", isSelected ? "scale-110" : "")} />
          )}
          <span className={cn("truncate flex-1 font-medium tracking-tight", isSelected ? "font-bold" : "")}>{folder.name}</span>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0">
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive rounded-lg", isSelected ? "text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10" : "text-muted-foreground")}
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
          <div className="mt-0.5 space-y-0.5">
            {folder.children!.map((child) => renderFolder(child, depth + 1))}
          </div>
        )}
        {isCreating === folder.id && (
          <div
            className="flex items-center gap-2 px-3 py-2 animate-in zoom-in-95 duration-200"
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
              className="h-8 text-xs rounded-lg bg-background border-primary/30 focus:ring-primary/20"
              autoFocus
              placeholder="New subfolder..."
            />
          </div>
        )}
      </div>
    );
  };

  const rootFolders = folders.filter((f) => !f.parentId);

  return (
    <div className="space-y-4 py-2">
      <div className="space-y-1">
        <div className="flex items-center justify-between px-4 mb-2">
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] ml-1">
            Collections
          </h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
            onClick={() => setIsCreating("root")}
            title="New folder"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
        
        <div className="space-y-1">
          <div
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer text-sm transition-all duration-200 mx-2 group relative",
              selectedFolderId === null
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "hover:bg-muted/50 text-muted-foreground hover:text-foreground",
            )}
            onClick={() => onSelectFolder(null)}
          >
            <Folder className={cn("w-4 h-4 transition-transform duration-300", selectedFolderId === null ? "scale-110" : "")} />
            <span className={cn("flex-1 font-medium tracking-tight", selectedFolderId === null ? "font-bold" : "")}>All Bookmarks</span>
          </div>
          
          <div className="mt-2 space-y-1">
            {rootFolders.map((folder) => renderFolder(folder))}
          </div>
          
          {isCreating === "root" && (
            <div className="px-4 py-2 mx-2 mt-1 animate-in slide-in-from-top-2 duration-200">
              <Input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateFolder();
                  if (e.key === "Escape") setIsCreating(null);
                }}
                placeholder="Folder name..."
                className="h-9 text-xs rounded-xl bg-background border-primary/30 focus:ring-primary/20 shadow-sm"
                autoFocus
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
