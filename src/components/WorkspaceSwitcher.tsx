"use client";

import { useState, useEffect } from "react";
import { Building2, Plus, Settings, ChevronDown, Check } from "lucide-react";
import { useStore } from "@/lib/store";
import { workspaceApi } from "@/lib/api";
import { Workspace } from "@/lib/types";

export function WorkspaceSwitcher() {
  const { workspaces, setWorkspaces, selectedWorkspaceId, setSelectedWorkspaceId } = useStore();
  const [isOpen, setIsOpen] = useState(false);
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
      // For MVP, use a default user ID
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
      setIsOpen(false);
    } catch (error) {
      console.error("Error creating workspace:", error);
    }
  };

  const handleSelectWorkspace = (workspaceId: string) => {
    setSelectedWorkspaceId(workspaceId);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Current Workspace Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-secondary rounded-xl transition-colors"
      >
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
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Menu */}
          <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
            <div className="max-h-64 overflow-y-auto">
              {workspaces.map((workspace) => (
                <button
                  key={workspace.id}
                  onClick={() => handleSelectWorkspace(workspace.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-secondary transition-colors ${
                    workspace.id === selectedWorkspaceId ? "bg-secondary" : ""
                  }`}
                >
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {workspace.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {workspace._count?.bookmarks || 0} bookmarks • {workspace._count?.folders || 0} folders
                    </p>
                  </div>
                  {workspace.id === selectedWorkspaceId && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </button>
              ))}

              {workspaces.length === 0 && !isCreating && (
                <div className="px-3 py-6 text-center">
                  <p className="text-sm text-muted-foreground">No workspaces yet</p>
                </div>
              )}
            </div>

            {/* Create New Workspace */}
            <div className="border-t border-border p-2">
              {isCreating ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateWorkspace();
                      if (e.key === "Escape") setIsCreating(false);
                    }}
                    placeholder="Workspace name"
                    className="flex-1 px-3 py-2 text-sm bg-secondary text-foreground placeholder:text-muted-foreground rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-ring"
                    autoFocus
                  />
                  <button
                    onClick={handleCreateWorkspace}
                    className="px-3 py-2 bg-primary text-primary-foreground text-sm rounded-lg hover:opacity-90"
                  >
                    Add
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsCreating(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create new workspace
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
