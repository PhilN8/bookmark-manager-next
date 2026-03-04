/** @jest-environment jsdom */

import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useBookmarks } from "@/features/bookmarks/hooks/useBookmarks";
import { useStore } from "@/lib/store";

jest.mock("@/lib/store", () => ({ useStore: jest.fn() }));
const useStoreMock = useStore as jest.MockedFunction<typeof useStore>;

function createWrapper() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client }, children);
}

const baseStore = {
  user: { id: "user-1", email: "test@example.com", name: null },
  selectedWorkspaceId: "ws-1",
  selectedFolderId: null,
  selectedTagId: null,
  searchQuery: "",
  showArchived: false,
  setUser: jest.fn(),
  setSelectedWorkspaceId: jest.fn(),
  setSelectedFolderId: jest.fn(),
  setSelectedTagId: jest.fn(),
  setSearchQuery: jest.fn(),
  setShowArchived: jest.fn(),
};

const mockBookmarks = [
  {
    id: "bm-1",
    title: "Example",
    description: null,
    folderId: null,
    workspaceId: "ws-1",
    archived: false,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    urls: [{ id: "url-1", url: "https://example.com", isPrimary: true, label: null }],
    tags: [],
    folder: null,
  },
];

describe("useBookmarks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useStoreMock.mockImplementation(() => baseStore as ReturnType<typeof useStore>);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ items: mockBookmarks, nextCursor: null }),
    }) as jest.Mock;
  });

  it("returns empty array while loading", () => {
    const { result } = renderHook(() => useBookmarks(), { wrapper: createWrapper() });
    expect(result.current.bookmarks).toEqual([]);
  });

  it("fetches and returns bookmarks when user and workspace are set", async () => {
    const { result } = renderHook(() => useBookmarks(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.bookmarks).toEqual(mockBookmarks);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/bookmarks"),
    );
  });

  it("does not fetch when user is absent", () => {
    useStoreMock.mockImplementation(
      () => ({ ...baseStore, user: null }) as ReturnType<typeof useStore>,
    );

    renderHook(() => useBookmarks(), { wrapper: createWrapper() });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("does not fetch when workspaceId is absent", () => {
    useStoreMock.mockImplementation(
      () => ({ ...baseStore, selectedWorkspaceId: null }) as ReturnType<typeof useStore>,
    );

    renderHook(() => useBookmarks(), { wrapper: createWrapper() });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("createBookmark mutation calls bookmarkApi.create", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockBookmarks[0]),
    }) as jest.Mock;

    const { result } = renderHook(() => useBookmarks(), { wrapper: createWrapper() });

    const formData = {
      title: "New Bookmark",
      urls: [{ url: "https://new.com", isPrimary: true }],
      tags: [],
      workspaceId: "ws-1",
    };

    result.current.createBookmark.mutate(formData);

    await waitFor(() => {
      expect(result.current.createBookmark.isIdle).toBe(false);
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/bookmarks",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("archiveBookmark mutation calls DELETE", async () => {
    // First call: list query; second call: DELETE
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ items: mockBookmarks, nextCursor: null }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) }) as jest.Mock;

    const { result } = renderHook(() => useBookmarks(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    result.current.archiveBookmark.mutate("bm-1");

    await waitFor(() => {
      expect(result.current.archiveBookmark.isIdle).toBe(false);
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/bookmarks/bm-1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("deleteBookmark mutation calls DELETE with ?permanent=true", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ items: mockBookmarks, nextCursor: null }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) }) as jest.Mock;

    const { result } = renderHook(() => useBookmarks(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    result.current.deleteBookmark.mutate("bm-1");

    await waitFor(() => {
      expect(result.current.deleteBookmark.isIdle).toBe(false);
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/bookmarks/bm-1?permanent=true",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});
