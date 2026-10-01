"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfidenceMeter, StatusBadge } from "@/components/insights/insight-card";
import { CLUSTER_COLORS, CONFIDENCE_LABEL, STATUS_LABEL } from "@/lib/theme";
import type { Confidence, InsightStatus } from "@/lib/types";
import { plural } from "@/lib/utils";
import { useProject, useWorkspaceStore } from "@/store/workspace";

export function ResearchInspector({ projectId }: { projectId: string }) {
  const bundle = useProject(projectId);
  const selection = useWorkspaceStore((state) => state.selection);
  const open = useWorkspaceStore((state) => state.inspectorOpen);
  const setOpen = useWorkspaceStore((state) => state.setInspectorOpen);
  const setAnalysisOpen = useWorkspaceStore((state) => state.setAnalysisOpen);
  if (!bundle || !open) return null;

  const selected: Array<
    | { kind: "sticky"; item: (typeof bundle.stickies)[number] }
    | { kind: "quote"; item: (typeof bundle.quotes)[number] }
    | { kind: "insight"; item: (typeof bundle.insights)[number] }
    | { kind: "finding"; item: (typeof bundle.findings)[number] }
    | { kind: "cluster"; item: (typeof bundle.themes)[number] }
    | { kind: "card"; item: (typeof bundle.cards)[number] }
  > = [];
  for (const id of selection) {
    const sticky = bundle.stickies.find((item) => item.id === id);
    if (sticky) selected.push({ kind: "sticky", item: sticky });
    const quote = bundle.quotes.find((item) => item.id === id);
    if (quote) selected.push({ kind: "quote", item: quote });
    const insight = bundle.insights.find((item) => item.id === id);
    if (insight) selected.push({ kind: "insight", item: insight });
    const finding = bundle.findings.find((item) => item.id === id);
    if (finding) selected.push({ kind: "finding", item: finding });
    const theme = bundle.themes.find((item) => item.id === id);
    if (theme) selected.push({ kind: "cluster", item: theme });
    const card = bundle.cards.find((item) => item.id === id);
    if (card) selected.push({ kind: "card", item: card });
  }

  return (
    <aside className="flex h-full w-[320px] shrink-0 flex-col border-l border-line bg-canvas max-lg:absolute max-lg:inset-y-0 max-lg:right-0 max-lg:z-40 max-lg:shadow-card">
      <div className="flex h-10 items-center justify-between border-b border-line px-3">
        <h2 className="text-[12px] font-medium uppercase tracking-[0.14em] text-muted-ink">Inspector</h2>
        <button type="button" className="text-[12px] text-muted-ink hover:text-ink" onClick={() => setOpen(false)}>Close</button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {selected.length === 0 ? (
          <div className="space-y-3">
            <p className="text-[13px] leading-relaxed">{bundle.project.researchQuestion || "No research question yet."}</p>
            <p className="text-[12px] text-muted-ink">
              {plural(bundle.participants.length, "participant")} · {plural(bundle.insights.filter((item) => item.status !== "rejected").length, "insight")} · {plural(bundle.quotes.length, "quote")}
            </p>
            <Button variant="primary" onClick={() => setAnalysisOpen(true, "setup")}>Analyze research</Button>
          </div>
        ) : null}
        {selected.length > 1 ? <Multi projectId={projectId} count={selected.length} /> : null}
        {selected.length === 1 && selected[0].kind === "sticky" ? <StickyFields projectId={projectId} id={selected[0].item.id} /> : null}
        {selected.length === 1 && selected[0].kind === "quote" ? <QuoteFields projectId={projectId} id={selected[0].item.id} /> : null}
        {selected.length === 1 && selected[0].kind === "insight" ? <InsightFields projectId={projectId} id={selected[0].item.id} /> : null}
        {selected.length === 1 && selected[0].kind === "finding" ? <FindingFields projectId={projectId} id={selected[0].item.id} /> : null}
        {selected.length === 1 && selected[0].kind === "cluster" ? <ClusterFields projectId={projectId} id={selected[0].item.id} /> : null}
        {selected.length === 1 && selected[0].kind === "card" ? <CardFields projectId={projectId} id={selected[0].item.id} /> : null}
      </div>
    </aside>
  );
}

function Multi({ projectId, count }: { projectId: string; count: number }) {
  const duplicate = useWorkspaceStore((state) => state.duplicateSelected);
  const remove = useWorkspaceStore((state) => state.deleteSelected);
  return (
    <div className="space-y-3">
      <p className="text-[13px]">{count} selected</p>
      <div className="flex gap-2">
        <Button onClick={() => duplicate(projectId)}>Duplicate</Button>
        <Button variant="danger" onClick={() => remove(projectId)}>Delete</Button>
      </div>
    </div>
  );
}

function StickyFields({ projectId, id }: { projectId: string; id: string }) {
  const bundle = useProject(projectId);
  const note = bundle?.stickies.find((item) => item.id === id);
  const update = useWorkspaceStore((state) => state.updateSticky);
  const duplicate = useWorkspaceStore((state) => state.duplicateIds);
  const remove = useWorkspaceStore((state) => state.deleteIds);
  if (!bundle || !note) return null;
  return (
    <div className="space-y-3">
      <Field label="Note">
        <textarea value={note.text} onChange={(event) => update(projectId, id, { text: event.target.value })} rows={5} className="w-full rounded-md border border-line px-2 py-1.5 text-[13px]" />
      </Field>
      <TagEditor tags={note.tags} onChange={(tags) => update(projectId, id, { tags }, true)} />
      <Field label="Connected insight">
        <select value={note.insightId ?? ""} onChange={(event) => update(projectId, id, { insightId: event.target.value || undefined }, true)} className="h-8 w-full rounded-md border border-line px-2 text-[13px]">
          <option value="">None</option>
          {bundle.insights.map((insight) => <option key={insight.id} value={insight.id}>{insight.title}</option>)}
        </select>
      </Field>
      <Field label="Linked quote">
        <select value={note.quoteId ?? ""} onChange={(event) => update(projectId, id, { quoteId: event.target.value || undefined }, true)} className="h-8 w-full rounded-md border border-line px-2 text-[13px]">
          <option value="">None</option>
          {bundle.quotes.map((quote) => <option key={quote.id} value={quote.id}>{quote.text.slice(0, 64)}</option>)}
        </select>
      </Field>
      <p className="text-[12px] text-muted-ink">{note.author}</p>
      <RowActions onDuplicate={() => duplicate(projectId, [id])} onDelete={() => remove(projectId, [id])} />
    </div>
  );
}

function QuoteFields({ projectId, id }: { projectId: string; id: string }) {
  const bundle = useProject(projectId);
  const quote = bundle?.quotes.find((item) => item.id === id);
  const update = useWorkspaceStore((state) => state.updateQuote);
  const router = useRouter();
  if (!bundle || !quote) return null;
  const participant = bundle.participants.find((item) => item.id === quote.participantId);
  return (
    <div className="space-y-3">
      <Field label="Quote">
        <textarea value={quote.text} onChange={(event) => update(projectId, id, { text: event.target.value })} rows={5} className="w-full rounded-md border border-line px-2 py-1.5 font-serif text-[14px] italic" />
      </Field>
      <p className="text-[12px] text-muted-ink">{participant ? `${participant.code} · ${participant.name}` : "No participant"}</p>
      <TagEditor tags={quote.tags} onChange={(tags) => update(projectId, id, { tags }, true)} />
      {quote.interviewId ? <Button onClick={() => router.push(`/projects/${projectId}/interviews/${quote.interviewId}`)}>Open transcript</Button> : null}
    </div>
  );
}

function InsightFields({ projectId, id }: { projectId: string; id: string }) {
  const bundle = useProject(projectId);
  const insight = bundle?.insights.find((item) => item.id === id);
  const update = useWorkspaceStore((state) => state.updateInsight);
  const toast = useWorkspaceStore((state) => state.toast);
  const router = useRouter();
  const pending = useWorkspaceStore((state) => state.pendingFocusId);
  const setPending = useWorkspaceStore((state) => state.setPendingFocusId);
  const titleRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (pending === id) {
      titleRef.current?.focus();
      setPending(null);
    }
  }, [id, pending, setPending]);
  if (!bundle || !insight) return null;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between"><StatusBadge status={insight.status} />{insight.aiGenerated ? <span className="text-[11px] text-accent-ink">AI-generated · Review required</span> : null}</div>
      <Field label="Title">
        <input ref={titleRef} value={insight.title} onChange={(event) => update(projectId, id, { title: event.target.value })} className="h-8 w-full rounded-md border border-line px-2 text-[13px]" />
      </Field>
      <Field label="Description">
        <textarea value={insight.description} onChange={(event) => update(projectId, id, { description: event.target.value })} rows={4} className="w-full rounded-md border border-line px-2 py-1.5 text-[13px]" />
      </Field>
      <Field label="Status">
        <select value={insight.status} onChange={(event) => { update(projectId, id, { status: event.target.value as InsightStatus }, true); toast("Changes saved"); }} className="h-8 w-full rounded-md border border-line px-2 text-[13px]">
          {Object.entries(STATUS_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </Field>
      <Field label="Confidence">
        <select value={insight.confidence} onChange={(event) => update(projectId, id, { confidence: event.target.value as Confidence }, true)} className="h-8 w-full rounded-md border border-line px-2 text-[13px]">
          {Object.entries(CONFIDENCE_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </Field>
      <p className="text-[12px] text-muted-ink">{plural(insight.evidenceQuotes, "supporting quote")} · {plural(insight.evidenceParticipants, "participant")}</p>
      <Button onClick={() => router.push(`/projects/${projectId}/insights/${id}`)}>Open insight</Button>
      {insight.status !== "validated" ? <Button variant="primary" onClick={() => { update(projectId, id, { status: "validated" }, true); toast("Insight validated"); }}>Mark validated</Button> : null}
    </div>
  );
}

function FindingFields({ projectId, id }: { projectId: string; id: string }) {
  const bundle = useProject(projectId);
  const finding = bundle?.findings.find((item) => item.id === id);
  const update = useWorkspaceStore((state) => state.updateFinding);
  const accept = useWorkspaceStore((state) => state.acceptFinding);
  const reject = useWorkspaceStore((state) => state.rejectFinding);
  const pending = useWorkspaceStore((state) => state.pendingFocusId);
  const setPending = useWorkspaceStore((state) => state.setPendingFocusId);
  const titleRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (pending === id) {
      titleRef.current?.focus();
      setPending(null);
    }
  }, [id, pending, setPending]);
  if (!finding) return null;
  return (
    <div className="space-y-3">
      <p className="text-[11px] uppercase tracking-[0.14em] text-accent-ink">AI-generated · Review required</p>
      <Field label="Title">
        <input ref={titleRef} value={finding.title} onChange={(event) => update(projectId, id, { title: event.target.value })} className="h-8 w-full rounded-md border border-line px-2 text-[13px]" />
      </Field>
      <Field label="Description">
        <textarea value={finding.description} onChange={(event) => update(projectId, id, { description: event.target.value })} rows={5} className="w-full rounded-md border border-line px-2 py-1.5 text-[13px]" />
      </Field>
      <Field label="Suggested theme">
        <input value={finding.suggestedTheme} onChange={(event) => update(projectId, id, { suggestedTheme: event.target.value }, true)} className="h-8 w-full rounded-md border border-line px-2 text-[13px]" />
      </Field>
      <ConfidenceMeter level={finding.confidence} />
      {finding.status === "pending" ? (
        <div className="flex gap-2">
          <Button variant="primary" onClick={() => accept(projectId, id)}>Accept</Button>
          <Button variant="danger" onClick={() => reject(projectId, id)}>Reject</Button>
        </div>
      ) : <p className="text-[12px] text-muted-ink">{finding.status === "accepted" ? "Accepted" : "Rejected"}</p>}
    </div>
  );
}

function ClusterFields({ projectId, id }: { projectId: string; id: string }) {
  const bundle = useProject(projectId);
  const theme = bundle?.themes.find((item) => item.id === id);
  const update = useWorkspaceStore((state) => state.updateCluster);
  const remove = useWorkspaceStore((state) => state.deleteIds);
  const pending = useWorkspaceStore((state) => state.pendingFocusId);
  const setPending = useWorkspaceStore((state) => state.setPendingFocusId);
  const nameRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (pending === id) {
      nameRef.current?.focus();
      nameRef.current?.select();
      setPending(null);
    }
  }, [id, pending, setPending]);
  if (!theme) return null;
  return (
    <div className="space-y-3">
      <Field label="Name">
        <input ref={nameRef} value={theme.name} onChange={(event) => update(projectId, id, { name: event.target.value })} className="h-8 w-full rounded-md border border-line px-2 text-[13px]" />
      </Field>
      <Field label="Description">
        <textarea value={theme.description} onChange={(event) => update(projectId, id, { description: event.target.value })} rows={4} className="w-full rounded-md border border-line px-2 py-1.5 text-[13px]" />
      </Field>
      <div className="flex flex-wrap gap-1">
        {CLUSTER_COLORS.map((color) => (
          <button key={color.id} type="button" aria-label={color.label} aria-pressed={theme.color === color.id} onClick={() => update(projectId, id, { color: color.id }, true)} className={`h-6 rounded-md border px-2 text-[11px] cluster-${color.id} ${theme.color === color.id ? "outline outline-1 outline-accent" : ""}`}>{color.label}</button>
        ))}
      </div>
      <Button onClick={() => update(projectId, id, { collapsed: !theme.collapsed }, true)}>{theme.collapsed ? "Expand" : "Collapse"}</Button>
      <Button variant="danger" onClick={() => remove(projectId, [id])}>Delete cluster</Button>
    </div>
  );
}

function CardFields({ projectId, id }: { projectId: string; id: string }) {
  const bundle = useProject(projectId);
  const card = bundle?.cards.find((item) => item.id === id);
  const participant = bundle?.participants.find((item) => item.id === card?.participantId);
  const remove = useWorkspaceStore((state) => state.deleteIds);
  if (!participant) return null;
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">{participant.name}</h3>
      <p className="text-[13px] text-muted-ink">{participant.role}</p>
      <p className="text-[13px] leading-relaxed">{participant.detail}</p>
      <Button variant="danger" onClick={() => remove(projectId, [id])}>Remove from canvas</Button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-[12px] text-muted-ink">
      {label}
      <div className="mt-1 text-ink">{children}</div>
    </label>
  );
}

function TagEditor({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [value, setValue] = useState("");
  return (
    <div>
      <div className="mb-1 text-[12px] text-muted-ink">Tags</div>
      <div className="mb-1 flex flex-wrap gap-1">
        {tags.map((tag) => (
          <button key={tag} type="button" className="rounded bg-soft px-1.5 py-0.5 text-[11px]" onClick={() => onChange(tags.filter((item) => item !== tag))}>#{tag}</button>
        ))}
      </div>
      <input
        value={value}
        aria-label="Add tag"
        placeholder="Add a tag"
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            const next = value.trim().replace(/^#/, "");
            if (next) onChange([...tags, next]);
            setValue("");
          }
        }}
        className="h-8 w-full rounded-md border border-line px-2 text-[13px]"
      />
    </div>
  );
}

function RowActions({ onDuplicate, onDelete }: { onDuplicate: () => void; onDelete: () => void }) {
  return (
    <div className="flex gap-2">
      <Button onClick={onDuplicate}>Duplicate</Button>
      <Button variant="danger" onClick={onDelete}>Delete</Button>
    </div>
  );
}
