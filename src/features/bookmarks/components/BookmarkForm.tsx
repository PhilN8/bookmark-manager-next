"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Bookmark, Folder, Tag } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface BookmarkFormProps {
  bookmark?: Bookmark | null;
  folders: Folder[];
  tags: Tag[];
  onSubmit: (data: {
    title: string;
    description?: string;
    folderId?: string;
    tags: string[];
    urls: { url: string; isPrimary: boolean; label?: string }[];
  }) => void;
  onClose: () => void;
}

export function BookmarkForm({
  bookmark,
  folders,
  tags,
  onSubmit,
  onClose,
}: BookmarkFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [folderId, setFolderId] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [urls, setUrls] = useState<
    { url: string; isPrimary: boolean; label: string }[]
  >([]);

  useEffect(() => {
    if (bookmark) {
      setTitle(bookmark.title);
      setDescription(bookmark.description || "");
      setFolderId(bookmark.folderId || "");
      setSelectedTags(bookmark.tags.map(({ tag }) => tag.id));
      setUrls(
        bookmark.urls.map((u) => ({
          url: u.url,
          isPrimary: u.isPrimary,
          label: u.label || "",
        })),
      );
    } else {
      setUrls([{ url: "", isPrimary: true, label: "" }]);
    }
  }, [bookmark]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || urls.length === 0 || !urls[0].url.trim()) return;

    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      folderId: folderId || undefined,
      tags: selectedTags,
      urls: urls
        .filter((u) => u.url.trim())
        .map((u, i) => ({
          url: u.url.trim(),
          isPrimary: i === 0 || u.isPrimary,
          label: u.label.trim() || undefined,
        })),
    });
  };

  const addUrl = () => {
    setUrls([...urls, { url: "", isPrimary: false, label: "" }]);
  };

  const removeUrl = (index: number) => {
    if (urls.length === 1) return;
    const newUrls = urls.filter((_, i) => i !== index);
    if (!newUrls.some((u) => u.isPrimary)) {
      newUrls[0].isPrimary = true;
    }
    setUrls(newUrls);
  };

  const updateUrl = (index: number, field: string, value: string | boolean) => {
    const newUrls = [...urls];
    newUrls[index] = { ...newUrls[index], [field]: value };
    if (field === "isPrimary" && value) {
      newUrls.forEach((u, i) => {
        if (i !== index) u.isPrimary = false;
      });
    }
    setUrls(newUrls);
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId],
    );
  };

  const flattenFolders = (
    folders: Folder[],
    depth = 0,
  ): { id: string; name: string; depth: number }[] => {
    return folders.flatMap((f) => [
      { id: f.id, name: f.name, depth },
      ...flattenFolders(f.children || [], depth + 1),
    ]);
  };

  const flatFolders = flattenFolders(folders);

  return (
    <Dialog open onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {bookmark ? "Edit Bookmark" : "New Bookmark"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              type="text"
              placeholder="Enter bookmark title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              type="text"
              placeholder="Add a description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="folder">Folder</Label>
            <select
              id="folder"
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">No folder</option>
              {flatFolders.map((f) => (
                <option key={f.id} value={f.id}>
                  {"—".repeat(f.depth)} {f.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <Label>URLs *</Label>
            {urls.map((url, index) => (
              <div key={index} className="flex items-center gap-3">
                <Checkbox
                  checked={url.isPrimary}
                  onCheckedChange={(checked) =>
                    updateUrl(index, "isPrimary", checked as boolean)
                  }
                  title="Primary URL"
                />
                <Input
                  type="url"
                  placeholder="https://example.com"
                  value={url.url}
                  onChange={(e) => updateUrl(index, "url", e.target.value)}
                  className="flex-1"
                  required={index === 0}
                />
                <Input
                  type="text"
                  placeholder="Label"
                  value={url.label}
                  onChange={(e) => updateUrl(index, "label", e.target.value)}
                  className="w-28"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeUrl(index)}
                  disabled={urls.length === 1}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={addUrl}
              className="text-primary hover:text-primary/80"
            >
              <Plus className="h-4 w-4 mr-1" /> Add URL
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Button
                  key={tag.id}
                  type="button"
                  variant={selectedTags.includes(tag.id) ? "default" : "secondary"}
                  size="sm"
                  onClick={() => toggleTag(tag.id)}
                  className="rounded-full"
                >
                  {tag.name}
                </Button>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {bookmark ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
