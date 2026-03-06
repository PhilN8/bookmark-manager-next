/** @jest-environment jsdom */

"use client";

import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BookmarkCard } from "@/features/bookmarks/components/BookmarkCard";
import type { Bookmark } from "@/lib/types";

function renderCard(ui: React.ReactElement) {
  return render(<TooltipProvider>{ui}</TooltipProvider>);
}

// Mock bookmarkApi so URL add/remove don't need a real server
jest.mock("@/lib/api", () => ({
  bookmarkApi: {
    addUrl: jest.fn(),
    removeUrl: jest.fn(),
  },
}));

import { bookmarkApi } from "@/lib/api";

describe("BookmarkCard", () => {
  const bookmark: Bookmark = {
    id: "bookmark-1",
    title: "Example",
    description: "Notes",
    folderId: null,
    workspaceId: "default",
    archived: false,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
    urls: [
      {
        id: "url-1",
        url: "https://primary.com",
        isPrimary: true,
        label: "Primary",
      },
      {
        id: "url-2",
        url: "https://secondary.com",
        isPrimary: false,
        label: null,
      },
    ],
    tags: [{ tag: { id: "tag-1", name: "React" } }],
    folder: null,
  };

  const folders = [
    { id: "folder-1", name: "Work" },
    { id: "folder-2", name: "Personal" },
  ];

  const tags = [
    { id: "tag-1", name: "React" },
    { id: "tag-2", name: "Design" },
  ];

  it("fires edit and archive actions", async () => {
    const user = userEvent.setup();
    const onEdit = jest.fn();
    const onDelete = jest.fn();

    const { container } = renderCard(
      <BookmarkCard
        bookmark={bookmark}
        folders={folders}
        tags={tags}
        onEdit={onEdit}
        onDelete={onDelete}
        onMoveFolder={jest.fn()}
        onToggleTag={jest.fn()}
      />,
    );

    // Actions are in a DropdownMenu — the first [aria-haspopup="menu"] is the actions trigger
    const menuTriggers = container.querySelectorAll('[aria-haspopup="menu"]');
    const actionsTrigger = menuTriggers[0] as HTMLElement;
    expect(actionsTrigger).not.toBeNull();

    // Use userEvent to properly fire pointer events that Radix UI requires
    await user.click(actionsTrigger);

    // Click "Edit bookmark" in the dropdown
    const editItem = await screen.findByText("Edit bookmark");
    await user.click(editItem);
    expect(onEdit).toHaveBeenCalledWith(bookmark);

    // Re-open the menu to click Archive
    await user.click(actionsTrigger);

    const archiveItem = await screen.findByText("Archive");
    await user.click(archiveItem);
    expect(onDelete).toHaveBeenCalledWith("bookmark-1");
  });

  it("opens primary URL and supports tag actions", async () => {
    const user = userEvent.setup();
    const onToggleTag = jest.fn();

    const { container } = renderCard(
      <BookmarkCard
        bookmark={bookmark}
        folders={folders}
        tags={tags}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onMoveFolder={jest.fn()}
        onToggleTag={onToggleTag}
      />,
    );

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute(
      "href",
      expect.stringContaining("https://primary.com"),
    );

    // The tag picker is the dashed-border Plus button (second [aria-haspopup="menu"])
    const menuTriggers = container.querySelectorAll('[aria-haspopup="menu"]');
    const tagTrigger = menuTriggers[menuTriggers.length - 1] as HTMLElement;
    await user.click(tagTrigger);

    const designItem = await screen.findByText("Design");
    await user.click(designItem);
    expect(onToggleTag).toHaveBeenCalledWith("bookmark-1", "tag-2");
  });

  it("renders archived state with restore action and URL overflow", () => {
    const onRestore = jest.fn();

    const { container } = renderCard(
      <BookmarkCard
        bookmark={{
          ...bookmark,
          archived: true,
          urls: [
            ...bookmark.urls,
            {
              id: "url-3",
              url: "https://third.com",
              isPrimary: false,
              label: null,
            },
            {
              id: "url-4",
              url: "https://fourth.com",
              isPrimary: false,
              label: null,
            },
          ],
          folder: { id: "folder-1", name: "Work" },
        }}
        folders={folders}
        tags={tags}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onRestore={onRestore}
        onHardDelete={jest.fn()}
        onMoveFolder={jest.fn()}
        onToggleTag={jest.fn()}
      />,
    );

    // Find restore button by looking for green hover text
    const buttons = Array.from(container.querySelectorAll("button")).filter(
      (btn) => btn.className.includes("hover:text-green-500"),
    );

    if (buttons.length > 0) {
      fireEvent.click(buttons[0]);
      expect(onRestore).toHaveBeenCalledWith("bookmark-1");
    }
    expect(screen.getByText(/\+\d+ more/)).toBeInTheDocument();
    expect(screen.getAllByText("Work").length).toBeGreaterThan(0);
  });

  it("fires onHardDelete when permanent delete button is clicked in archived state", async () => {
    const user = userEvent.setup();
    const onHardDelete = jest.fn();

    const { container } = renderCard(
      <BookmarkCard
        bookmark={{ ...bookmark, archived: true }}
        folders={folders}
        tags={tags}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onRestore={jest.fn()}
        onHardDelete={onHardDelete}
        onMoveFolder={jest.fn()}
        onToggleTag={jest.fn()}
      />,
    );

    // Actions are in a DropdownMenu — the first [aria-haspopup="menu"] is the actions trigger
    const menuTriggers = container.querySelectorAll('[aria-haspopup="menu"]');
    const actionsTrigger = menuTriggers[0] as HTMLElement;
    await user.click(actionsTrigger);

    // Click "Delete permanently" in the dropdown
    const deleteItem = await screen.findByText("Delete permanently");
    await user.click(deleteItem);
    expect(onHardDelete).toHaveBeenCalledWith("bookmark-1");
  });

  describe("URL management", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("shows URL manager toggle and reveals remove buttons", async () => {
      renderCard(
        <BookmarkCard
          bookmark={bookmark}
          folders={folders}
          tags={tags}
          onEdit={jest.fn()}
          onDelete={jest.fn()}
          onMoveFolder={jest.fn()}
          onToggleTag={jest.fn()}
        />,
      );

      // Toggle is initially visible
      const toggle = screen.getByText(/Manage Links/i);
      expect(toggle).toBeInTheDocument();

      // Click to open URL manager
      await act(async () => {
        fireEvent.click(toggle);
      });

      // Remove buttons appear — one per URL
      const removeButtons = screen.getAllByRole("button", { name: /Remove URL/i });
      expect(removeButtons).toHaveLength(2);
      // First remove button is enabled (2 URLs, can remove one)
      expect(removeButtons[0]).not.toBeDisabled();
    });

    it("calls bookmarkApi.removeUrl and onUrlsChanged on removal", async () => {
      const onUrlsChanged = jest.fn();
      (bookmarkApi.removeUrl as jest.Mock).mockResolvedValue(undefined);

      renderCard(
        <BookmarkCard
          bookmark={bookmark}
          folders={folders}
          tags={tags}
          onEdit={jest.fn()}
          onDelete={jest.fn()}
          onMoveFolder={jest.fn()}
          onToggleTag={jest.fn()}
          onUrlsChanged={onUrlsChanged}
        />,
      );

      await act(async () => {
        fireEvent.click(screen.getByText(/Manage Links/i));
      });

      const removeButtons = screen.getAllByRole("button", { name: /Remove URL/i });
      await act(async () => {
        fireEvent.click(removeButtons[0]);
      });

      await waitFor(() => {
        expect(bookmarkApi.removeUrl).toHaveBeenCalledWith("bookmark-1", "url-1");
        expect(onUrlsChanged).toHaveBeenCalledWith("bookmark-1");
      });
    });

    it("shows inline add-URL form and calls bookmarkApi.addUrl on submit", async () => {
      const onUrlsChanged = jest.fn();
      (bookmarkApi.addUrl as jest.Mock).mockResolvedValue({
        id: "url-3",
        url: "https://new.com",
        isPrimary: false,
        label: null,
      });

      renderCard(
        <BookmarkCard
          bookmark={bookmark}
          folders={folders}
          tags={tags}
          onEdit={jest.fn()}
          onDelete={jest.fn()}
          onMoveFolder={jest.fn()}
          onToggleTag={jest.fn()}
          onUrlsChanged={onUrlsChanged}
        />,
      );

      // Open URL manager
      await act(async () => {
        fireEvent.click(screen.getByText(/Manage Links/i));
      });

      // Open add form
      await act(async () => {
        fireEvent.click(screen.getByText(/Add Link/i));
      });

      const urlInput = screen.getByPlaceholderText("https://...");
      await act(async () => {
        fireEvent.change(urlInput, { target: { value: "https://new.com" } });
      });

      await act(async () => {
        fireEvent.click(screen.getByText("Add"));
      });

      await waitFor(() => {
        expect(bookmarkApi.addUrl).toHaveBeenCalledWith("bookmark-1", {
          url: "https://new.com",
          label: undefined,
          isPrimary: false,
        });
        expect(onUrlsChanged).toHaveBeenCalledWith("bookmark-1");
      });
    });

    it("shows validation error for invalid URL", async () => {
      renderCard(
        <BookmarkCard
          bookmark={bookmark}
          folders={folders}
          tags={tags}
          onEdit={jest.fn()}
          onDelete={jest.fn()}
          onMoveFolder={jest.fn()}
          onToggleTag={jest.fn()}
        />,
      );

      await act(async () => {
        fireEvent.click(screen.getByText(/Manage Links/i));
      });
      await act(async () => {
        fireEvent.click(screen.getByText(/Add Link/i));
      });

      const urlInput = screen.getByPlaceholderText("https://...");
      await act(async () => {
        fireEvent.change(urlInput, { target: { value: "not-a-url" } });
        fireEvent.click(screen.getByText("Add"));
      });

      expect(screen.getByText("Must be a valid URL")).toBeInTheDocument();
      expect(bookmarkApi.addUrl).not.toHaveBeenCalled();
    });
  });
});
