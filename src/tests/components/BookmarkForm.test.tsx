/** @jest-environment jsdom */

"use client";

import { fireEvent, render, screen } from "@testing-library/react";
import { BookmarkForm } from "@/components/BookmarkForm";
import type { Folder, Tag } from "@/lib/store";

describe("BookmarkForm", () => {
  const folders: Folder[] = [
    { id: "folder-1", name: "Work", parentId: null, order: 0, children: [] },
  ];
  const tags: Tag[] = [
    { id: "tag-1", name: "React" },
    { id: "tag-2", name: "Design" },
  ];

  it("adds URLs and keeps a single primary selection", async () => {
    const onSubmit = jest.fn();

    render(
      <BookmarkForm
        folders={folders}
        tags={tags}
        onSubmit={onSubmit}
        onClose={() => undefined}
      />,
    );

    expect(screen.getAllByPlaceholderText("https://example.com")).toHaveLength(
      1,
    );

    fireEvent.click(screen.getByRole("button", { name: "Add URL" }));
    expect(screen.getAllByPlaceholderText("https://example.com")).toHaveLength(
      2,
    );

    const primaryChecks = screen.getAllByTitle(
      "Primary URL",
    ) as HTMLInputElement[];
    expect(primaryChecks[0].checked).toBe(true);

    fireEvent.click(primaryChecks[1]);
    expect(primaryChecks[1].checked).toBe(true);
    expect(primaryChecks[0].checked).toBe(false);
  });

  it("submits trimmed data with tags and URLs", async () => {
    const onSubmit = jest.fn();

    render(
      <BookmarkForm
        folders={folders}
        tags={tags}
        onSubmit={onSubmit}
        onClose={() => undefined}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("Enter bookmark title"), {
      target: { value: "  Example  " },
    });
    fireEvent.change(screen.getByPlaceholderText("Add a description..."), {
      target: { value: "  Notes  " },
    });
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "folder-1" },
    });

    const urlInputs = screen.getAllByPlaceholderText("https://example.com");
    fireEvent.change(urlInputs[0], {
      target: { value: "https://example.com" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Add URL" }));
    const updatedUrlInputs = screen.getAllByPlaceholderText(
      "https://example.com",
    );
    fireEvent.change(updatedUrlInputs[1], {
      target: { value: "https://second.com" },
    });

    const labelInputs = screen.getAllByPlaceholderText("Label");
    fireEvent.change(labelInputs[1], {
      target: { value: "Docs" },
    });
    fireEvent.click(screen.getByRole("button", { name: "React" }));

    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const payload = onSubmit.mock.calls[0][0];

    expect(payload.title).toBe("Example");
    expect(payload.description).toBe("Notes");
    expect(payload.folderId).toBe("folder-1");
    expect(payload.tags).toEqual(["tag-1"]);
    expect(payload.urls).toEqual([
      { url: "https://example.com", isPrimary: true, label: undefined },
      { url: "https://second.com", isPrimary: false, label: "Docs" },
    ]);
  });

  it("keeps one primary URL after removal", async () => {
    const onSubmit = jest.fn();

    render(
      <BookmarkForm
        folders={folders}
        tags={tags}
        onSubmit={onSubmit}
        onClose={() => undefined}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Add URL" }));
    const primaryChecks = screen.getAllByTitle(
      "Primary URL",
    ) as HTMLInputElement[];
    fireEvent.click(primaryChecks[1]);

    const removeButtons = screen.getAllByRole("button", { name: "Remove URL" });
    fireEvent.click(removeButtons[0]);

    const remainingChecks = screen.getAllByTitle(
      "Primary URL",
    ) as HTMLInputElement[];
    expect(remainingChecks).toHaveLength(1);
    expect(remainingChecks[0].checked).toBe(true);
  });
});
