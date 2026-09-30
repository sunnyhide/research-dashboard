"use client";

import type { Insight, Theme } from "@/lib/types";
import { CONFIDENCE_LABEL, STATUS_LABEL } from "@/lib/theme";
import { cn, plural } from "@/lib/utils";

export function StatusBadge({ status }: { status: Insight["status"] }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-ink">
      <span
        aria-hidden
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          status === "validated" && "bg-ok",
          status === "needs-review" && "bg-warn",
          status === "ai-suggested" && "bg-accent",
          status === "rejected" && "bg-danger",
          status === "draft" && "bg-muted-ink",
        )}
      />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function ConfidenceMeter({ level }: { level: Insight["confidence"] }) {
  const filled = level === "high" ? 3 : level === "medium" ? 2 : 1;
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-ink">
      <span className="inline-flex items-end gap-0.5" aria-hidden>
        {[0, 1, 2].map((index) => (
          <span key={index} className={cn("w-1 rounded-[1px]", index < filled ? "bg-ink" : "bg-line", index === 0 ? "h-1.5" : index === 1 ? "h-2.5" : "h-3.5")} />
        ))}
      </span>
      {CONFIDENCE_LABEL[level]} confidence
    </span>
  );
}

export function InsightCard({
  insight,
  themes,
  canvas = false,
  selected = false,
}: {
  insight: Insight;
  themes: Theme[];
  canvas?: boolean;
  selected?: boolean;
}) {
  const names = themes.filter((theme) => insight.themeIds.includes(theme.id)).map((theme) => theme.name);
  return (
    <article className={cn("rounded-md border border-line bg-canvas shadow-card", canvas ? "px-3 py-2.5" : "p-4 hover:border-ink/20", selected && "outline outline-2 outline-offset-2 outline-accent", insight.aiGenerated && insight.status !== "validated" && "border-t-2 border-t-accent")}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-ink">{insight.aiGenerated ? "AI-generated · Review required" : "Research insight"}</p>
        <StatusBadge status={insight.status} />
      </div>
      <h3 className={cn("mt-1 font-medium tracking-tight", canvas ? "text-[13px] leading-snug" : "text-sm")}>{insight.title}</h3>
      {insight.description ? <p className="mt-1 line-clamp-3 text-[13px] leading-relaxed text-muted-ink">{insight.description}</p> : null}
      <p className="mt-2 text-[12px] text-muted-ink">
        {plural(insight.evidenceQuotes, "supporting quote")} · {plural(insight.evidenceParticipants, "participant")}
      </p>
      {names.length ? <p className="mt-1 text-[12px] text-muted-ink">{names.join(" · ")}</p> : null}
      {insight.aiGenerated && insight.status !== "validated" ? <div className="mt-2"><ConfidenceMeter level={insight.confidence} /></div> : null}
    </article>
  );
}
