"use client";

import { useState } from "react";
import { Building2, Plus, Check } from "lucide-react";
import { useStore } from "@/lib/store";
import { useWorkspaces } from "../hooks/useWorkspaces";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function WorkspaceSwitcher() {
  const { selectedWorkspaceId, setSelectedWorkspaceId } = useStore();
  const { workspaces, createWorkspace } = useWorkspaces();
  const [isCreating, setIsCreating] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");

  const selectedWorkspace = workspaces.find((w) => w.id === selectedWorkspaceId);

  const handleCreate = async () => {
    const name = newWorkspaceName.trim();
    if (!name) return;
    createWorkspace.mutate(name, {
      onSuccess: () => {
        setNewWorkspaceName("");
        setIsCreating(false);
      },
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full justify-start gap-3 px-3 py-2.5 h-auto">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <Building2 className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {selectedWorkspace?.name || "Select workspace"}
            </p>
            {selectedWorkspace && (
              <p className="text-xs text-muted-foreground">
                {selectedWorkspace._count?.bookmarks || 0} bookmarks
              </p>
            )}
          </div>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-64">
        {workspaces.map((workspace) => (
          <DropdownMenuItem
            key={workspace.id}
            onClick={() => setSelectedWorkspaceId(workspace.id)}
            className="gap-3"
          >
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{workspace.name}</p>
              <p className="text-xs text-muted-foreground">
                {workspace._count?.bookmarks || 0} bookmarks •{" "}
                {workspace._count?.folders || 0} folders
              </p>
            </div>
            {workspace.id === selectedWorkspaceId && <Check className="w-4 h-4" />}
          </DropdownMenuItem>
        ))}

        {workspaces.length === 0 && !isCreating && (
          <div className="px-3 py-6 text-center">
            <p className="text-sm text-muted-foreground">No workspaces yet</p>
          </div>
        )}

        <DropdownMenuSeparator />

        {isCreating ? (
          <div className="flex gap-2 px-2 py-2">
            <Input
              type="text"
              placeholder="Workspace name"
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") setIsCreating(false);
              }}
              className="h-8 text-sm"
              autoFocus
            />
            <Button size="sm" onClick={handleCreate} disabled={createWorkspace.isPending}>
              Add
            </Button>
          </div>
        ) : (
          <DropdownMenuItem onClick={() => setIsCreating(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Create new workspace
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
