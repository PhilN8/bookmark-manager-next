"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TagItemProps {
  id: string;
  name: string;
  isSelected?: boolean;
  onSelect: (id: string) => void;
  onDelete?: (id: string, name: string) => void;
  className?: string;
}

/**
 * A singular, reusable component for displaying a single tag.
 * Adheres to the "Pearl" minimalist aesthetic with monochromatic styling and subtle interactions.
 */
export function TagItem({
  id,
  name,
  isSelected = false,
  onSelect,
  onDelete,
  className,
}: TagItemProps) {
  return (
    <div 
      className={cn(
        "group flex items-center gap-1 animate-in fade-in duration-300",
        className
      )}
    >
      <button
        type="button"
        onClick={() => onSelect(id)}
        className={cn(
          "px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-200 border shadow-sm",
          isSelected
            ? "bg-primary border-primary text-primary-foreground shadow-primary/20"
            : "bg-background border-border/50 text-muted-foreground hover:border-primary/30 hover:text-foreground hover:shadow-md"
        )}
      >
        {name}
      </button>
      
      {onDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 rounded-full transition-all scale-75 group-hover:scale-100"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(id, name);
          }}
          title={`Delete tag "${name}"`}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      )}
    </div>
  );
}
