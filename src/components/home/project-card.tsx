"use client";

import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import type { PointerEvent as ReactPointerEvent } from "react";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";
import type { ProjectBundle, ProjectFolder } from "@/lib/types";
import { cn, formatDate, plural } from "@/lib/utils";
import { useWorkspaceStore } from "@/store/workspace";

export function ProjectCard({
  bundle,
  folders,
  grouping,
  onNewFolder,
  onDragPointerDown,
}: {
  bundle: ProjectBundle;
  folders: ProjectFolder[];
  grouping: boolean;
  onNewFolder: (projectId: string) => void;
  onDragPointerDown: (projectId: string, event: ReactPointerEvent<HTMLElement>) => void;
}) {
  const moveProjectToFolder = useWorkspaceStore((state) => state.moveProjectToFolder);
  const insights = bundle.insights.filter((insight) => insight.status !== "rejected").length;
  const folderId = bundle.project.folderId ?? null;
  const destinations = folders.filter((folder) => folder.id !== folderId);

  return (
    <div
      data-project-card
      data-project-id={bundle.project.id}
      onPointerDown={(event) => onDragPointerDown(bundle.project.id, event)}
      className={cn(
        "relative flex cursor-grab flex-col rounded-md border bg-canvas p-4 transition-colors active:cursor-grabbing",
        grouping ? "border-accent bg-accent-soft" : "border-line hover:border-ink/25",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <Link href={`/projects/${bundle.project.id}`} className="min-w-0 flex-1" draggable={false}>
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-[15px] font-medium tracking-tight">{bundle.project.name}</h2>
            <span className="shrink-0 text-[12px] text-muted-ink">{formatDate(bundle.project.updatedAt)}</span>
          </div>
          <p className="mt-1 text-[12px] text-muted-ink">{bundle.project.researchType}</p>
        </Link>
        <div data-no-drag>
          <Dropdown
            trigger={
              <button
                type="button"
                aria-label={`Move ${bundle.project.name}`}
                className="rounded-md p-1 text-muted-ink hover:bg-soft hover:text-ink"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            }
          >
            {destinations.map((folder) => (
              <DropdownItem key={folder.id} onSelect={() => moveProjectToFolder(bundle.project.id, folder.id)}>
                Move to {folder.name}
              </DropdownItem>
            ))}
            {folderId ? (
              <DropdownItem onSelect={() => moveProjectToFolder(bundle.project.id, null)}>Remove from folder</DropdownItem>
            ) : null}
            <DropdownItem onSelect={() => onNewFolder(bundle.project.id)}>New folder…</DropdownItem>
          </Dropdown>
        </div>
      </div>
      <Link href={`/projects/${bundle.project.id}`} className="mt-3" draggable={false}>
        <p className="line-clamp-2 text-[13px] leading-relaxed text-muted-ink">{bundle.project.researchQuestion}</p>
        <p className="mt-4 text-[12px] text-ink">
          {plural(bundle.participants.length, "participant")} · {plural(insights, "insight")}
        </p>
      </Link>
      {grouping ? <p className="mt-3 text-[12px] font-medium text-accent-ink">Drop to create a folder</p> : null}
    </div>
  );
}
