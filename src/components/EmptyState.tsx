import React from "react";
import { Sparkles, Plus, Search, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: "search" | "bookmarks" | "archive";
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ title, description, icon = "bookmarks", action }: EmptyStateProps) {
  const Icon = {
    search: Search,
    bookmarks: Sparkles,
    archive: Archive,
  }[icon];

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full" />
        <div className="relative w-20 h-20 bg-card border border-border rounded-3xl flex items-center justify-center shadow-xl shadow-black/5 dark:shadow-white/5">
          <Icon className="w-8 h-8 text-primary/40" />
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-linear-to-br from-primary to-ring rounded-full flex items-center justify-center shadow-lg animate-pulse">
          <Plus className="w-4 h-4 text-primary-foreground" />
        </div>
      </div>
      
      <h3 className="text-xl font-bold text-foreground tracking-tight mb-2">
        {title}
      </h3>
      <p className="text-muted-foreground text-sm max-w-[280px] leading-relaxed mb-8">
        {description}
      </p>

      {action && (
        <Button 
          onClick={action.onClick}
          className="rounded-full px-6 bg-linear-to-r from-primary to-ring hover:opacity-90 transition-all shadow-md hover:shadow-lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          {action.label}
        </Button>
      )}
    </div>
  );
}
