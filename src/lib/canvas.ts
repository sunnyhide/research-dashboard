import type { CanvasItemKind, ProjectBundle, Theme } from "./types";

export interface Box {
  id: string;
  kind: CanvasItemKind;
  x: number;
  y: number;
  width: number;
  height: number;
  clusterId?: string;
}

export function canvasBoxes(bundle: ProjectBundle): Box[] {
  return [
    ...bundle.themes.map((item) => ({
      id: item.id,
      kind: "cluster" as const,
      x: item.x,
      y: item.y,
      width: item.width,
      height: item.height,
    })),
    ...bundle.stickies.map((item) => ({
      id: item.id,
      kind: "sticky" as const,
      x: item.x,
      y: item.y,
      width: item.width,
      height: item.height,
      clusterId: item.clusterId,
    })),
    ...bundle.quotes.map((item) => ({
      id: item.id,
      kind: "quote" as const,
      x: item.x,
      y: item.y,
      width: item.width,
      height: item.height,
      clusterId: item.clusterId,
    })),
    ...bundle.insights.filter((item) => item.onCanvas).map((item) => ({
      id: item.id,
      kind: "insight" as const,
      x: item.x,
      y: item.y,
      width: item.width,
      height: item.height,
      clusterId: item.clusterId,
    })),
    ...bundle.findings.filter((item) => item.onCanvas && item.status === "pending").map((item) => ({
      id: item.id,
      kind: "finding" as const,
      x: item.x,
      y: item.y,
      width: item.width,
      height: item.height,
      clusterId: item.clusterId,
    })),
    ...bundle.cards.map((item) => ({
      id: item.id,
      kind: "participant" as const,
      x: item.x,
      y: item.y,
      width: item.width,
      height: item.height,
      clusterId: item.clusterId,
    })),
  ];
}

export function boxById(bundle: ProjectBundle, id: string) {
  return canvasBoxes(bundle).find((box) => box.id === id);
}

export function expandSelection(bundle: ProjectBundle, ids: string[]) {
  const selected = new Set(ids);
  const boxes = canvasBoxes(bundle);
  for (const id of ids) {
    if (!bundle.themes.some((theme) => theme.id === id)) continue;
    for (const box of boxes) {
      if (box.clusterId === id) selected.add(box.id);
    }
  }
  return [...selected];
}

export function intersects(a: Pick<Box, "x" | "y" | "width" | "height">, b: Pick<Box, "x" | "y" | "width" | "height">) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

export function themeAtPoint(themes: Theme[], x: number, y: number, width: number, height: number) {
  const cx = x + width / 2;
  const cy = y + height / 2;
  const hits = themes.filter(
    (theme) => !theme.collapsed && cx >= theme.x && cx <= theme.x + theme.width && cy >= theme.y && cy <= theme.y + theme.height,
  );
  return hits.at(-1)?.id;
}

export function contentBounds(bundle: ProjectBundle) {
  const boxes = canvasBoxes(bundle);
  if (!boxes.length) return null;
  const minX = Math.min(...boxes.map((box) => box.x));
  const minY = Math.min(...boxes.map((box) => box.y));
  const maxX = Math.max(...boxes.map((box) => box.x + box.width));
  const maxY = Math.max(...boxes.map((box) => box.y + box.height));
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}
