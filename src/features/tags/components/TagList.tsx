"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { useTags } from "../hooks/useTags";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { Tag } from "@/lib/types";

export function TagList() {
  const { selectedTagId, setSelectedTagId } = useStore();
  const { tags, createTag, deleteTag } = useTags();
  const [isCreating, setIsCreating] = useState(false);
  const [newTagName, setNewTagName] = useState("");

  const handleCreate = () => {
    const name = newTagName.trim();
    if (!name) return;
    createTag.mutate(name, {
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
    deleteTag.mutate(id, {
      onSuccess: () => {
        toast.error("Tag deleted", { description: `"${name}" has been removed.` });
        if (selectedTagId === id) setSelectedTagId(null);
      },
      onError: () => toast.error("Failed to delete tag"),
    });
  };

  return (
    <div className="p-4 border-t border-border">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-sm text-foreground">Tags</h3>
        <Button variant="ghost" size="icon-xs" onClick={() => setIsCreating(true)}>
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>

      {isCreating && (
        <div className="flex gap-2 mb-3">
          <Input
            type="text"
            placeholder="Tag name"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
              if (e.key === "Escape") setIsCreating(false);
            }}
            className="h-8 text-sm"
            autoFocus
          />
          <Button size="sm" onClick={handleCreate} disabled={createTag.isPending}>
            Add
          </Button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {tags.map((tag: Tag) => (
          <div key={tag.id} className="group flex items-center gap-1">
            <Badge
              variant={selectedTagId === tag.id ? "default" : "secondary"}
              className="cursor-pointer"
              onClick={() => setSelectedTagId(selectedTagId === tag.id ? null : tag.id)}
            >
              {tag.name}
            </Badge>
            <Button
              variant="ghost"
              size="icon-xs"
              className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 hover:text-destructive"
              onClick={() => handleDelete(tag.id, tag.name)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        ))}
        {tags.length === 0 && !isCreating && (
          <p className="text-xs text-muted-foreground">No tags yet</p>
        )}
      </div>
    </div>
  );
}
