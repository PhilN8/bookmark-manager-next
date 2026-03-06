"use client";

import {
  Folder,
  FolderOpen,
  Plus,
  ChevronRight,
  ChevronDown,
  Trash2,
  FolderPlus,
  Pencil,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { useFolders } from "../hooks/useFolders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Folder as FolderType } from "@/lib/types";

export function FolderList() {
  const { selectedFolderId, setSelectedFolderId } = useStore();
  const { folders, createFolder, updateFolder, deleteFolder } = useFolders();

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCreate = (parentId?: string) => {
    const name = newFolderName.trim();
    if (!name) return;
    createFolder.mutate(
      { name, parentId },
      {
        onSuccess: () => {
          toast.success("Folder created", {
            description: `"${name}" has been added.`,
            icon: <FolderPlus className="w-4 h-4" />,
          });
          setNewFolderName("");
          setIsCreating(null);
        },
        onError: () => toast.error("Failed to create folder"),
      },
    );
  };

  const handleStartRename = (folder: FolderType) => {
    setRenamingId(folder.id);
    setRenameValue(folder.name);
  };

  const handleRename = (id: string) => {
    const name = renameValue.trim();
    if (!name) return;
    updateFolder.mutate(
      { id, name },
      {
        onSuccess: () => {
          toast.success("Folder renamed", {
            description: `"${name}" has been updated.`,
            icon: <Pencil className="w-4 h-4" />,
          });
          setRenamingId(null);
        },
        onError: () => toast.error("Failed to rename folder"),
      },
    );
  };

  const handleDelete = (folder: FolderType) => {
    if (!confirm("Delete this folder? Bookmarks will be moved to root.")) return;
    deleteFolder.mutate(folder.id, {
      onSuccess: () => {
        toast.error("Folder deleted", {
          description: `"${folder.name}" has been removed.`,
          icon: <Trash2 className="w-4 h-4" />,
        });
        if (selectedFolderId === folder.id) setSelectedFolderId(null);
      },
      onError: () => toast.error("Failed to delete folder"),
    });
  };

  const renderFolder = (folder: FolderType, depth = 0) => {
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

          {renamingId === folder.id ? (
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename(folder.id);
                if (e.key === "Escape") setRenamingId(null);
              }}
              onBlur={() => setRenamingId(null)}
              className="h-6 text-sm flex-1 px-1"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              className="truncate flex-1 font-medium"
              onDoubleClick={(e) => {
                e.stopPropagation();
                handleStartRename(folder);
              }}
            >
              {folder.name}
            </span>
          )}

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon-xs"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
              title="Add sub-folder"
              onClick={(e) => {
                e.stopPropagation();
                setIsCreating(folder.id);
                setNewFolderName("");
              }}
            >
              <Plus className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
              title="Delete folder"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(folder);
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
                if (e.key === "Enter") handleCreate(folder.id);
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
  };

  const onSelectFolder = (id: string | null) =>
    setSelectedFolderId(selectedFolderId === id ? null : id);

  const rootFolders = folders.filter((f: FolderType) => !f.parentId);

  return (
    <div>
      <div className="flex items-center justify-between px-3 py-2 mb-1">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Folders
        </h3>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => {
            setIsCreating("root");
            setNewFolderName("");
          }}
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
        onClick={() => setSelectedFolderId(null)}
      >
        <Folder className="w-4 h-4" />
        <span className="flex-1 font-medium">All Bookmarks</span>
      </div>

      {rootFolders.map((folder: FolderType) => renderFolder(folder))}

      {isCreating === "root" && (
        <div className="flex items-center gap-2 px-3 py-2 mx-2 mt-1">
          <Input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
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
