"use client";

import type { Box } from "@/lib/canvas";
import type { CanvasView } from "@/lib/types";

export function Minimap({
  boxes,
  view,
  viewport,
  onCenter,
}: {
  boxes: Box[];
  view: CanvasView;
  viewport: { width: number; height: number };
  onCenter: (x: number, y: number) => void;
}) {
  if (!boxes.length || viewport.width < 20) return null;
  const minX = Math.min(...boxes.map((box) => box.x)) - 40;
  const minY = Math.min(...boxes.map((box) => box.y)) - 40;
  const maxX = Math.max(...boxes.map((box) => box.x + box.width)) + 40;
  const maxY = Math.max(...boxes.map((box) => box.y + box.height)) + 40;
  const worldW = Math.max(maxX - minX, 1);
  const worldH = Math.max(maxY - minY, 1);
  const width = 168;
  const height = 104;
  const scale = Math.min(width / worldW, height / worldH);
  const viewX = (-view.x / view.zoom - minX) * scale;
  const viewY = (-view.y / view.zoom - minY) * scale;
  const viewW = (viewport.width / view.zoom) * scale;
  const viewH = (viewport.height / view.zoom) * scale;

  return (
    <button
      type="button"
      aria-label="Canvas minimap"
      className="absolute bottom-14 right-4 z-30 overflow-hidden rounded-md border border-line bg-canvas shadow-card"
      style={{ width, height }}
      onClick={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = minX + (event.clientX - rect.left) / scale;
        const y = minY + (event.clientY - rect.top) / scale;
        onCenter(x, y);
      }}
    >
      {boxes.map((box) => (
        <span
          key={box.id}
          className="absolute rounded-[1px] bg-ink/25"
          style={{ left: (box.x - minX) * scale, top: (box.y - minY) * scale, width: Math.max(box.width * scale, 2), height: Math.max(box.height * scale, 2) }}
        />
      ))}
      <span className="absolute border border-accent" style={{ left: viewX, top: viewY, width: viewW, height: viewH }} />
    </button>
  );
}
