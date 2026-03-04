import { useCallback } from "react";
import { Folder } from "@/lib/types";
import { useStore } from "@/lib/store";

const API_BASE = "/api";

export function useFolders() {
  const { folders, setFolders } = useStore();

  const fetchFolders = useCallback(async () => {
    const res = await fetch(`${API_BASE}/folders`);
    if (res.ok) setFolders(await res.json());
  }, [setFolders]);

  const createFolder = async (name: string, parentId?: string) => {
    const res = await fetch(`${API_BASE}/folders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, parentId }),
    });
    if (res.ok) fetchFolders();
    return res;
  };

  const updateFolder = async (id: string, name: string) => {
    const res = await fetch(`${API_BASE}/folders`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name }),
    });
    if (res.ok) fetchFolders();
    return res;
  };

  const deleteFolder = async (id: string) => {
    const res = await fetch(`${API_BASE}/folders?id=${id}`, {
      method: "DELETE",
    });
    if (res.ok) fetchFolders();
    return res;
  };

  return {
    folders,
    fetchFolders,
    createFolder,
    updateFolder,
    deleteFolder,
  };
}
