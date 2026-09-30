import Link from "next/link";
import type { ProjectBundle } from "@/lib/types";
import { formatDate, plural } from "@/lib/utils";

export function ProjectCard({ bundle }: { bundle: ProjectBundle }) {
  const insights = bundle.insights.filter((insight) => insight.status !== "rejected").length;
  return (
    <Link href={`/projects/${bundle.project.id}`} className="flex flex-col rounded-md border border-line bg-canvas p-4 transition-colors hover:border-ink/25">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[15px] font-medium tracking-tight">{bundle.project.name}</h2>
        <span className="shrink-0 text-[12px] text-muted-ink">{formatDate(bundle.project.updatedAt)}</span>
      </div>
      <p className="mt-1 text-[12px] text-muted-ink">{bundle.project.researchType}</p>
      <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-muted-ink">{bundle.project.researchQuestion}</p>
      <p className="mt-4 text-[12px] text-ink">
        {plural(bundle.participants.length, "participant")} · {plural(insights, "insight")}
      </p>
    </Link>
  );
}
