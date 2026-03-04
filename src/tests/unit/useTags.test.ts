/** @jest-environment jsdom */

import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useTags } from "@/features/tags/hooks/useTags";
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

const mockTags = [
  { id: "tag-1", name: "React", _count: { bookmarkTags: 3 } },
  { id: "tag-2", name: "Design", _count: { bookmarkTags: 1 } },
];

describe("useTags", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useStoreMock.mockImplementation(() => baseStore as ReturnType<typeof useStore>);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockTags),
    }) as jest.Mock;
  });

  it("returns empty array initially", () => {
    const { result } = renderHook(() => useTags(), { wrapper: createWrapper() });
    expect(result.current.tags).toEqual([]);
  });

  it("fetches tags when user and workspace are set", async () => {
    const { result } = renderHook(() => useTags(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.tags).toEqual(mockTags);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/tags?workspaceId=ws-1"),
    );
  });

  it("does not fetch when user is absent", () => {
    useStoreMock.mockImplementation(
      () => ({ ...baseStore, user: null }) as ReturnType<typeof useStore>,
    );

    renderHook(() => useTags(), { wrapper: createWrapper() });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("does not fetch when workspaceId is absent", () => {
    useStoreMock.mockImplementation(
      () => ({ ...baseStore, selectedWorkspaceId: null }) as ReturnType<typeof useStore>,
    );

    renderHook(() => useTags(), { wrapper: createWrapper() });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("createTag mutation calls POST /api/tags with workspaceId", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: "tag-new", name: "CSS", _count: { bookmarkTags: 0 } }),
    }) as jest.Mock;

    const { result } = renderHook(() => useTags(), { wrapper: createWrapper() });

    result.current.createTag.mutate("CSS");

    await waitFor(() => expect(result.current.createTag.isSuccess).toBe(true));

    const postCall = (global.fetch as jest.Mock).mock.calls.find(
      ([, init]) => init?.method === "POST",
    );
    expect(postCall).toBeDefined();

    const body = JSON.parse(postCall[1].body);
    expect(body.name).toBe("CSS");
    expect(body.workspaceId).toBe("ws-1");
  });

  it("deleteTag mutation calls DELETE /api/tags", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockTags) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true }) }) as jest.Mock;

    const { result } = renderHook(() => useTags(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    result.current.deleteTag.mutate("tag-1");

    await waitFor(() => expect(result.current.deleteTag.isIdle).toBe(false));

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/tags?id=tag-1"),
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});
