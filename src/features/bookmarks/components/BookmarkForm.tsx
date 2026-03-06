"use client";

import { useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, X } from "lucide-react";
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
  DialogClose,
} from "@/components/ui/dialog";
import { FolderPickerTree } from "@/features/folders/components/FolderPickerTree";
import { useFolders } from "@/features/folders/hooks";
import { cn } from "@/lib/utils";

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
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden border-border/40 shadow-2xl rounded-4xl">
        <div className="relative">
          <div className="absolute top-6 right-6 z-10">
            <DialogClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full h-8 w-8 hover:bg-muted/50"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </div>

          <div className="px-8 pt-10 pb-6">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-2xl font-bold tracking-tight">
                {bookmark ? "Edit Bookmark" : "New Bookmark"}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                {bookmark
                  ? "Update your bookmark details"
                  : "Add a new link to your collection"}
              </p>
            </DialogHeader>
          </div>

          <form
            onSubmit={handleSubmit(onValidSubmit)}
            className="px-8 pb-10 space-y-6"
          >
            <div className="space-y-5">
              {/* Title */}
              <div className="space-y-2 group">
                <Label
                  htmlFor="title"
                  className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1"
                >
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="The name of this resource"
                  {...register("title")}
                  className={cn(
                    "h-12 rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-all",
                    errors.title &&
                      "border-destructive/50 focus:ring-destructive/20",
                  )}
                />
                {errors.title && (
                  <p className="text-[10px] font-bold text-destructive uppercase tracking-wider ml-1">
                    {errors.title.message}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2 group">
                <Label
                  htmlFor="description"
                  className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1"
                >
                  Description
                </Label>
                <Input
                  id="description"
                  type="text"
                  placeholder="What's this about? (optional)"
                  {...register("description")}
                  className="h-12 rounded-xl bg-muted/30 border-border/50 focus:bg-background transition-all"
                />
              </div>

              {/* Folder */}
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                  Collection
                </Label>
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
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                  Links <span className="text-destructive">*</span>
                </Label>
                <div className="space-y-3 max-h-75 overflow-y-auto pr-1 scrollbar-thin">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="p-4 rounded-2xl bg-muted/20 border border-border/30 space-y-3 relative group/item transition-all hover:bg-muted/30"
                    >
                      <div className="flex items-start gap-3">
                        <Controller
                          control={control}
                          name={`urls.${index}.isPrimary`}
                          render={({ field: f }) => (
                            <Checkbox
                              checked={f.value}
                              onCheckedChange={(checked) =>
                                handlePrimaryChange(index, checked as boolean)
                              }
                              title="Set as primary link"
                              className="mt-3 h-5 w-5 rounded-md data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                            />
                          )}
                        />
                        <div className="flex-1 space-y-2">
                          <Input
                            type="url"
                            placeholder="https://example.com"
                            {...register(`urls.${index}.url`)}
                            className={cn(
                              "h-10 rounded-lg bg-background border-border/40 transition-all",
                              errors.urls?.[index]?.url &&
                                "border-destructive/50",
                            )}
                          />
                          <div className="flex gap-2">
                            <Input
                              type="text"
                              placeholder="Add label (e.g. Documentation)"
                              {...register(`urls.${index}.label`)}
                              className="h-10 rounded-lg bg-background border-border/40 text-xs transition-all"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveUrl(index)}
                              disabled={fields.length === 1}
                              className="h-10 w-10 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          {errors.urls?.[index]?.url && (
                            <p className="text-[10px] font-bold text-destructive uppercase tracking-wider">
                              {errors.urls[index]!.url!.message}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {errors.urls && !Array.isArray(errors.urls) && (
                  <p className="text-[10px] font-bold text-destructive uppercase tracking-wider ml-1">
                    {(errors.urls as { message?: string }).message}
                  </p>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    append({ url: "", isPrimary: false, label: "" })
                  }
                  className="w-full h-12 rounded-xl border border-dashed border-border/60 hover:border-primary/50 hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all group/btn"
                >
                  <Plus className="h-4 w-4 mr-2 group-hover/btn:scale-110 transition-transform" />
                  <span className="text-xs font-bold uppercase tracking-widest">
                    Add another link
                  </span>
                </Button>
              </div>

              {/* Tags */}
              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                  Tags
                </Label>
                <div className="flex flex-wrap gap-2 p-1">
                  {tags.length > 0 ? (
                    tags.map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className={cn(
                          "px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 border",
                          selectedTags.includes(tag.id)
                            ? "bg-primary border-primary text-primary-foreground shadow-md shadow-primary/20"
                            : "bg-background border-border/50 text-muted-foreground hover:border-primary/30 hover:text-foreground",
                        )}
                      >
                        {tag.name}
                      </button>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground italic ml-1">
                      No tags available in this workspace
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-6 flex gap-3">
              <Button
                type="button"
                variant="ghost"
                className="flex-1 h-12 rounded-xl font-bold tracking-tight text-muted-foreground hover:text-foreground"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-2 h-12 rounded-xl bg-linear-to-r from-primary to-ring hover:opacity-90 font-bold tracking-tight shadow-md hover:shadow-lg transition-all"
              >
                {bookmark ? "Update Bookmark" : "Save Bookmark"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
