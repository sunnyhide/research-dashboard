"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { InsightCard } from "@/components/insights/insight-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import type { InsightStatus } from "@/lib/types";
import { useWorkspaceStore } from "@/store/workspace";

const filters: { id: "all" | InsightStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "validated", label: "Validated" },
  { id: "ai-suggested", label: "AI suggested" },
  { id: "needs-review", label: "Needs review" },
];

export function InsightsView({ projectId }: { projectId: string }) {
  const bundle = useWorkspaceStore((state) => state.projects[projectId]);
  const setAnalysisOpen = useWorkspaceStore((state) => state.setAnalysisOpen);
  const [filter, setFilter] = useState<(typeof filters)[number]["id"]>("all");
  const [query, setQuery] = useState("");
  const insights = useMemo(() => {
    if (!bundle) return [];
    return bundle.insights.filter((insight) => {
      if (insight.status === "rejected") return false;
      if (filter === "ai-suggested") {
        if (!(insight.aiGenerated && insight.status !== "validated")) return false;
      } else if (filter !== "all" && insight.status !== filter) return false;
      const haystack = `${insight.title} ${insight.description} ${insight.tags.join(" ")}`.toLowerCase();
      return haystack.includes(query.trim().toLowerCase());
    });
  }, [bundle, filter, query]);

  if (!bundle) return null;
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="text-xl font-medium tracking-tight">Insights</h1>
        <p className="mt-1 text-[13px] text-muted-ink">Validated research findings from your project.</p>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {filters.map((item) => (
            <button key={item.id} type="button" onClick={() => setFilter(item.id)} className={`h-7 rounded-md px-2 text-[12px] ${filter === item.id ? "bg-accent-soft text-accent-ink" : "text-muted-ink hover:bg-soft"}`}>{item.label}</button>
          ))}
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search insights" aria-label="Search insights" className="ml-auto h-8 w-48 rounded-md border border-line bg-canvas px-2 text-[13px]" />
        </div>
        {insights.length === 0 ? (
          <EmptyState title="No insights yet" body="Analyze your research to uncover recurring patterns and candidate insights." action={<Button variant="primary" onClick={() => setAnalysisOpen(true, "setup")}>Analyze research</Button>} />
        ) : (
          <ul className="mt-4 grid gap-3">
            {insights.map((insight) => (
              <li key={insight.id}>
                <Link href={`/projects/${projectId}/insights/${insight.id}`} className="block">
                  <InsightCard insight={insight} themes={bundle.themes} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
