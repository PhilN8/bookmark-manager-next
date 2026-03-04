import { useCallback } from "react";
import { useStore } from "@/lib/store";

const API_BASE = "/api";

export function useTags() {
  const { tags, setTags } = useStore();

  const fetchTags = useCallback(async () => {
    const res = await fetch(`${API_BASE}/tags`);
    if (res.ok) setTags(await res.json());
  }, [setTags]);

  const createTag = async (name: string) => {
    const res = await fetch(`${API_BASE}/tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) fetchTags();
    return res;
  };

  const deleteTag = async (id: string) => {
    const res = await fetch(`${API_BASE}/tags?id=${id}`, {
      method: "DELETE",
    });
    if (res.ok) fetchTags();
    return res;
  };

  return {
    tags,
    fetchTags,
    createTag,
    deleteTag,
  };
}
