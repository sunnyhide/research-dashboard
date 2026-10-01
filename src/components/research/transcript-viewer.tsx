"use client";

import { useRef, useState } from "react";
import { analysisClient } from "@/lib/ai/client";
import { Button } from "@/components/ui/button";
import { useWorkspaceStore } from "@/store/workspace";

export function TranscriptViewer({ projectId, interviewId }: { projectId: string; interviewId: string }) {
  const bundle = useWorkspaceStore((state) => state.projects[projectId]);
  const addQuote = useWorkspaceStore((state) => state.addQuote);
  const addSticky = useWorkspaceStore((state) => state.addSticky);
  const addInsight = useWorkspaceStore((state) => state.addInsight);
  const interview = bundle?.interviews.find((item) => item.id === interviewId);
  const containerRef = useRef<HTMLDivElement>(null);
  const [menu, setMenu] = useState<{ x: number; y: number; text: string } | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (!bundle || !interview) return <p className="p-6 text-[13px]">Interview not found.</p>;
  const participant = bundle.participants.find((person) => person.id === interview.participantId);

  function captureSelection() {
    const selection = window.getSelection();
    const text = selection?.toString().trim() ?? "";
    if (!selection || selection.isCollapsed || !text || !containerRef.current) {
      setMenu(null);
      return;
    }
    const range = selection.getRangeAt(0);
    if (!containerRef.current.contains(range.commonAncestorContainer)) {
      setMenu(null);
      return;
    }
    const rect = range.getBoundingClientRect();
    setMenu({ x: rect.left, y: rect.bottom + 8, text });
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-start justify-between gap-3 border-b border-line px-6 py-4">
        <div>
          <h1 className="text-lg font-medium">{interview.title}</h1>
          <p className="text-[13px] text-muted-ink">{participant?.name} · {interview.date} · {interview.duration}</p>
        </div>
        <Button
          onClick={async () => {
            setBusy(true);
            const next = await analysisClient.summarizeInterview(interview);
            setSummary(next);
            setBusy(false);
          }}
        >
          {busy ? "Summarizing…" : "Summarize"}
        </Button>
      </header>
      {summary ? (
        <div className="border-b border-line bg-soft px-6 py-3 text-[13px] leading-relaxed">
          <p className="text-[11px] uppercase tracking-[0.12em] text-muted-ink">Draft summary · Review required</p>
          <p className="mt-1">{summary}</p>
        </div>
      ) : null}
      <div ref={containerRef} className="min-h-0 flex-1 overflow-y-auto px-6 py-6" onMouseUp={captureSelection}>
        <ol className="mx-auto max-w-2xl space-y-5">
          {interview.transcript.turns.map((turn) => (
            <li key={turn.id}>
              <p className="text-[11px] uppercase tracking-[0.12em] text-muted-ink">{turn.speaker === "researcher" ? "Researcher" : participant?.name ?? "Participant"}</p>
              <p className={`mt-1 text-[15px] leading-relaxed ${turn.speaker === "participant" ? "text-ink" : "text-muted-ink"}`}>{turn.text}</p>
            </li>
          ))}
        </ol>
      </div>
      {menu ? (
        <div className="fixed z-50 flex gap-1 rounded-md border border-line bg-canvas p-1 shadow-card" style={{ left: menu.x, top: menu.y }}>
          <Button size="sm" onClick={() => { addQuote(projectId, { text: menu.text, participantId: interview.participantId, sourceId: interview.sourceId, interviewId: interview.id }); setMenu(null); window.getSelection()?.removeAllRanges(); }}>Add quote</Button>
          <Button size="sm" onClick={() => { addSticky(projectId, { text: menu.text }); setMenu(null); window.getSelection()?.removeAllRanges(); }}>Add sticky note</Button>
          <Button size="sm" onClick={async () => {
            const draft = await analysisClient.generateInsights(menu.text, bundle.themes.map((theme) => ({ name: theme.name })));
            const theme = bundle.themes.find((item) => item.name === draft.suggestedTheme);
            addInsight(projectId, { title: draft.title, description: draft.description, confidence: draft.confidence, aiGenerated: true, status: "needs-review", tags: draft.tags, themeIds: theme ? [theme.id] : [], participantIds: [interview.participantId], sourceIds: [interview.sourceId] });
            setMenu(null);
            window.getSelection()?.removeAllRanges();
          }}>Generate insight</Button>
        </div>
      ) : null}
    </div>
  );
}
