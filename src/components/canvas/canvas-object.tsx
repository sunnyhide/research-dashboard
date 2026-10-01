"use client";

import type { PointerEvent, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function CanvasObject({
  id,
  x,
  y,
  width,
  selected,
  faded,
  label,
  onPointerDown,
  children,
}: {
  id: string;
  x: number;
  y: number;
  width: number;
  selected: boolean;
  faded?: "dim" | "mute" | null;
  label: string;
  onPointerDown: (event: PointerEvent<HTMLDivElement>, id: string) => void;
  children: ReactNode;
}) {
  return (
    <div
      data-canvas-id={id}
      role="group"
      aria-label={label}
      aria-selected={selected}
      onPointerDown={(event) => onPointerDown(event, id)}
      className={cn(
        "absolute",
        selected && "z-20",
        faded === "dim" && "pointer-events-none opacity-20",
        faded === "mute" && "opacity-60",
      )}
      style={{ left: x, top: y, width }}
    >
      {children}
    </div>
  );
}
