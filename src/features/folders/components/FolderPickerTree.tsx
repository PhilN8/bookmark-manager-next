"use client";

import { useState } from "react";
import { Folder, FolderOpen, ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Folder as FolderType } from "@/lib/types";
import { Button } from "@/components/ui/button";

interface FolderPickerTreeProps {
  folders: FolderType[];
  value: string | null;
  onChange: (id: string | null) => void;
}

function PickerNode({
  folder,
  depth,
  value,
  onChange,
  expandedIds,
  onToggle,
}: {
  folder: FolderType;
  depth: number;
  value: string | null;
  onChange: (id: string | null) => void;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
}) {
  const hasChildren = (folder.children?.length ?? 0) > 0;
  const isExpanded = expandedIds.has(folder.id);
  const isSelected = value === folder.id;

  return (
    <div>
      <div
        role="option"
        aria-selected={isSelected}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer text-sm transition-colors",
          isSelected
            ? "bg-primary text-primary-foreground"
            : "hover:bg-accent",
        )}
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
        onClick={() => onChange(isSelected ? null : folder.id)}
      >
        {hasChildren ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="h-4 w-4 p-0 shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              onToggle(folder.id);
            }}
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </Button>
        ) : (
          <span className="w-4 shrink-0" />
        )}
        {isExpanded ? (
          <FolderOpen className="w-3.5 h-3.5 shrink-0" />
        ) : (
          <Folder className="w-3.5 h-3.5 shrink-0" />
        )}
        <span className="truncate">{folder.name}</span>
      </div>
      {isExpanded && hasChildren && (
        <div>
          {folder.children!.map((child) => (
            <PickerNode
              key={child.id}
              folder={child}
              depth={depth + 1}
              value={value}
              onChange={onChange}
              expandedIds={expandedIds}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FolderPickerTree({
  folders,
  value,
  onChange,
}: FolderPickerTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

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

  const rootFolders = folders.filter((f) => !f.parentId);

  return (
    <div
      role="listbox"
      aria-label="Select folder"
      className="border border-input rounded-md bg-background max-h-48 overflow-y-auto py-1"
    >
      <div
        role="option"
        aria-selected={value === null}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer text-sm mx-1 transition-colors",
          value === null
            ? "bg-primary text-primary-foreground"
            : "hover:bg-accent",
        )}
        onClick={() => onChange(null)}
      >
        <span className="w-4 shrink-0" />
        <Folder className="w-3.5 h-3.5 shrink-0" />
        <span className="text-muted-foreground italic">No folder</span>
      </div>
      {rootFolders.map((folder) => (
        <PickerNode
          key={folder.id}
          folder={folder}
          depth={1}
          value={value}
          onChange={onChange}
          expandedIds={expandedIds}
          onToggle={toggleExpand}
        />
      ))}
    </div>
  );
}
