"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { useProject } from "@/store/workspace";

export function ParticipantList({ projectId, activeId }: { projectId: string; activeId?: string }) {
  const bundle = useProject(projectId);
  if (!bundle) return null;
  return (
    <nav aria-label="Interviews" className="h-full overflow-y-auto border-r border-line bg-bg p-3">
      <h2 className="px-2 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-ink">Interviews</h2>
      <ul className="mt-2 space-y-0.5">
        {bundle.interviews.map((interview) => {
          const participant = bundle.participants.find((person) => person.id === interview.participantId);
          const active = interview.id === activeId;
          return (
            <li key={interview.id}>
              <Link href={`/projects/${projectId}/interviews/${interview.id}`} className={cn("block rounded-md px-2 py-2", active ? "bg-accent-soft text-accent-ink" : "hover:bg-soft")} aria-current={active ? "page" : undefined}>
                <span className="block text-[13px]">{interview.title}</span>
                <span className="block text-[12px] text-muted-ink">{participant?.name}</span>
              </Link>
            </li>
          );
        })}
        {bundle.interviews.length === 0 ? <li className="px-2 py-3 text-[13px] text-muted-ink">No interviews yet.</li> : null}
      </ul>
    </nav>
  );
}
