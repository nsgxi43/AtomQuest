"use client";

import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isLoading = false,
}: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50 z-40" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] bg-white rounded-lg shadow-lg">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <Dialog.Title className="text-lg font-semibold text-gray-900">
                {title}
              </Dialog.Title>
              {description && (
                <Dialog.Description className="text-sm text-gray-600 mt-1">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close asChild>
              <button className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          <div className="p-6">{children}</div>

          <div className="flex justify-end gap-2 p-6 border-t border-gray-200 bg-gray-50">
            <Button variant="ghost" onClick={onCancel}>
              {cancelText}
            </Button>
            <Button variant="primary" onClick={onConfirm} loading={isLoading}>
              {confirmText}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
