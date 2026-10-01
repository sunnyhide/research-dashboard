"use client";

import type { AIFinding } from "@/lib/types";
import { FINDING_KIND_LABEL } from "@/lib/data";
import { ConfidenceMeter } from "@/components/insights/insight-card";
import { plural } from "@/lib/utils";
import { useWorkspaceStore } from "@/store/workspace";

export function FindingCard({ finding, projectId, selected }: { finding: AIFinding; projectId: string; selected: boolean }) {
  const accept = useWorkspaceStore((state) => state.acceptFinding);
  const reject = useWorkspaceStore((state) => state.rejectFinding);
  const setPendingFocusId = useWorkspaceStore((state) => state.setPendingFocusId);
  const setInspectorOpen = useWorkspaceStore((state) => state.setInspectorOpen);
  return (
    <article className={`overflow-hidden rounded-md border border-line bg-canvas shadow-card ${selected ? "outline outline-2 outline-offset-2 outline-accent" : ""}`}>
      <div className="h-0.5 bg-accent" />
      <div className="px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-accent-ink">AI finding</span>
          <span className="text-[10px] text-muted-ink">Review required</span>
        </div>
        <h3 className="mt-1 text-[13px] font-medium leading-snug">{finding.title}</h3>
        <p className="mt-1 line-clamp-4 text-[12px] leading-relaxed text-muted-ink">{finding.description}</p>
        <p className="mt-2 text-[11px] text-muted-ink">
          {FINDING_KIND_LABEL[finding.kind]} · {finding.suggestedTheme}
        </p>
        <p className="text-[11px] text-muted-ink">
          {plural(finding.evidenceParticipants, "participant")} · {plural(finding.evidenceQuotes, "supporting quote")}
        </p>
        <div className="mt-2">
          <ConfidenceMeter level={finding.confidence} />
        </div>
        <div className="mt-2 flex gap-1" data-no-drag>
          <button type="button" className="rounded-md bg-accent px-2 py-1 text-[12px] text-white" onClick={() => accept(projectId, finding.id)}>Accept</button>
          <button
            type="button"
            className="rounded-md border border-line px-2 py-1 text-[12px]"
            onClick={() => {
              setInspectorOpen(true);
              setPendingFocusId(finding.id);
            }}
          >
            Edit
          </button>
          <button type="button" className="rounded-md px-2 py-1 text-[12px] text-danger" onClick={() => reject(projectId, finding.id)}>Reject</button>
        </div>
      </div>
    </article>
  );
}
