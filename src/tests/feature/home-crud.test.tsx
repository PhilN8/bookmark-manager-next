/** @jest-environment jsdom */

"use client";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Home from "@/app/page";
import { useStore } from "@/lib/store";

type StoreState = ReturnType<typeof useStore>;

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

jest.mock("@/lib/store", () => ({
  useStore: jest.fn(),
}));

const useStoreMock = useStore as jest.MockedFunction<typeof useStore>;

describe("Home CRUD interactions", () => {
  const setBookmarks = jest.fn();
  const setFolders = jest.fn();
  const setTags = jest.fn();
  const setSelectedFolderId = jest.fn();
  const setSelectedTagId = jest.fn();
  const setSearchQuery = jest.fn();
  const setShowArchived = jest.fn();
  const setIsLoading = jest.fn();

  const baseStore: StoreState = {
    bookmarks: [],
    setBookmarks,
    folders: [],
    setFolders,
    tags: [{ id: "tag-1", name: "React" }],
    setTags,
    selectedFolderId: null,
    setSelectedFolderId,
    selectedTagId: null,
    setSelectedTagId,
    searchQuery: "",
    setSearchQuery,
    showArchived: false,
    setShowArchived,
    isLoading: false,
    setIsLoading,
  };

  beforeEach(() => {
    useStoreMock.mockReturnValue({ ...baseStore });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    }) as jest.Mock;
    window.confirm = jest.fn(() => true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("creates a tag with trimmed name", async () => {
    render(<Home />);

    fireEvent.click(screen.getByLabelText("Add tag"));
    const input = screen.getByPlaceholderText("Tag name");
    fireEvent.change(input, { target: { value: "  New Tag  " } });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() => {
      const calls = (global.fetch as jest.Mock).mock.calls;
      const postCall = calls.find((call) => call[1]?.method === "POST");
      expect(postCall).toBeTruthy();
      const body = JSON.parse(postCall?.[1]?.body as string);
      expect(body.name).toBe("New Tag");
    });
  });

  it("deletes a tag after confirmation", async () => {
    render(<Home />);

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
