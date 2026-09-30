"use client";

import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useRef, useState, type DragEvent } from "react";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";
import type { ProjectBundle, ProjectFolder } from "@/lib/types";
import { cn, formatDate, plural } from "@/lib/utils";
import { useWorkspaceStore } from "@/store/workspace";

let draggingProjectId: string | null = null;

export function ProjectCard({
  bundle,
  folders,
  onNewFolder,
  onGroup,
}: {
  bundle: ProjectBundle;
  folders: ProjectFolder[];
  onNewFolder: (projectId: string) => void;
  onGroup: (sourceId: string, targetId: string) => void;
}) {
  const moveProjectToFolder = useWorkspaceStore((state) => state.moveProjectToFolder);
  const dragged = useRef(false);
  const [grouping, setGrouping] = useState(false);
  const insights = bundle.insights.filter((insight) => insight.status !== "rejected").length;
  const folderId = bundle.project.folderId ?? null;
  const destinations = folders.filter((folder) => folder.id !== folderId);

  return (
    <div
      data-project-card
      draggable
      onDragStart={(event) => {
        if ((event.target as HTMLElement).closest("[data-no-drag]")) {
          event.preventDefault();
          return;
        }
        dragged.current = true;
        draggingProjectId = bundle.project.id;
        event.dataTransfer.setData("text/plain", bundle.project.id);
        event.dataTransfer.effectAllowed = "move";
      }}
      onDragEnd={() => {
        draggingProjectId = null;
        setGrouping(false);
        window.setTimeout(() => {
          dragged.current = false;
        }, 0);
      }}
      onDragEnter={(event) => markGroupTarget(event)}
      onDragOver={(event) => markGroupTarget(event)}
      onDragLeave={(event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node)) return;
        setGrouping(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setGrouping(false);
        const sourceId = event.dataTransfer.getData("text/plain");
        if (!sourceId || sourceId === bundle.project.id) return;
        onGroup(sourceId, bundle.project.id);
      }}
      className={cn(
        "relative flex flex-col rounded-md border bg-canvas p-4 transition-colors",
        grouping ? "border-accent bg-accent-soft" : "border-line hover:border-ink/25",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/projects/${bundle.project.id}`}
          draggable={false}
          onClick={(event) => {
            if (dragged.current) event.preventDefault();
          }}
          className="min-w-0 flex-1"
        >
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
      <Link
        href={`/projects/${bundle.project.id}`}
        draggable={false}
        onClick={(event) => {
          if (dragged.current) event.preventDefault();
        }}
        className="mt-3"
      >
        <p className="line-clamp-2 text-[13px] leading-relaxed text-muted-ink">{bundle.project.researchQuestion}</p>
        <p className="mt-4 text-[12px] text-ink">
          {plural(bundle.participants.length, "participant")} · {plural(insights, "insight")}
        </p>
      </Link>
      {grouping ? <p className="mt-3 text-[12px] font-medium text-accent-ink">Drop to create a folder</p> : null}
    </div>
  );

  function markGroupTarget(event: DragEvent) {
    if (draggingProjectId === bundle.project.id) return;
    event.preventDefault();
    event.stopPropagation();
    setGrouping(true);
  }
}
