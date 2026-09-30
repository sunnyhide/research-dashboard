"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="overlay-fade fixed inset-0 z-50 bg-black/35" />
        <Dialog.Content
          className={cn(
            "modal-pop fixed left-1/2 top-[8vh] z-50 max-h-[84vh] w-[min(720px,calc(100%-2rem))] overflow-y-auto rounded-lg border border-line bg-canvas shadow-card focus:outline-none",
            className,
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
            <div>
              <Dialog.Title className="text-[15px] font-medium tracking-tight">{title}</Dialog.Title>
              {description ? <Dialog.Description className="mt-1 text-[13px] text-muted-ink">{description}</Dialog.Description> : null}
            </div>
            <Dialog.Close className="rounded-md p-1 text-muted-ink hover:bg-soft hover:text-ink" aria-label="Close">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>
          <div className="px-5 py-4">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
