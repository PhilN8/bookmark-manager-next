"use client";

import { useState, useEffect } from "react";
import { Building2, Plus, Check } from "lucide-react";
import { useStore } from "@/lib/store";
import { workspaceApi } from "@/lib/api";

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
  const { workspaces, setWorkspaces, selectedWorkspaceId, setSelectedWorkspaceId } = useStore();
  const [isCreating, setIsCreating] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const selectedWorkspace = workspaces?.find(w => w.id === selectedWorkspaceId);

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadWorkspaces = async () => {
    setIsLoading(true);
    try {
      const userId = "default-user";
      const data = await workspaceApi.getAll(userId);
      setWorkspaces(data);
      if (data.length > 0 && !selectedWorkspaceId) {
        setSelectedWorkspaceId(data[0].id);
      }
    } catch (error) {
      console.error("Error loading workspaces:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) return;
    
    try {
      const userId = "default-user";
      const workspace = await workspaceApi.create(newWorkspaceName.trim(), userId);
      setWorkspaces([...workspaces, workspace]);
      setSelectedWorkspaceId(workspace.id);
      setNewWorkspaceName("");
      setIsCreating(false);
    } catch (error) {
      console.error("Error creating workspace:", error);
    }
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
                {workspace._count?.bookmarks || 0} bookmarks • {workspace._count?.folders || 0} folders
              </p>
            </div>
            {workspace.id === selectedWorkspaceId && (
              <Check className="w-4 h-4" />
            )}
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
                if (e.key === "Enter") handleCreateWorkspace();
                if (e.key === "Escape") setIsCreating(false);
              }}
              className="h-8 text-sm"
              autoFocus
            />
            <Button size="sm" onClick={handleCreateWorkspace}>
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
