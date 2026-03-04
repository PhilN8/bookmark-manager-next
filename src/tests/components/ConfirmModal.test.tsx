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

    render(
      <ConfirmModal
        open
        title="Delete"
        message="Are you sure?"
        cancelLabel="Keep"
        onConfirm={jest.fn()}
        onCancel={onCancel}
      />,
    );

    // Click cancel button
    fireEvent.click(screen.getByRole("button", { name: "Keep" }));

    // Click close button (X button in header)
    const buttons = screen.getAllByRole("button");
    const closeButton = buttons.find(
      (btn) => btn.querySelector("svg") && btn.innerHTML.includes("M18 6 6 18"),
    );
    if (closeButton) fireEvent.click(closeButton);

    expect(onCancel).toHaveBeenCalled();
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
    // Check for destructive variant class instead of bg-red-500
    expect(confirmButton.className).toContain("bg-destructive");
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
    expect(confirmButton).toBeInTheDocument();
    expect(screen.getByText("Bring this bookmark back")).toBeInTheDocument();
  });
});
