/** @jest-environment jsdom */

import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useFolders } from "@/features/folders/hooks/useFolders";
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

const mockFolders = [
  { id: "folder-1", name: "Work", parentId: null, order: 0, children: [] },
];

describe("useFolders", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useStoreMock.mockImplementation(() => baseStore as ReturnType<typeof useStore>);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockFolders),
    }) as jest.Mock;
  });

  it("returns empty array initially", () => {
    const { result } = renderHook(() => useFolders(), { wrapper: createWrapper() });
    expect(result.current.folders).toEqual([]);
  });

  it("fetches folders when user and workspace are set", async () => {
    const { result } = renderHook(() => useFolders(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.folders).toEqual(mockFolders);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/folders?workspaceId=ws-1"),
    );
  });

  it("does not fetch when user is absent", () => {
    useStoreMock.mockImplementation(
      () => ({ ...baseStore, user: null }) as ReturnType<typeof useStore>,
    );

    renderHook(() => useFolders(), { wrapper: createWrapper() });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("createFolder mutation calls POST /api/folders", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: "folder-new", name: "New", parentId: null, order: 1, children: [] }),
    }) as jest.Mock;

    const { result } = renderHook(() => useFolders(), { wrapper: createWrapper() });

    result.current.createFolder.mutate({ name: "New" });

    await waitFor(() => expect(result.current.createFolder.isSuccess).toBe(true));

    const postCall = (global.fetch as jest.Mock).mock.calls.find(
      ([, init]) => init?.method === "POST",
    );
    expect(postCall).toBeDefined();

    const body = JSON.parse(postCall[1].body);
    expect(body.name).toBe("New");
    expect(body.workspaceId).toBe("ws-1");
  });

  it("deleteFolder mutation calls DELETE /api/folders", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockFolders) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) }) as jest.Mock;

    const { result } = renderHook(() => useFolders(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    result.current.deleteFolder.mutate("folder-1");

    await waitFor(() => expect(result.current.deleteFolder.isIdle).toBe(false));

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/folders?id=folder-1"),
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});
