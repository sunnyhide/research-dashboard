"use client";

import Link from "next/link";
import { useState } from "react";
import { QuoteCard } from "@/components/canvas/quote-card";
import { ConfidenceMeter, StatusBadge } from "@/components/insights/insight-card";
import { Button } from "@/components/ui/button";
import { CONFIDENCE_LABEL, STATUS_LABEL } from "@/lib/theme";
import type { Confidence, InsightStatus } from "@/lib/types";
import { useWorkspaceStore } from "@/store/workspace";

export function InsightDetail({ projectId, insightId }: { projectId: string; insightId: string }) {
  const bundle = useWorkspaceStore((state) => state.projects[projectId]);
  const update = useWorkspaceStore((state) => state.updateInsight);
  const linkQuote = useWorkspaceStore((state) => state.linkQuote);
  const unlinkQuote = useWorkspaceStore((state) => state.unlinkQuote);
  const addNote = useWorkspaceStore((state) => state.addResearcherNote);
  const [note, setNote] = useState("");
  const [quoteId, setQuoteId] = useState("");
  const insight = bundle?.insights.find((item) => item.id === insightId);
  if (!bundle || !insight) return <p className="p-8 text-[13px]">Insight not found.</p>;
  const quotes = bundle.quotes.filter((quote) => insight.quoteIds.includes(quote.id));
  const participants = bundle.participants.filter((person) => insight.participantIds.includes(person.id));
  const sources = bundle.sources.filter((source) => insight.sourceIds.includes(source.id));

  return (
    <div className="h-full overflow-y-auto">
      <article className="mx-auto max-w-3xl px-6 py-8">
        <Link href={`/projects/${projectId}/insights`} className="text-[13px] text-muted-ink hover:text-ink">Insights</Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <StatusBadge status={insight.status} />
          <ConfidenceMeter level={insight.confidence} />
        </div>
        <input value={insight.title} onChange={(event) => update(projectId, insight.id, { title: event.target.value })} aria-label="Insight title" className="mt-3 w-full bg-transparent text-xl font-medium tracking-tight outline-none" />
        <div className="mt-4 flex flex-wrap gap-2">
          <select aria-label="Status" value={insight.status} onChange={(event) => update(projectId, insight.id, { status: event.target.value as InsightStatus }, true)} className="h-8 rounded-md border border-line bg-canvas px-2 text-[13px]">
            {Object.entries(STATUS_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <select aria-label="Confidence" value={insight.confidence} onChange={(event) => update(projectId, insight.id, { confidence: event.target.value as Confidence }, true)} className="h-8 rounded-md border border-line bg-canvas px-2 text-[13px]">
            {Object.entries(CONFIDENCE_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
        <label className="mt-5 block text-[12px] text-muted-ink">
          Description
          <textarea value={insight.description} onChange={(event) => update(projectId, insight.id, { description: event.target.value })} rows={4} className="mt-1 w-full rounded-md border border-line bg-canvas px-3 py-2 text-[14px] text-ink" />
        </label>
        <section className="mt-8">
          <h2 className="text-sm font-medium">Evidence</h2>
          <ul className="mt-3 space-y-3">
            {quotes.map((quote) => (
              <li key={quote.id}>
                <QuoteCard quote={quote} projectId={projectId} compact participant={bundle.participants.find((person) => person.id === quote.participantId)} sourceTitle={bundle.sources.find((source) => source.id === quote.sourceId)?.title} />
                <button type="button" className="mt-1 text-[12px] text-muted-ink hover:text-ink" onClick={() => unlinkQuote(projectId, insight.id, quote.id)}>Remove evidence</button>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex gap-2">
            <select aria-label="Add evidence" value={quoteId} onChange={(event) => setQuoteId(event.target.value)} className="h-8 min-w-0 flex-1 rounded-md border border-line bg-canvas px-2 text-[13px]">
              <option value="">Add a quote</option>
              {bundle.quotes.filter((quote) => !insight.quoteIds.includes(quote.id)).map((quote) => <option key={quote.id} value={quote.id}>{quote.text.slice(0, 80)}</option>)}
            </select>
            <Button onClick={() => { if (quoteId) { linkQuote(projectId, insight.id, quoteId); setQuoteId(""); } }}>Add</Button>
          </div>
        </section>
        <section className="mt-8">
          <h2 className="text-sm font-medium">Participants</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {participants.map((person) => <span key={person.id} className="rounded-md border border-line px-2 py-1 text-[12px]">{person.code} · {person.name}</span>)}
            {participants.length === 0 ? <p className="text-[13px] text-muted-ink">No participants linked.</p> : null}
          </div>
        </section>
        <section className="mt-8">
          <h2 className="text-sm font-medium">Themes</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {bundle.themes.map((theme) => {
              const active = insight.themeIds.includes(theme.id);
              return (
                <button key={theme.id} type="button" aria-pressed={active} onClick={() => update(projectId, insight.id, { themeIds: active ? insight.themeIds.filter((id) => id !== theme.id) : [...insight.themeIds, theme.id] }, true)} className={`rounded-md border px-2 py-1 text-[12px] ${active ? "border-accent bg-accent-soft text-accent-ink" : "border-line"}`}>{theme.name}</button>
              );
            })}
          </div>
        </section>
        <section className="mt-8">
          <h2 className="text-sm font-medium">Related research</h2>
          <ul className="mt-2 space-y-1 text-[13px]">
            {sources.map((source) => <li key={source.id}>{source.title}</li>)}
            {sources.length === 0 ? <li className="text-muted-ink">No sources linked.</li> : null}
          </ul>
        </section>
        <section className="mt-8">
          <h2 className="text-sm font-medium">Researcher notes</h2>
          <ul className="mt-2 space-y-2">
            {insight.researcherNotes.map((item, index) => <li key={index} className="rounded-md border border-line bg-canvas px-3 py-2 text-[13px]">{item}</li>)}
          </ul>
          <form className="mt-2 flex gap-2" onSubmit={(event) => { event.preventDefault(); addNote(projectId, insight.id, note); setNote(""); }}>
            <input value={note} onChange={(event) => setNote(event.target.value)} aria-label="Researcher note" placeholder="Add a note" className="h-8 min-w-0 flex-1 rounded-md border border-line bg-canvas px-2 text-[13px]" />
            <Button type="submit">Add</Button>
          </form>
        </section>
        {insight.aiGenerated ? (
          <section className="mt-8 rounded-md border border-line bg-soft px-3 py-3">
            <h2 className="text-[12px] uppercase tracking-[0.14em] text-muted-ink">AI analysis</h2>
            <p className="mt-1 text-[13px]">This insight was initially suggested by AI and {insight.status === "validated" ? "validated by the researcher." : "still requires researcher validation."}</p>
          </section>
        ) : null}
      </article>
    </div>
  );
}
