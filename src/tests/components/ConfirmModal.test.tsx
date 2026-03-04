/** @jest-environment jsdom */

"use client";

import { fireEvent, render, screen } from "@testing-library/react";
import { ConfirmModal } from "@/components/ConfirmModal";

describe("ConfirmModal", () => {
  it("does not render when closed", () => {
    render(
      <ConfirmModal
        open={false}
        title="Archive bookmark"
        message="This can be restored later"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />,
    );

    expect(screen.queryByText("Archive bookmark")).toBeNull();
  });

  it("invokes cancel from backdrop, close button, and cancel action", () => {
    const onCancel = jest.fn();

    const { container } = render(
      <ConfirmModal
        open
        title="Delete"
        message="Are you sure?"
        cancelLabel="Keep"
        onConfirm={jest.fn()}
        onCancel={onCancel}
      />,
    );

    const backdrop = container.querySelector(".absolute.inset-0");
    expect(backdrop).not.toBeNull();
    fireEvent.click(backdrop as Element);

    fireEvent.click(screen.getByRole("button", { name: "Keep" }));

    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[0]);

    expect(onCancel).toHaveBeenCalledTimes(3);
  });

  it("invokes confirm and applies danger variant styling", () => {
    const onConfirm = jest.fn();

    render(
      <ConfirmModal
        open
        title="Delete"
        message="This cannot be undone"
        confirmLabel="Delete"
        variant="danger"
        icon="archive"
        onConfirm={onConfirm}
        onCancel={jest.fn()}
      />,
    );

    const confirmButton = screen.getByRole("button", { name: "Delete" });
    fireEvent.click(confirmButton);

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(confirmButton.className).toContain("bg-red-500");
  });

  it("renders success variant and restore icon path", () => {
    render(
      <ConfirmModal
        open
        title="Restore"
        message="Bring this bookmark back"
        confirmLabel="Restore"
        variant="success"
        icon="restore"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />,
    );

    const confirmButton = screen.getByRole("button", { name: "Restore" });
    expect(confirmButton.className).toContain("bg-green-500");
    expect(screen.getByText("Bring this bookmark back")).toBeInTheDocument();
  });
});
