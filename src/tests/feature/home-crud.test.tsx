/** @jest-environment jsdom */

"use client";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import Home from "@/app/page";
import { useStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import type { Bookmark, Folder, Tag, Workspace } from "@/lib/types";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// Define proper store state type
interface AppState {
  bookmarks: Bookmark[];
  folders: Folder[];
  tags: Tag[];
  workspaces: Workspace[];
  selectedWorkspaceId: string | null;
  selectedFolderId: string | null;
  selectedTagId: string | null;
  searchQuery: string;
  showArchived: boolean;
  isLoading: boolean;
  setBookmarks: (bookmarks: Bookmark[]) => void;
  setFolders: (folders: Folder[]) => void;
  setTags: (tags: Tag[]) => void;
  setWorkspaces: (workspaces: Workspace[]) => void;
  setSelectedWorkspaceId: (id: string | null) => void;
  setSelectedFolderId: (id: string | null) => void;
  setSelectedTagId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setShowArchived: (show: boolean) => void;
  setIsLoading: (loading: boolean) => void;
}

jest.mock("@/components/ThemeToggle", () => ({
  ThemeToggle: () => <div data-testid="theme-toggle" />,
}));

jest.mock("@/components/FolderSidebar", () => ({
  FolderTree: () => <div data-testid="folder-tree" />,
}));

jest.mock("@/components/BookmarkCard", () => ({
  BookmarkCard: () => <div data-testid="bookmark-card" />,
}));

jest.mock("@/components/BookmarkForm", () => ({
  BookmarkForm: () => <div data-testid="bookmark-form" />,
}));

jest.mock("@/components/LoadingScreen", () => ({
  LoadingScreen: () => <div data-testid="loading-screen" />,
}));

jest.mock("@/components/WorkspaceSwitcher", () => ({
  WorkspaceSwitcher: () => <div data-testid="workspace-switcher" />,
}));

jest.mock("@/lib/store", () => ({
  useStore: jest.fn(),
}));

const useStoreMock = useStore as jest.MockedFunction<typeof useStore>;
const useRouterMock = useRouter as jest.MockedFunction<typeof useRouter>;

describe("Home CRUD interactions", () => {
  let dynamicStore: AppState;

  beforeEach(async () => {
    // Create a dynamic store that actually updates state when setters are called
    dynamicStore = {
      bookmarks: [],
      folders: [],
      tags: [{ id: "tag-1", name: "React" }],
      workspaces: [],
      selectedWorkspaceId: null,
      selectedFolderId: null,
      selectedTagId: null,
      searchQuery: "",
      showArchived: false,
      isLoading: false,
      setBookmarks: (bookmarks: Bookmark[]) => {
        dynamicStore.bookmarks = bookmarks;
      },
      setFolders: (folders: Folder[]) => {
        dynamicStore.folders = folders;
      },
      setTags: (tags: Tag[]) => {
        dynamicStore.tags = tags;
      },
      setWorkspaces: (workspaces: Workspace[]) => {
        dynamicStore.workspaces = workspaces;
      },
      setSelectedWorkspaceId: (id: string | null) => {
        dynamicStore.selectedWorkspaceId = id;
      },
      setSelectedFolderId: (id: string | null) => {
        dynamicStore.selectedFolderId = id;
      },
      setSelectedTagId: (id: string | null) => {
        dynamicStore.selectedTagId = id;
      },
      setSearchQuery: (query: string) => {
        dynamicStore.searchQuery = query;
      },
      setShowArchived: (show: boolean) => {
        dynamicStore.showArchived = show;
      },
      setIsLoading: (loading: boolean) => {
        dynamicStore.isLoading = loading;
      },
    };

    // Mock useStore to return the dynamic store
    useStoreMock.mockImplementation(() => dynamicStore);

    useRouterMock.mockReturnValue({
      push: jest.fn(),
      refresh: jest.fn(),
    } as unknown as AppRouterInstance);

    // Create a more intelligent fetch mock that handles different endpoints
    global.fetch = jest.fn((url: string | Request): Promise<Response> => {
      const urlStr = typeof url === "string" ? url : url.toString();

      // Auth check endpoint
      if (urlStr.includes("/api/auth/me")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            data: { id: "user-1", email: "test@example.com" },
          }),
        } as Response);
      }

      // Tags endpoint
      if (urlStr.includes("/api/tags")) {
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: "tag-1", name: "React" }],
        } as Response);
      }

      // Default response for other endpoints
      return Promise.resolve({
        ok: true,
        json: async () => [],
      } as Response);
    }) as jest.MockedFunction<typeof global.fetch>;

    window.confirm = jest.fn(() => true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("creates a tag with trimmed name", async () => {
    render(<Home />);

    // Wait for LoadingScreen to disappear (indicates initialLoad is complete and auth check passed)
    await waitFor(
      () => {
        const loadingScreen = screen.queryByTestId("loading-screen");
        expect(loadingScreen).not.toBeInTheDocument();
      },
      { timeout: 10000 },
    );

    fireEvent.click(screen.getByLabelText("Add tag"));
    const input = screen.getByPlaceholderText("Tag name");
    fireEvent.change(input, { target: { value: "  New Tag  " } });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() => {
      const calls = (global.fetch as jest.Mock).mock.calls;
      const postCall = calls.find((call) => call[1]?.method === "POST");
      expect(postCall).toBeTruthy();
      const body = JSON.parse(postCall?.[1]?.body as string);
      expect(body).toHaveProperty("name", "New Tag");
    });
  });

  it("deletes a tag after confirmation", async () => {
    render(<Home />);

    // Wait for LoadingScreen to disappear
    await waitFor(
      () => {
        const loadingScreen = screen.queryByTestId("loading-screen");
        expect(loadingScreen).not.toBeInTheDocument();
      },
      { timeout: 10000 },
    );

    fireEvent.click(screen.getByLabelText("Delete tag React"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/tags?id=tag-1"),
        expect.objectContaining({ method: "DELETE" }),
      );
    });
    expect(window.confirm).toHaveBeenCalledWith("Delete this tag?");
  });
});
