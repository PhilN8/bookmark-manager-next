"use client";

import { useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2 } from "lucide-react";
import { Bookmark, BookmarkFormData, Folder, Tag } from "@/lib/types";
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
import { FolderPickerTree } from "@/features/folders/components/FolderPickerTree";
import { useFolders } from "@/features/folders/hooks";

// Client-side form schema — mirrors BookmarkFormData with isPrimary required.
const formSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  description: z.string().max(2000).optional(),
  folderId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  urls: z
    .array(
      z.object({
        url: z.string().url("Must be a valid URL"),
        isPrimary: z.boolean(),
        label: z.string().max(100).optional(),
      }),
    )
    .min(1, "At least one URL is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface BookmarkFormProps {
  bookmark?: Bookmark | null;
  /** Optional folders override — used in tests to avoid calling useFolders() */
  folders?: Folder[];
  tags: Tag[];
  onSubmit: (data: BookmarkFormData) => void;
  onClose: () => void;
}

export function BookmarkForm({
  bookmark,
  folders: foldersProp,
  tags,
  onSubmit,
  onClose,
}: BookmarkFormProps) {
  // Use injected folders (tests) or fetch from hook (production)
  const { folders: fetchedFolders } = useFolders();
  const folders = foldersProp ?? fetchedFolders;
  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      folderId: "",
      tags: [],
      urls: [{ url: "", isPrimary: true, label: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "urls" });
  const selectedTags = watch("tags") ?? [];
  const urlValues = watch("urls");

  // Populate form when editing an existing bookmark
  useEffect(() => {
    if (bookmark) {
      reset({
        title: bookmark.title,
        description: bookmark.description ?? "",
        folderId: bookmark.folderId ?? "",
        tags: bookmark.tags.map(({ tag }) => tag.id),
        urls: bookmark.urls.map((u) => ({
          url: u.url,
          isPrimary: u.isPrimary,
          label: u.label ?? "",
        })),
      });
    } else {
      reset({
        title: "",
        description: "",
        folderId: "",
        tags: [],
        urls: [{ url: "", isPrimary: true, label: "" }],
      });
    }
  }, [bookmark, reset]);

  const handlePrimaryChange = (index: number, checked: boolean) => {
    if (!checked) return; // must always have one primary; ignore unchecks
    urlValues.forEach((_, i) => {
      setValue(`urls.${i}.isPrimary`, i === index);
    });
  };

  const handleRemoveUrl = (index: number) => {
    if (fields.length === 1) return;
    const wasPrimary = urlValues[index]?.isPrimary;
    remove(index);
    if (wasPrimary) {
      // Promote the first remaining url to primary
      setTimeout(() => setValue("urls.0.isPrimary", true), 0);
    }
  };

  const toggleTag = (tagId: string) => {
    const next = selectedTags.includes(tagId)
      ? selectedTags.filter((t) => t !== tagId)
      : [...selectedTags, tagId];
    setValue("tags", next, { shouldDirty: true });
  };

  const onValidSubmit = (values: FormValues) => {
    onSubmit({
      title: values.title.trim(),
      description: values.description?.trim() || undefined,
      folderId: values.folderId || undefined,
      tags: values.tags ?? [],
      urls: values.urls
        .filter((u) => u.url.trim())
        .map((u, i) => ({
          url: u.url.trim(),
          isPrimary: i === 0 ? true : u.isPrimary,
          label: u.label?.trim() || undefined,
        })),
    });
  };

  return (
    <Dialog open onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {bookmark ? "Edit Bookmark" : "New Bookmark"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onValidSubmit)} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              type="text"
              placeholder="Enter bookmark title"
              {...register("title")}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              type="text"
              placeholder="Add a description..."
              {...register("description")}
            />
            {errors.description && (
              <p className="text-xs text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Folder */}
          <div className="space-y-2">
            <Label>Folder</Label>
            <Controller
              control={control}
              name="folderId"
              render={({ field }) => (
                <FolderPickerTree
                  folders={folders}
                  value={field.value || null}
                  onChange={(id) => field.onChange(id ?? "")}
                />
              )}
            />
          </div>

          {/* URLs */}
          <div className="space-y-3">
            <Label>URLs *</Label>
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-start gap-3">
                <Controller
                  control={control}
                  name={`urls.${index}.isPrimary`}
                  render={({ field: f }) => (
                    <Checkbox
                      checked={f.value}
                      onCheckedChange={(checked) =>
                        handlePrimaryChange(index, checked as boolean)
                      }
                      title="Primary URL"
                      className="mt-2"
                    />
                  )}
                />
                <div className="flex-1 space-y-1">
                  <Input
                    type="url"
                    placeholder="https://example.com"
                    {...register(`urls.${index}.url`)}
                  />
                  {errors.urls?.[index]?.url && (
                    <p className="text-xs text-destructive">
                      {errors.urls[index]!.url!.message}
                    </p>
                  )}
                </div>
                <Input
                  type="text"
                  placeholder="Label"
                  {...register(`urls.${index}.label`)}
                  className="w-28"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveUrl(index)}
                  disabled={fields.length === 1}
                  className="text-muted-foreground hover:text-destructive mt-0.5"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {errors.urls && !Array.isArray(errors.urls) && (
              <p className="text-xs text-destructive">
                {(errors.urls as { message?: string }).message}
              </p>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => append({ url: "", isPrimary: false, label: "" })}
              className="text-primary hover:text-primary/80"
            >
              <Plus className="h-4 w-4 mr-1" /> Add URL
            </Button>
          </div>

          {/* Tags */}
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
            <Button type="submit">{bookmark ? "Update" : "Create"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
