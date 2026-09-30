import type { Speaker, Transcript } from "../types";

export const AUTHOR = "Isabella Reyes";

type FlowItem = { x: number; y: number; width: number; height: number; clusterId?: string };
type FlowTheme = { id: string; x: number; y: number; width: number; height: number };

/** Pack canvas objects inside theme frames so seeded boards do not overlap. */
export function arrangeBoard(
  themes: FlowTheme[],
  items: FlowItem[],
  columns: string[][],
  widths: Record<string, number>,
  footerId?: string,
) {
  const byId = new Map(themes.map((theme) => [theme.id, theme]));
  const gap = 36;
  let cursorX = 32;

  const place = (theme: FlowTheme, maxWidth: number) => {
    const mine = items.filter((item) => item.clusterId === theme.id);
    let x = theme.x + 16;
    let y = theme.y + 46;
    let rowHeight = 0;
    const limit = theme.x + maxWidth - 16;
    for (const item of mine) {
      if (x + item.width > limit && x > theme.x + 16) {
        x = theme.x + 16;
        y += rowHeight + 14;
        rowHeight = 0;
      }
      item.x = x;
      item.y = y;
      rowHeight = Math.max(rowHeight, item.height + 28);
      x += item.width + 16;
    }
    theme.width = maxWidth;
    theme.height = Math.max(168, y + rowHeight + 18 - theme.y);
  };

  for (const column of columns) {
    let cursorY = 28;
    const columnWidth = Math.max(...column.map((id) => widths[id] ?? 760));
    for (const id of column) {
      const theme = byId.get(id);
      if (!theme) continue;
      theme.x = cursorX;
      theme.y = cursorY;
      place(theme, widths[id] ?? columnWidth);
      cursorY += theme.height + gap;
    }
    cursorX += columnWidth + gap;
  }

  if (!footerId) return;
  const footer = byId.get(footerId);
  if (!footer) return;
  const bottom = Math.max(...themes.filter((theme) => theme.id !== footerId).map((theme) => theme.y + theme.height), 28);
  footer.x = 32;
  footer.y = bottom + gap;
  place(footer, Math.max(720, cursorX - 32 - gap));
}

export function turns(
  projectId: string,
  interviewId: string,
  created: string,
  lines: readonly (readonly [Speaker, string])[],
): Transcript {
  return {
    id: `tr-${interviewId}`,
    projectId,
    interviewId,
    createdAt: created,
    updatedAt: created,
    turns: lines.map(([speaker, text], index) => ({
      id: `${interviewId}-t${index + 1}`,
      speaker,
      text,
    })),
  };
}
