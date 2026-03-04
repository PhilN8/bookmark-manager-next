"use client";

import { AlertTriangle, Archive, ArchiveRestore } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "danger" | "success";
  icon?: "archive" | "restore" | "warning";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  icon = "warning",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const iconComponent = {
    archive: <Archive className="w-5 h-5" />,
    restore: <ArchiveRestore className="w-5 h-5" />,
    warning: <AlertTriangle className="w-5 h-5" />,
  };

  const variantStyles = {
    default: {
      iconBg: "bg-primary/10 text-primary",
      buttonVariant: "default" as const,
    },
    danger: {
      iconBg: "bg-destructive/10 text-destructive",
      buttonVariant: "destructive" as const,
    },
    success: {
      iconBg: "bg-green-500/10 text-green-500",
      buttonVariant: "default" as const,
    },
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div
              className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${variantStyles[variant].iconBg}`}
            >
              {iconComponent[icon]}
            </div>
            <div>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription className="mt-1.5">
                {message}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            {cancelLabel}
          </Button>
          <Button
            variant={variantStyles[variant].buttonVariant}
            onClick={onConfirm}
            className="flex-1"
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
