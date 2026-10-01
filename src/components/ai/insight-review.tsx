"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfidenceMeter } from "@/components/insights/insight-card";
import { FINDING_KIND_LABEL } from "@/lib/data";
import type { AIFinding, Confidence } from "@/lib/types";
import { plural } from "@/lib/utils";
import { useProject, useWorkspaceStore } from "@/store/workspace";

export function AIInsightReview({ projectId }: { projectId: string }) {
  const bundle = useProject(projectId);
  const accept = useWorkspaceStore((state) => state.acceptFinding);
  const reject = useWorkspaceStore((state) => state.rejectFinding);
  const update = useWorkspaceStore((state) => state.updateFinding);
  const merge = useWorkspaceStore((state) => state.mergeFindings);
  const [tab, setTab] = useState<"pending" | "accepted" | "rejected">("pending");
  const [editing, setEditing] = useState<string | null>(null);
  const [checked, setChecked] = useState<string[]>([]);
  if (!bundle) return null;
  const findings = bundle.findings.filter((finding) => finding.status === tab);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {(["pending", "accepted", "rejected"] as const).map((item) => (
          <button key={item} type="button" onClick={() => setTab(item)} className={`h-7 rounded-md px-2 text-[12px] ${tab === item ? "bg-accent-soft text-accent-ink" : "text-muted-ink hover:bg-soft"}`}>
            {item === "pending" ? "Proposed" : item === "accepted" ? "Accepted" : "Rejected"}
            <span className="ml-1">{bundle.findings.filter((finding) => finding.status === item).length}</span>
          </button>
        ))}
        {tab === "pending" && checked.length > 1 ? <Button size="sm" onClick={() => { merge(projectId, checked); setChecked([]); }}>Merge</Button> : null}
      </div>
      {findings.length === 0 ? <p className="py-8 text-[13px] text-muted-ink">Nothing in this list.</p> : null}
      <ul className="space-y-3">
        {findings.map((finding) => (
          <li key={finding.id} className="rounded-md border border-line p-3">
            <div className="flex items-start gap-2">
              {tab === "pending" ? (
                <input
                  type="checkbox"
                  aria-label={`Select ${finding.title}`}
                  checked={checked.includes(finding.id)}
                  onChange={(event) => setChecked((current) => event.target.checked ? [...current, finding.id] : current.filter((id) => id !== finding.id))}
                  className="mt-1"
                />
              ) : null}
              <div className="min-w-0 flex-1">
                {editing === finding.id ? (
                  <FindingEditor finding={finding} onCancel={() => setEditing(null)} onSave={(patch) => { update(projectId, finding.id, patch, true); setEditing(null); }} />
                ) : (
                  <>
                    <h3 className="text-[14px] font-medium leading-snug">{finding.title}</h3>
                    <p className="mt-1 text-[13px] leading-relaxed text-muted-ink">{finding.description}</p>
                    <p className="mt-2 text-[12px] text-muted-ink">
                      {FINDING_KIND_LABEL[finding.kind]} · {finding.suggestedTheme} · {plural(finding.evidenceQuotes, "supporting quote")} · {plural(finding.evidenceParticipants, "participant")}
                    </p>
                    <div className="mt-1"><ConfidenceMeter level={finding.confidence} /></div>
                  </>
                )}
                {tab === "pending" && editing !== finding.id ? (
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="primary" onClick={() => accept(projectId, finding.id)}>Accept</Button>
                    <Button size="sm" onClick={() => setEditing(finding.id)}>Edit</Button>
                    <Button size="sm" variant="danger" onClick={() => reject(projectId, finding.id)}>Reject</Button>
                  </div>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FindingEditor({
  finding,
  onSave,
  onCancel,
}: {
  finding: AIFinding;
  onSave: (patch: Partial<AIFinding>) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(finding.title);
  const [description, setDescription] = useState(finding.description);
  const [suggestedTheme, setSuggestedTheme] = useState(finding.suggestedTheme);
  const [confidence, setConfidence] = useState<Confidence>(finding.confidence);
  return (
    <div className="space-y-2">
      <input value={title} onChange={(event) => setTitle(event.target.value)} aria-label="Finding title" className="h-8 w-full rounded-md border border-line px-2 text-[13px]" />
      <textarea value={description} onChange={(event) => setDescription(event.target.value)} aria-label="Finding description" rows={4} className="w-full rounded-md border border-line px-2 py-1.5 text-[13px]" />
      <input value={suggestedTheme} onChange={(event) => setSuggestedTheme(event.target.value)} aria-label="Suggested theme" className="h-8 w-full rounded-md border border-line px-2 text-[13px]" />
      <select value={confidence} aria-label="Confidence" onChange={(event) => setConfidence(event.target.value as Confidence)} className="h-8 w-full rounded-md border border-line px-2 text-[13px]">
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>
      <div className="flex gap-2">
        <Button size="sm" variant="primary" onClick={() => onSave({ title, description, suggestedTheme, confidence })}>Save</Button>
        <Button size="sm" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}
