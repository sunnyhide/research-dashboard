"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

export function FolderDialog({
  open,
  title,
  description,
  initialName = "",
  confirmLabel,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  title: string;
  description?: string;
  initialName?: string;
  confirmLabel: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string) => void;
}) {
  const [name, setName] = useState(initialName);

  useEffect(() => {
    if (open) setName(initialName);
  }, [open, initialName]);

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={title} description={description} className="w-[min(420px,calc(100%-2rem))]">
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          const clean = name.trim();
          if (!clean) return;
          onSubmit(clean);
        }}
      >
        <label className="block text-[13px]">
          <span className="mb-1 block text-muted-ink">Folder name</span>
          <input
            required
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="h-8 w-full rounded-md border border-line bg-canvas px-2"
          />
        </label>
        <div className="flex justify-end gap-2">
          <Button type="button" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            {confirmLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
