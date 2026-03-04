/** @jest-environment jsdom */

import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useWorkspaces } from "@/features/workspaces/hooks/useWorkspaces";
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

const setSelectedWorkspaceId = jest.fn();

const baseStore = {
  user: { id: "user-1", email: "test@example.com", name: null },
  selectedWorkspaceId: "ws-1",
  selectedFolderId: null,
  selectedTagId: null,
  searchQuery: "",
  showArchived: false,
  setUser: jest.fn(),
  setSelectedWorkspaceId,
  setSelectedFolderId: jest.fn(),
  setSelectedTagId: jest.fn(),
  setSearchQuery: jest.fn(),
  setShowArchived: jest.fn(),
};

const mockWorkspaces = [
  { id: "ws-1", name: "Personal", userId: "user-1", createdAt: "2026-01-01T00:00:00Z" },
  { id: "ws-2", name: "Work", userId: "user-1", createdAt: "2026-01-02T00:00:00Z" },
];

describe("useWorkspaces", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useStoreMock.mockImplementation(() => baseStore as ReturnType<typeof useStore>);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockWorkspaces),
    }) as jest.Mock;
  });

  it("returns empty array initially", () => {
    const { result } = renderHook(() => useWorkspaces(), { wrapper: createWrapper() });
    expect(result.current.workspaces).toEqual([]);
  });

  it("fetches workspaces when user is set", async () => {
    const { result } = renderHook(() => useWorkspaces(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.workspaces).toEqual(mockWorkspaces);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/workspaces?userId=user-1"),
    );
  });

  it("does not fetch when user is absent", () => {
    useStoreMock.mockImplementation(
      () => ({ ...baseStore, user: null }) as ReturnType<typeof useStore>,
    );

    renderHook(() => useWorkspaces(), { wrapper: createWrapper() });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("auto-selects first workspace when none is selected", async () => {
    useStoreMock.mockImplementation(
      () =>
        ({ ...baseStore, selectedWorkspaceId: null, setSelectedWorkspaceId }) as ReturnType<
          typeof useStore
        >,
    );

    renderHook(() => useWorkspaces(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(setSelectedWorkspaceId).toHaveBeenCalledWith("ws-1");
    });
  });

  it("does not auto-select when workspace already selected", async () => {
    renderHook(() => useWorkspaces(), { wrapper: createWrapper() });

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    expect(setSelectedWorkspaceId).not.toHaveBeenCalled();
  });

  it("createWorkspace mutation calls POST /api/workspaces", async () => {
    const newWs = { id: "ws-new", name: "New WS", userId: "user-1", createdAt: "2026-01-03T00:00:00Z" };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(newWs),
    }) as jest.Mock;

    const { result } = renderHook(() => useWorkspaces(), { wrapper: createWrapper() });

    result.current.createWorkspace.mutate("New WS");

    await waitFor(() => expect(result.current.createWorkspace.isIdle).toBe(false));

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/workspaces",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("deleteWorkspace mutation calls DELETE /api/workspaces/:id", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockWorkspaces) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) }) as jest.Mock;

    const { result } = renderHook(() => useWorkspaces(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    result.current.deleteWorkspace.mutate("ws-2");

    await waitFor(() => expect(result.current.deleteWorkspace.isIdle).toBe(false));

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/workspaces/ws-2",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});
