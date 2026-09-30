"use client";

import { Maximize, Minus, Plus } from "lucide-react";
import type { ReactNode } from "react";
import { Tooltip } from "@/components/ui/tooltip";

export function ZoomControls({ zoom, onZoom, onFit, onReset }: { zoom: number; onZoom: (factor: number) => void; onFit: () => void; onReset: () => void }) {
  return (
    <div className="absolute bottom-4 right-4 z-30 flex items-center rounded-md border border-line bg-canvas p-1 shadow-card">
      <ZoomButton label="Zoom out" onClick={() => onZoom(1 / 1.15)}>
        <Minus className="h-3.5 w-3.5" />
      </ZoomButton>
      <button type="button" onClick={onReset} className="w-12 text-center text-[12px] tabular-nums" aria-label="Reset zoom to 100 percent">
        {Math.round(zoom * 100)}%
      </button>
      <ZoomButton label="Zoom in" onClick={() => onZoom(1.15)}>
        <Plus className="h-3.5 w-3.5" />
      </ZoomButton>
      <ZoomButton label="Fit canvas" onClick={onFit}>
        <Maximize className="h-3.5 w-3.5" />
      </ZoomButton>
    </div>
  );
}

function ZoomButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <Tooltip content={label}>
      <button type="button" aria-label={label} onClick={onClick} className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-soft">
        {children}
      </button>
    </Tooltip>
  );
}
