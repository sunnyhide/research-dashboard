"use client";

import { Search } from "lucide-react";
import { useEffect, useRef } from "react";
import { Modal } from "@/components/ui/modal";

export interface PaletteItem {
  id: string;
  label: string;
  detail?: string;
  meta?: string;
  onSelect: () => void;
}

export function SearchDialog({
  open,
  query,
  onQueryChange,
  onOpenChange,
  items,
  activeIndex,
  onActiveIndex,
  placeholder = "Search research or run a command",
}: {
  open: boolean;
  query: string;
  onQueryChange: (query: string) => void;
  onOpenChange: (open: boolean) => void;
  items: PaletteItem[];
  activeIndex: number;
  onActiveIndex: (index: number) => void;
  placeholder?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      const timer = window.setTimeout(() => inputRef.current?.focus(), 20);
      return () => window.clearTimeout(timer);
    }
  }, [open]);

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Search" description="Projects, evidence, insights, themes, and commands." className="top-[12vh]">
      <div className="flex items-center gap-2 rounded-md border border-line px-2">
        <Search className="h-4 w-4 text-muted-ink" />
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={placeholder}
          aria-label="Search"
          className="h-9 w-full bg-transparent text-[13px] outline-none"
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              onActiveIndex(Math.min(items.length - 1, activeIndex + 1));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              onActiveIndex(Math.max(0, activeIndex - 1));
            } else if (event.key === "Enter" && items[activeIndex]) {
              event.preventDefault();
              items[activeIndex].onSelect();
            }
          }}
        />
      </div>
      <ul className="mt-3 max-h-80 overflow-y-auto" role="listbox" aria-label="Search results">
        {items.length === 0 ? <li className="px-2 py-6 text-center text-[13px] text-muted-ink">No matching research.</li> : null}
        {items.map((item, index) => (
          <li key={item.id}>
            <button
              type="button"
              role="option"
              aria-selected={index === activeIndex}
              onMouseEnter={() => onActiveIndex(index)}
              onClick={item.onSelect}
              className={`flex w-full items-start gap-3 rounded-md px-2 py-2 text-left ${index === activeIndex ? "bg-soft" : ""}`}
            >
              {item.meta ? <span className="mt-0.5 w-20 shrink-0 text-[10px] uppercase tracking-[0.12em] text-muted-ink">{item.meta}</span> : null}
              <span className="min-w-0">
                <span className="block truncate text-[13px]">{item.label}</span>
                {item.detail ? <span className="block truncate text-[12px] text-muted-ink">{item.detail}</span> : null}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
