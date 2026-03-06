"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { useTags } from "../hooks/useTags";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Tag } from "@/lib/types";
import { TagItem } from "./TagItem";

export function TagList() {
  const { selectedTagId, setSelectedTagId } = useStore();
  const { tags, createTag, deleteTag, isCreating: tagCreating } = useTags();
  const [isCreating, setIsCreating] = useState(false);
  const [newTagName, setNewTagName] = useState("");

  const handleCreate = () => {
    const name = newTagName.trim();
    if (!name) return;
    createTag(name, {
      onSuccess: () => {
        toast.success("Tag created", { description: `"${name}" has been added.` });
        setNewTagName("");
        setIsCreating(false);
      },
      onError: () => toast.error("Failed to create tag"),
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm("Delete this tag?")) return;
    deleteTag(id, {
      onSuccess: () => {
        toast.error("Tag deleted", { description: `"${name}" has been removed.` });
        if (selectedTagId === id) setSelectedTagId(null);
      },
      onError: () => toast.error("Failed to delete tag"),
    });
  };

  const handleSelect = (id: string) => {
    setSelectedTagId(selectedTagId === id ? null : id);
  };

  return (
    <div className="p-4 border-t border-border/50 bg-muted/5">
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
          Tags
        </h3>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-6 w-6 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
          onClick={() => setIsCreating(true)}
        >
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>

      {isCreating && (
        <div className="flex gap-2 mb-4 animate-in slide-in-from-top-2 duration-200">
          <Input
            type="text"
            placeholder="New tag..."
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
              if (e.key === "Escape") setIsCreating(false);
            }}
            className="h-9 text-xs rounded-xl bg-background border-primary/30 focus:ring-primary/20 shadow-sm"
            autoFocus
          />
          <Button 
            size="sm" 
            className="h-9 rounded-xl px-4 bg-primary font-bold text-xs uppercase tracking-wider"
            onClick={handleCreate} 
            disabled={tagCreating}
          >
            Add
          </Button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {tags.map((tag: Tag) => (
          <TagItem
            key={tag.id}
            id={tag.id}
            name={tag.name}
            isSelected={selectedTagId === tag.id}
            onSelect={handleSelect}
            onDelete={handleDelete}
          />
        ))}
        {tags.length === 0 && !isCreating && (
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest ml-1 opacity-60">
            No tags yet
          </p>
        )}
      </div>
    </div>
  );
}
