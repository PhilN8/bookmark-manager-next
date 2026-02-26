"use client";

import { Loader2, Bookmark, Folder, Tag } from "lucide-react";

export function LoadingScreen() {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar skeleton */}
      <aside className="w-72 bg-card border-r border-border flex flex-col animate-pulse">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-secondary rounded-xl" />
            <div>
              <div className="h-5 w-16 bg-secondary rounded mb-1" />
              <div className="h-3 w-24 bg-secondary rounded" />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-3">
            <div className="h-4 w-20 bg-secondary rounded" />
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 bg-secondary rounded-lg" />
              ))}
            </div>
          </div>

          <div className="p-4 border-t border-border">
            <div className="h-4 w-12 bg-secondary rounded mb-3" />
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-6 w-14 bg-secondary rounded-full" />
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Main content skeleton */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-card border-b border-border p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 h-12 bg-secondary rounded-xl" />
            <div className="h-10 w-10 bg-secondary rounded-xl" />
            <div className="h-10 w-24 bg-secondary rounded-xl" />
            <div className="h-10 w-20 bg-secondary rounded-xl" />
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-6">
            {/* Animated icons */}
            <div className="relative">
              <div className="w-24 h-24 bg-secondary rounded-3xl flex items-center justify-center">
                <Bookmark className="w-10 h-10 text-muted-foreground" />
              </div>
              <div className="absolute -top-1 -right-1 w-8 h-8 bg-primary rounded-xl flex items-center justify-center animate-bounce" style={{ animationDuration: '1.5s' }}>
                <Loader2 className="w-4 h-4 text-primary-foreground animate-spin" />
              </div>
            </div>

            {/* Loading message */}
            <div className="text-center space-y-2">
              <h2 className="text-lg font-semibold text-foreground">Loading your bookmarks</h2>
              <p className="text-sm text-muted-foreground">Fetching your collection...</p>
            </div>

            {/* Progress indicators */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Folder className="w-3.5 h-3.5" />
                <span>Folders</span>
              </div>
              <div className="w-1 h-1 bg-secondary rounded-full" />
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Bookmark className="w-3.5 h-3.5" />
                <span>Bookmarks</span>
              </div>
              <div className="w-1 h-1 bg-secondary rounded-full" />
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Tag className="w-3.5 h-3.5" />
                <span>Tags</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
