"use client";

import { useState } from "react";
import {
  Folder,
  FolderOpen,
  Plus,
  ChevronRight,
  ChevronDown,
  Pencil,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Folder as FolderType } from "@/lib/types";

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
  onUpdateFolder,
  onDeleteFolder,
}: FolderTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
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

  const handleSaveEdit = (folderId: string) => {
    if (newFolderName.trim() && onUpdateFolder) {
      onUpdateFolder(folderId, newFolderName.trim());
    }
    setEditingId(null);
    setNewFolderName("");
  };

  const renderFolder = (folder: FolderType, depth: number = 0) => {
    const hasChildren = folder.children && folder.children.length > 0;
    const isExpanded = expandedIds.has(folder.id);
    const isSelected = selectedFolderId === folder.id;

    return (
      <div key={folder.id}>
        <div
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm transition-all duration-200",
            isSelected
              ? "bg-primary text-primary-foreground"
              : "hover:bg-secondary/50",
          )}
          style={{ paddingLeft: `${depth * 12 + 12}px` }}
          onClick={() => onSelectFolder(folder.id)}
        >
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(folder.id);
              }}
              className="p-0.5 hover:bg-secondary rounded text-muted-foreground hover:text-foreground"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
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
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditingId(folder.id);
                setNewFolderName(folder.name);
              }}
              aria-label={`Edit folder ${folder.name}`}
              className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground"
            >
              <Pencil className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteFolder?.(folder.id);
              }}
              aria-label={`Delete folder ${folder.name}`}
              className="p-1 hover:bg-red-50 rounded text-muted-foreground hover:text-red-500"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
        {isExpanded && hasChildren && (
          <div>
            {folder.children.map((child) => renderFolder(child, depth + 1))}
          </div>
        )}
        {isCreating === folder.id && (
          <div
            className="flex items-center gap-2 px-3 py-2"
            style={{ paddingLeft: `${(depth + 1) * 12 + 12}px` }}
          >
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateFolder(folder.id);
                if (e.key === "Escape") setIsCreating(null);
              }}
              className="flex-1 px-3 py-1.5 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
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
        <button
          onClick={() => setIsCreating("root")}
          className="p-1.5 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground"
          title="New folder"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm transition-all duration-200 mx-2",
          selectedFolderId === null
            ? "bg-primary text-primary-foreground"
            : "hover:bg-secondary/50",
        )}
        onClick={() => onSelectFolder(null)}
      >
        <Folder className="w-4 h-4" />
        <span className="flex-1 font-medium">All Bookmarks</span>
      </div>
      {rootFolders.map((folder) => renderFolder(folder))}
      {isCreating === "root" && (
        <div className="flex items-center gap-2 px-3 py-2 mx-2 mt-1">
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateFolder();
              if (e.key === "Escape") setIsCreating(null);
            }}
            placeholder="Folder name"
            className="flex-1 px-3 py-1.5 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            autoFocus
          />
        </div>
      )}
    </div>
  );
}
