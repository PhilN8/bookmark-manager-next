"use client";

import { Bookmark, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/features/auth";
import { FolderList } from "@/features/folders";
import { TagList } from "@/features/tags";
import { WorkspaceSwitcher } from "@/features/workspaces";
import { Button } from "@/components/ui/button";

export function Sidebar() {
  const { logout } = useAuth();

  return (
    <div className="flex flex-col h-full bg-card border-r border-border overflow-hidden">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-linear-to-br from-primary to-ring rounded-xl flex items-center justify-center shadow-md">
            <Bookmark className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground tracking-tight">Pearl</h1>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Bookmark Manager</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        <WorkspaceSwitcher />
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="p-4">
          <FolderList />
        </div>

        <TagList />
      </div>

      <div className="p-4 border-t border-border bg-muted/5">
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="flex-1 justify-start text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-xl transition-all"
          >
            <LogOut className="w-3.5 h-3.5 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
