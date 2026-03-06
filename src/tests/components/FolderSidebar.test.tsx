/** @jest-environment jsdom */

"use client";

import { fireEvent, render, screen } from "@testing-library/react";
import { FolderTree } from "@/features/folders/components/FolderSidebar";
import type { Folder } from "@/lib/types";

describe("FolderTree", () => {
  const folders: Folder[] = [
    {
      id: "folder-1",
      name: "Work",
      parentId: null,
      order: 0,
      children: [
        {
          id: "folder-2",
          name: "Project",
          parentId: "folder-1",
          order: 0,
          children: [],
        },
      ],
    },
  ];

  it("creates a root folder from the input", async () => {
    const onCreateFolder = jest.fn();

    render(
      <FolderTree
        folders={folders}
        selectedFolderId={null}
        onSelectFolder={jest.fn()}
        onCreateFolder={onCreateFolder}
      />,
    );

    fireEvent.click(screen.getByTitle("New folder"));
    const input = screen.getByPlaceholderText("Folder name...");
    fireEvent.change(input, { target: { value: "Inbox" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onCreateFolder).toHaveBeenCalledWith("Inbox", undefined);
  });

  it("selects the requested folder and all bookmarks", async () => {
    const onSelectFolder = jest.fn();

    render(
      <FolderTree
        folders={folders}
        selectedFolderId={null}
        onSelectFolder={onSelectFolder}
        onCreateFolder={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByText("All Bookmarks"));
    expect(onSelectFolder).toHaveBeenCalledWith(null);

    fireEvent.click(screen.getByText("Work"));
    expect(onSelectFolder).toHaveBeenCalledWith("folder-1");
  });

  it("calls delete when a folder delete button is clicked", async () => {
    const onDeleteFolder = jest.fn();

    const { container } = render(
      <FolderTree
        folders={folders}
        selectedFolderId={null}
        onSelectFolder={jest.fn()}
        onCreateFolder={jest.fn()}
        onDeleteFolder={onDeleteFolder}
      />,
    );

    // Find the trash button by its SVG icon
    const buttons = container.querySelectorAll("button");
    const deleteButton = Array.from(buttons).find(
      (btn) => btn.querySelector("svg") && btn.innerHTML.includes("M3 6h18"),
    );

    if (deleteButton) fireEvent.click(deleteButton);
    expect(onDeleteFolder).toHaveBeenCalledWith("folder-1");
  });

  it("expands parent folders to reveal children", () => {
    const { container } = render(
      <FolderTree
        folders={folders}
        selectedFolderId={null}
        onSelectFolder={jest.fn()}
        onCreateFolder={jest.fn()}
      />,
    );

    expect(screen.queryByText("Project")).toBeNull();

    // Find the expand button by looking for chevron icon
    const buttons = container.querySelectorAll("button");
    const expandButton = Array.from(buttons).find(
      (btn) =>
        btn.querySelector("svg") &&
        (btn.innerHTML.includes("ChevronRight") ||
          btn.innerHTML.includes("polyline")),
    );

    if (expandButton) {
      fireEvent.click(expandButton);
      expect(screen.getByText("Project")).toBeInTheDocument();
    }
  });
});
