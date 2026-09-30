"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Participant, Quote } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/store/workspace";

export function QuoteCard({
  quote,
  participant,
  sourceTitle,
  projectId,
  selected,
  compact = false,
}: {
  quote: Quote;
  participant?: Participant;
  sourceTitle?: string;
  projectId: string;
  selected?: boolean;
  compact?: boolean;
}) {
  const editingId = useWorkspaceStore((state) => state.editingId);
  const updateQuote = useWorkspaceStore((state) => state.updateQuote);
  const beginHistory = useWorkspaceStore((state) => state.beginHistory);
  const setEditingId = useWorkspaceStore((state) => state.setEditingId);
  const editing = !compact && editingId === quote.id;
  const router = useRouter();
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const armed = useRef(false);

  useEffect(() => {
    if (!editing || !areaRef.current) return;
    areaRef.current.focus();
  }, [editing]);

  return (
    <blockquote className={cn("rounded-md border border-line bg-canvas shadow-card", selected && "outline outline-2 outline-offset-2 outline-accent")}>
      <div className="border-l-2 border-ink/80 px-3 py-2.5">
        <div className="text-[10px] uppercase tracking-[0.14em] text-muted-ink">Quote · {participant?.code ?? "Participant"}</div>
        {editing ? (
          <textarea
            ref={areaRef}
            value={quote.text}
            aria-label="Quote text"
            onChange={(event) => updateQuote(projectId, quote.id, { text: event.target.value })}
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
            className="mt-1 w-full resize-none bg-transparent font-serif text-[15px] italic leading-snug outline-none"
          />
        ) : (
          <p className="mt-1 font-serif text-[15px] italic leading-snug">“{quote.text || "Empty quote"}”</p>
        )}
        <footer className="mt-2 text-[11px] text-muted-ink">
          {participant?.name ?? "Unknown participant"}
          {sourceTitle ? ` · ${sourceTitle}` : ""}
        </footer>
        {quote.tags.length ? <p className="mt-1 text-[11px] text-muted-ink">{quote.tags.map((tag) => `#${tag}`).join("  ")}</p> : null}
        {!compact && quote.interviewId ? (
          <button
            type="button"
            data-no-drag
            className="mt-2 text-[12px] text-accent-ink underline-offset-2 hover:underline"
            onClick={() => router.push(`/projects/${projectId}/interviews/${quote.interviewId}`)}
          >
            Open transcript
          </button>
        ) : null}
      </div>
    </blockquote>
  );
}
