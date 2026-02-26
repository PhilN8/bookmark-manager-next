/** @jest-environment jsdom */

"use client";

import { fireEvent, render, screen } from "@testing-library/react";
import { BookmarkCard } from "@/components/BookmarkCard";
import type { Bookmark } from "@/lib/store";

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
    const onEdit = jest.fn();
    const onDelete = jest.fn();

    render(
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

    fireEvent.click(screen.getByTitle("Edit"));
    expect(onEdit).toHaveBeenCalledWith(bookmark);

    fireEvent.click(screen.getByTitle("Archive"));
    expect(onDelete).toHaveBeenCalledWith("bookmark-1");
  });

  it("opens primary URL and supports folder/tag quick actions", async () => {
    const onMoveFolder = jest.fn();
    const onToggleTag = jest.fn();

    render(
      <BookmarkCard
        bookmark={bookmark}
        folders={folders}
        tags={tags}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onMoveFolder={onMoveFolder}
        onToggleTag={onToggleTag}
      />,
    );

    expect(screen.getByTitle("Open URL")).toHaveAttribute(
      "href",
      "https://primary.com",
    );

    fireEvent.click(screen.getByRole("button", { name: "Add to folder..." }));
    fireEvent.click(screen.getByRole("button", { name: "Work" }));
    expect(onMoveFolder).toHaveBeenCalledWith("bookmark-1", "folder-1");

    fireEvent.click(screen.getByRole("button", { name: "Add to folder..." }));
    fireEvent.click(screen.getByRole("button", { name: "No folder" }));
    expect(onMoveFolder).toHaveBeenCalledWith("bookmark-1", "");

    fireEvent.click(screen.getByRole("button", { name: "Design" }));
    expect(onToggleTag).toHaveBeenCalledWith("bookmark-1", "tag-2");
  });
});
