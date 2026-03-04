/** @jest-environment jsdom */

"use client";

import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Home from "@/app/page";
import { useStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

function renderWithQueryClient(ui: React.ReactElement) {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// Mirror the lean store interface (UI state only — no server data)
interface AppState {
  user: { id: string; email: string; name: string | null } | null;
  selectedWorkspaceId: string | null;
  selectedFolderId: string | null;
  selectedTagId: string | null;
  searchQuery: string;
  showArchived: boolean;
  setUser: (user: { id: string; email: string; name: string | null } | null) => void;
  setSelectedWorkspaceId: (id: string | null) => void;
  setSelectedFolderId: (id: string | null) => void;
  setSelectedTagId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setShowArchived: (show: boolean) => void;
}

jest.mock("@/components/ThemeToggle", () => ({
  ThemeToggle: () => <div data-testid="theme-toggle" />,
}));

jest.mock("@/features/folders", () => ({
  FolderTree: () => <div data-testid="folder-tree" />,
  FolderList: () => <div data-testid="folder-list" />,
}));

jest.mock("@/features/bookmarks", () => ({
  BookmarkCard: () => <div data-testid="bookmark-card" />,
  BookmarkForm: () => <div data-testid="bookmark-form" />,
  BookmarkList: () => <div data-testid="bookmark-list" />,
}));

jest.mock("@/components/LoadingScreen", () => ({
  LoadingScreen: () => <div data-testid="loading-screen" />,
}));

jest.mock("@/features/workspaces", () => ({
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
    // Create a dynamic store that actually updates state when setters are called.
    // setUser also re-points the mock so React picks up the updated state on next render.
    dynamicStore = {
      user: { id: "user-1", email: "test@example.com", name: null },
      selectedWorkspaceId: "ws-1",
      selectedFolderId: null,
      selectedTagId: null,
      searchQuery: "",
      showArchived: false,
      setUser: (user) => {
        dynamicStore.user = user;
        // Refresh mock so next useStore() call returns updated state
        useStoreMock.mockImplementation(() => dynamicStore);
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
    renderWithQueryClient(<Home />);

    // Wait for LoadingScreen to disappear (indicates initialLoad is complete and auth check passed)
    await waitFor(
      () => {
        const loadingScreen = screen.queryByTestId("loading-screen");
        expect(loadingScreen).not.toBeInTheDocument();
      },
      { timeout: 10000 },
    );

    // Find the Plus button in the Tags section by looking for the Tags heading then the button after it
    const tagsHeading = screen.getByText("Tags");
    const tagsSection = tagsHeading.closest("div")?.parentElement;
    const addTagButton = tagsSection?.querySelector("button");
    if (addTagButton) fireEvent.click(addTagButton);
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
    renderWithQueryClient(<Home />);

    // Wait for LoadingScreen to disappear
    await waitFor(
      () => {
        const loadingScreen = screen.queryByTestId("loading-screen");
        expect(loadingScreen).not.toBeInTheDocument();
      },
      { timeout: 10000 },
    );

    // Find the React tag badge, then click the delete button next to it
    const reactTag = await screen.findByText("React", {}, { timeout: 5000 });
    const tagGroup = reactTag.closest(".group");
    const deleteButton = tagGroup?.querySelector("button");
    if (deleteButton) fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/tags?id=tag-1"),
        expect.objectContaining({ method: "DELETE" }),
      );
    });
    expect(window.confirm).toHaveBeenCalledWith("Delete this tag?");
  });
});
