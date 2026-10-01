"use client";

import type { PointerEvent } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { Theme } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/store/workspace";

export function ThemeCluster({
  theme,
  selected,
  projectId,
  onResizeStart,
}: {
  theme: Theme;
  selected: boolean;
  projectId: string;
  onResizeStart: (event: PointerEvent<HTMLButtonElement>, id: string) => void;
}) {
  const updateCluster = useWorkspaceStore((state) => state.updateCluster);
  return (
    <section
      className={cn("relative h-full rounded-md border", `cluster-${theme.color}`, selected && "outline outline-2 outline-offset-2 outline-accent")}
      style={{ width: theme.width, height: theme.height }}
    >
      <header className="flex h-10 items-center gap-2 px-3">
        <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-ink">Theme</span>
        <h2 className="min-w-0 flex-1 truncate text-[13px] font-medium">{theme.name}</h2>
        <button
          type="button"
          data-no-drag
          aria-label={theme.collapsed ? `Expand ${theme.name}` : `Collapse ${theme.name}`}
          aria-expanded={!theme.collapsed}
          className="rounded p-1 text-muted-ink hover:bg-black/5"
          onClick={() => updateCluster(projectId, theme.id, { collapsed: !theme.collapsed }, true)}
        >
          {theme.collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </header>
      <button
        type="button"
        data-no-drag
        aria-label={`Resize ${theme.name}`}
        className="absolute bottom-1.5 right-1.5 h-3 w-3 cursor-nwse-resize rounded-sm border border-line bg-canvas"
        onPointerDown={(event) => onResizeStart(event, theme.id)}
      />
    </section>
  );
}
