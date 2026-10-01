"use client";

import { useEffect, useRef } from "react";
import type { StickyNote as StickyNoteModel } from "@/lib/types";
import { STICKY_COLORS } from "@/lib/theme";
import { cn, formatDate } from "@/lib/utils";
import { useWorkspaceStore } from "@/store/workspace";

export function StickyNote({ note, selected, projectId }: { note: StickyNoteModel; selected: boolean; projectId: string }) {
  const editingId = useWorkspaceStore((state) => state.editingId);
  const updateSticky = useWorkspaceStore((state) => state.updateSticky);
  const beginHistory = useWorkspaceStore((state) => state.beginHistory);
  const setEditingId = useWorkspaceStore((state) => state.setEditingId);
  const editing = editingId === note.id;
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const armed = useRef(false);

  useEffect(() => {
    if (!editing) return;
    const area = areaRef.current;
    if (!area) return;
    area.focus();
    area.setSelectionRange(area.value.length, area.value.length);
    area.style.height = "0px";
    area.style.height = `${area.scrollHeight}px`;
  }, [editing, note.text]);

  return (
    <article className={cn("rounded-md border px-3 py-2.5 shadow-card", `sticky-${note.color}`, selected && "outline outline-2 outline-offset-2 outline-accent")}>
      <div className="flex items-center justify-between gap-2 text-[10px] opacity-70">
        <span>{note.author}</span>
        <time dateTime={note.updatedAt}>{formatDate(note.updatedAt)}</time>
      </div>
      {editing ? (
        <textarea
          ref={areaRef}
          value={note.text}
          aria-label="Sticky note text"
          placeholder="Write a note…"
          onChange={(event) => updateSticky(projectId, note.id, { text: event.target.value })}
          onFocus={() => {
            if (!armed.current) {
              beginHistory();
              armed.current = true;
            }
          }}
          onBlur={() => {
            armed.current = false;
            setEditingId(null);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.currentTarget.blur();
            }
          }}
          className="mt-1.5 w-full resize-none bg-transparent text-[13px] leading-snug outline-none placeholder:text-current placeholder:opacity-40"
        />
      ) : (
        <p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-snug">{note.text || "Empty note"}</p>
      )}
      {note.tags.length ? (
        <p className="mt-2 text-[11px] opacity-80">{note.tags.map((tag) => `#${tag}`).join("  ")}</p>
      ) : null}
      {selected ? (
        <div className="mt-2 flex gap-1" data-no-drag>
          {STICKY_COLORS.map((color) => (
            <button
              key={color.id}
              type="button"
              aria-label={`${color.label} note`}
              aria-pressed={note.color === color.id}
              onClick={() => updateSticky(projectId, note.id, { color: color.id }, true)}
              className={cn("h-3.5 w-3.5 rounded-full border border-black/10", `sticky-${color.id}`, note.color === color.id && "outline outline-1 outline-offset-1 outline-current")}
            />
          ))}
        </div>
      ) : null}
    </article>
  );
}
