"use client";

import { Frame, Lightbulb, MousePointer2, Quote, StickyNote, UserRound } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useProject, useWorkspaceStore } from "@/store/workspace";

export function CanvasToolbar({ projectId }: { projectId: string }) {
  const bundle = useProject(projectId);
  const addSticky = useWorkspaceStore((state) => state.addSticky);
  const addInsight = useWorkspaceStore((state) => state.addInsight);
  const addQuote = useWorkspaceStore((state) => state.addQuote);
  const addCluster = useWorkspaceStore((state) => state.addCluster);
  const addParticipantCard = useWorkspaceStore((state) => state.addParticipantCard);
  const clearSelection = useWorkspaceStore((state) => state.clearSelection);
  const [panel, setPanel] = useState<"participant" | "quote" | null>(null);
  const [quoteText, setQuoteText] = useState("");
  const [participantId, setParticipantId] = useState(bundle?.participants[0]?.id ?? "");

  if (!bundle) return null;

  return (
    <div className="absolute bottom-4 left-4 z-30">
      <div className="flex items-center gap-0.5 rounded-md border border-line bg-canvas p-1 shadow-card">
        <ToolButton label="Select" onClick={() => { clearSelection(); setPanel(null); }}>
          <MousePointer2 className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Add sticky note (N)" emphasized onClick={() => { setPanel(null); addSticky(projectId); }}>
          <StickyNote className="h-4 w-4" />
          <span className="pr-1 text-[12px]">Note</span>
        </ToolButton>
        <ToolButton label="Add insight (I)" onClick={() => { setPanel(null); addInsight(projectId); }}>
          <Lightbulb className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Add cluster (C)" onClick={() => { setPanel(null); addCluster(projectId); }}>
          <Frame className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Add quote (Q)" onClick={() => setPanel(panel === "quote" ? null : "quote")}>
          <Quote className="h-4 w-4" />
        </ToolButton>
        <ToolButton label="Add participant" onClick={() => setPanel(panel === "participant" ? null : "participant")}>
          <UserRound className="h-4 w-4" />
        </ToolButton>
      </div>
      {panel === "participant" ? (
        <div className="absolute bottom-12 left-0 max-h-64 w-64 overflow-y-auto rounded-md border border-line bg-canvas p-1 shadow-card">
          {bundle.participants.length === 0 ? <p className="px-2 py-3 text-[13px] text-muted-ink">No participants yet.</p> : null}
          {bundle.participants.map((participant) => (
            <button
              key={participant.id}
              type="button"
              className="flex w-full rounded-md px-2 py-1.5 text-left text-[13px] hover:bg-soft"
              onClick={() => {
                addParticipantCard(projectId, participant.id);
                setPanel(null);
              }}
            >
              {participant.code} · {participant.name}
            </button>
          ))}
        </div>
      ) : null}
      {panel === "quote" ? (
        <form
          className="absolute bottom-12 left-0 w-72 space-y-2 rounded-md border border-line bg-canvas p-3 shadow-card"
          onSubmit={(event) => {
            event.preventDefault();
            addQuote(projectId, { text: quoteText, participantId });
            setQuoteText("");
            setPanel(null);
          }}
        >
          <textarea
            required
            value={quoteText}
            onChange={(event) => setQuoteText(event.target.value)}
            placeholder="Paste a participant quote"
            aria-label="Quote text"
            rows={3}
            className="w-full rounded-md border border-line px-2 py-1.5 text-[13px]"
          />
          <select aria-label="Participant" value={participantId} onChange={(event) => setParticipantId(event.target.value)} className="h-8 w-full rounded-md border border-line px-2 text-[13px]">
            {bundle.participants.map((participant) => (
              <option key={participant.id} value={participant.id}>{participant.code} · {participant.name}</option>
            ))}
          </select>
          <button type="submit" className="h-8 rounded-md bg-accent px-2.5 text-[13px] text-white">Add quote</button>
        </form>
      ) : null}
    </div>
  );
}

function ToolButton({ label, children, onClick, emphasized = false }: { label: string; children: ReactNode; onClick: () => void; emphasized?: boolean }) {
  return (
    <Tooltip content={label}>
      <button
        type="button"
        aria-label={label}
        onClick={onClick}
        className={cn("inline-flex h-8 items-center justify-center gap-1 rounded-md px-2 text-ink hover:bg-soft", emphasized && "bg-accent-soft text-accent-ink")}
      >
        {children}
      </button>
    </Tooltip>
  );
}
