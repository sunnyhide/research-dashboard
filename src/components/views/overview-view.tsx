"use client";

import Link from "next/link";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { StatusBadge } from "@/components/insights/insight-card";
import { UploadResearch } from "@/components/research/upload-research";
import { useProject } from "@/store/workspace";

export function OverviewView({ projectId }: { projectId: string }) {
  const bundle = useProject(projectId);
  if (!bundle) return null;
  const data = bundle.themes
    .filter((theme) => theme.name !== "Field notes")
    .map((theme) => ({
      name: theme.name,
      evidence:
        bundle.quotes.filter((quote) => quote.clusterId === theme.id).length +
        bundle.stickies.filter((note) => note.clusterId === theme.id).length +
        bundle.insights.filter((insight) => insight.themeIds.includes(theme.id) && insight.status !== "rejected").length,
    }));
  const insights = bundle.insights.filter((insight) => insight.status !== "rejected").slice(0, 4);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <UploadResearch projectId={projectId} sources={bundle.sources} />
        <p className="mt-8 text-[12px] uppercase tracking-[0.14em] text-muted-ink">{bundle.project.researchType}</p>
        <h1 className="mt-1 max-w-3xl text-xl font-medium tracking-tight">{bundle.project.researchQuestion || "Add a research question in settings."}</h1>
        <p className="mt-2 max-w-2xl text-[13px] text-muted-ink">{bundle.project.description}</p>
        <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Participants" value={bundle.participants.length} />
          <Stat label="Interviews" value={bundle.interviews.length} />
          <Stat label="Quotes" value={bundle.quotes.length} />
          <Stat label="Insights" value={bundle.insights.filter((insight) => insight.status === "validated").length} />
        </dl>
        {data.length ? (
          <section className="mt-8">
            <h2 className="text-sm font-medium">Evidence by theme</h2>
            <div className="mt-3 h-56 rounded-md border border-line bg-canvas px-2 py-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--text-secondary)" }} interval={0} />
                  <YAxis allowDecimals={false} width={24} tick={{ fontSize: 11, fill: "var(--text-secondary)" }} />
                  <Tooltip cursor={{ fill: "var(--muted)" }} contentStyle={{ background: "var(--canvas)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }} />
                  <Bar dataKey="evidence" fill="var(--accent)" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        ) : null}
        <section className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium">Insights</h2>
              <Link href={`/projects/${projectId}/insights`} className="text-[13px] text-accent-ink">View all</Link>
            </div>
            <ul className="mt-3 divide-y divide-line border-y border-line">
              {insights.map((insight) => (
                <li key={insight.id}>
                  <Link href={`/projects/${projectId}/insights/${insight.id}`} className="flex items-start justify-between gap-3 py-3">
                    <span className="text-[13px]">{insight.title}</span>
                    <StatusBadge status={insight.status} />
                  </Link>
                </li>
              ))}
              {insights.length === 0 ? <li className="py-6 text-[13px] text-muted-ink">No insights yet.</li> : null}
            </ul>
          </div>
          <div>
            <h2 className="text-sm font-medium">Participants</h2>
            <ul className="mt-3 space-y-2">
              {bundle.participants.map((participant) => (
                <li key={participant.id} className="rounded-md border border-line bg-canvas px-3 py-2">
                  <div className="text-[13px] font-medium">{participant.name}</div>
                  <div className="text-[12px] text-muted-ink">{participant.code} · {participant.role}</div>
                </li>
              ))}
              {bundle.participants.length === 0 ? <li className="text-[13px] text-muted-ink">No participants yet.</li> : null}
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-line bg-canvas px-3 py-3">
      <dt className="text-[12px] text-muted-ink">{label}</dt>
      <dd className="mt-1 text-xl font-medium tabular-nums">{value}</dd>
    </div>
  );
}
