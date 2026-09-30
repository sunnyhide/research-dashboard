"use client";

import { Folder, MoreHorizontal } from "lucide-react";
import { useState, type PointerEvent as ReactPointerEvent } from "react";
import { FolderDialog } from "@/components/home/folder-dialog";
import { ProjectCard } from "@/components/home/project-card";
import { TopBar } from "@/components/shell/top-bar";
import { Button } from "@/components/ui/button";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";
import type { ProjectBundle, ProjectFolder } from "@/lib/types";
import { cn, firstName, greeting, plural } from "@/lib/utils";
import { usePreferencesStore } from "@/store/preferences";
import { useWorkspaceStore } from "@/store/workspace";

type FolderPrompt =
  | { kind: "create" }
  | { kind: "rename"; id: string; name: string }
  | { kind: "create-for"; projectId: string }
  | { kind: "name-created"; id: string; name: string; summary: string };

export function HomeView() {
  const order = useWorkspaceStore((state) => state.order);
  const projects = useWorkspaceStore((state) => state.projects);
  const folders = useWorkspaceStore((state) => state.folders);
  const setNewProjectOpen = useWorkspaceStore((state) => state.setNewProjectOpen);
  const createFolder = useWorkspaceStore((state) => state.createFolder);
  const createFolderWithProjects = useWorkspaceStore((state) => state.createFolderWithProjects);
  const renameFolder = useWorkspaceStore((state) => state.renameFolder);
  const deleteFolder = useWorkspaceStore((state) => state.deleteFolder);
  const moveProjectToFolder = useWorkspaceStore((state) => state.moveProjectToFolder);
  const name = usePreferencesStore((state) => state.profile.name);
  const [hello] = useState(() => greeting());
  const [prompt, setPrompt] = useState<FolderPrompt | null>(null);
  const [drag, setDrag] = useState<{ id: string; name: string; x: number; y: number; overProject: string | null; overFolder: string | null } | null>(null);

  function setPromptForProject(projectId: string) {
    setPrompt({ kind: "create-for", projectId });
  }

  function groupProjects(sourceId: string, targetId: string) {
    if (!sourceId || sourceId === targetId || !projects[sourceId] || !projects[targetId]) return;
    const folderName = nextFolderName(folders);
    const id = createFolderWithProjects(folderName, [sourceId, targetId]);
    if (!id) return;
    const summary = `${projects[targetId].project.name} and ${projects[sourceId].project.name} are in this folder.`;
    setPrompt({ kind: "name-created", id, name: folderName, summary });
  }

  function startProjectDrag(projectId: string, event: ReactPointerEvent<HTMLElement>) {
    if (event.button !== 0) return;
    if ((event.target as HTMLElement).closest("[data-no-drag]")) return;
    const startX = event.clientX;
    const startY = event.clientY;
    const pointerId = event.pointerId;
    const handle = event.currentTarget;
    handle.setPointerCapture(pointerId);
    let moved = false;

    const hitAt = (x: number, y: number) => {
      const hit = document.elementFromPoint(x, y);
      const projectEl = hit?.closest("[data-project-id]");
      const folderEl = hit?.closest("[data-folder-id]");
      const overProject = projectEl?.getAttribute("data-project-id") ?? null;
      const overFolder = folderEl?.getAttribute("data-folder-id") ?? null;
      return {
        overProject: overProject && overProject !== projectId ? overProject : null,
        overFolder: overProject && overProject !== projectId ? null : overFolder,
      };
    };

    const move = (pointer: PointerEvent) => {
      if (pointer.pointerId !== pointerId) return;
      if (!moved && Math.hypot(pointer.clientX - startX, pointer.clientY - startY) < 6) return;
      moved = true;
      const hit = hitAt(pointer.clientX, pointer.clientY);
      setDrag({ id: projectId, name: projects[projectId]?.project.name ?? "Project", x: pointer.clientX, y: pointer.clientY, ...hit });
    };

    const finish = (pointer: PointerEvent) => {
      if (pointer.pointerId !== pointerId) return;
      if (handle.hasPointerCapture(pointerId)) handle.releasePointerCapture(pointerId);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
      if (moved) {
        const hit = hitAt(pointer.clientX, pointer.clientY);
        if (hit.overProject) groupProjects(projectId, hit.overProject);
        else if (hit.overFolder === "none") moveProjectToFolder(projectId, null);
        else if (hit.overFolder) moveProjectToFolder(projectId, hit.overFolder);
        const blockClick = (click: MouseEvent) => {
          click.preventDefault();
          click.stopPropagation();
          window.removeEventListener("click", blockClick, true);
        };
        window.addEventListener("click", blockClick, true);
      }
      setDrag(null);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);
  }

  const bundles = order
    .map((id) => projects[id])
    .filter(Boolean)
    .sort((a, b) => b.project.updatedAt.localeCompare(a.project.updatedAt));
  const folderIds = new Set(folders.map((folder) => folder.id));
  const ungrouped = bundles.filter((bundle) => !bundle.project.folderId || !folderIds.has(bundle.project.folderId));

  function projectsIn(folder: ProjectFolder) {
    return bundles.filter((bundle) => bundle.project.folderId === folder.id);
  }

  return (
    <div className="min-h-screen bg-bg text-ink">
      <TopBar />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <p className="text-[13px] text-muted-ink">{hello}</p>
        <h1 className="mt-1 text-2xl font-medium tracking-tight">{firstName(name)}</h1>
        <p className="mt-2 max-w-xl text-[13px] text-muted-ink">Pick up a study or start a new synthesis.</p>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[13px] font-medium">Projects</h2>
            <p className="mt-1 text-[13px] text-muted-ink">Drag one project onto another to create a folder, or drop a project onto a folder to move it.</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setPrompt({ kind: "create" })}>New folder</Button>
            <Button variant="primary" onClick={() => setNewProjectOpen(true)}>
              New project
            </Button>
          </div>
        </div>

        {folders.map((folder) => (
          <FolderSection
            key={folder.id}
            folder={folder}
            projects={projectsIn(folder)}
            folders={folders}
            active={drag?.overFolder === folder.id}
            groupingId={drag?.overProject ?? null}
            onDragPointerDown={startProjectDrag}
            onNewProject={() => setNewProjectOpen(true, folder.id)}
            onRename={() => setPrompt({ kind: "rename", id: folder.id, name: folder.name })}
            onDelete={() => deleteFolder(folder.id)}
            onNewFolder={setPromptForProject}
          />
        ))}

        <section data-folder-id="none" className={cn("mt-6 rounded-md px-1 py-1", drag?.overFolder === "none" && "bg-accent-soft")}>
          {folders.length ? <h3 className="px-1 text-[13px] font-medium">Ungrouped</h3> : null}
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {ungrouped.map((bundle) => (
              <ProjectCard
                key={bundle.project.id}
                bundle={bundle}
                folders={folders}
                grouping={drag?.overProject === bundle.project.id}
                onNewFolder={setPromptForProject}
                onDragPointerDown={startProjectDrag}
              />
            ))}
            <button
              type="button"
              onClick={() => setNewProjectOpen(true)}
              className="flex min-h-36 items-center justify-center rounded-md border border-dashed border-line text-[13px] text-muted-ink hover:bg-canvas"
            >
              New project
            </button>
          </div>
          {folders.length && ungrouped.length === 0 ? (
            <p className="mt-3 px-1 text-[13px] text-muted-ink">Drop a project here to take it out of a folder.</p>
          ) : null}
        </section>
      </main>
      <FolderDialog
        open={prompt !== null}
        title={prompt?.kind === "rename" ? "Rename folder" : prompt?.kind === "name-created" ? "Name this folder" : "New folder"}
        description={
          prompt?.kind === "create-for"
            ? "The selected project will be moved into this folder."
            : prompt?.kind === "name-created"
              ? prompt.summary
              : "Folders keep related studies together."
        }
        initialName={prompt?.kind === "rename" || prompt?.kind === "name-created" ? prompt.name : ""}
        confirmLabel={prompt?.kind === "rename" ? "Rename" : prompt?.kind === "name-created" ? "Save" : "Create folder"}
        onOpenChange={(open) => {
          if (!open) setPrompt(null);
        }}
        onSubmit={(folderName) => {
          if (prompt?.kind === "rename" || prompt?.kind === "name-created") {
            if (folderName !== prompt.name) renameFolder(prompt.id, folderName);
          } else {
            const id = createFolder(folderName);
            if (prompt?.kind === "create-for" && id) moveProjectToFolder(prompt.projectId, id);
          }
          setPrompt(null);
        }}
      />
      {drag ? (
        <div
          className="pointer-events-none fixed z-[80] max-w-xs rounded-md border border-line bg-canvas px-3 py-2 text-[13px] shadow-card"
          style={{ left: drag.x + 14, top: drag.y + 14 }}
        >
          <div className="font-medium">{drag.name}</div>
          <div className="text-[12px] text-muted-ink">
            {drag.overProject ? "Drop to create a folder" : drag.overFolder && drag.overFolder !== "none" ? "Drop to move into folder" : drag.overFolder === "none" ? "Drop to remove from folder" : "Drag onto a project"}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function nextFolderName(folders: ProjectFolder[]) {
  const names = new Set(folders.map((folder) => folder.name));
  if (!names.has("New folder")) return "New folder";
  let count = 2;
  while (names.has(`New folder ${count}`)) count += 1;
  return `New folder ${count}`;
}

function FolderSection({
  folder,
  projects,
  folders,
  active,
  groupingId,
  onDragPointerDown,
  onNewProject,
  onRename,
  onDelete,
  onNewFolder,
}: {
  folder: ProjectFolder;
  projects: ProjectBundle[];
  folders: ProjectFolder[];
  active: boolean;
  groupingId: string | null;
  onDragPointerDown: (projectId: string, event: ReactPointerEvent<HTMLElement>) => void;
  onNewProject: () => void;
  onRename: () => void;
  onDelete: () => void;
  onNewFolder: (projectId: string) => void;
}) {
  return (
    <section
      aria-label={folder.name}
      data-folder-id={folder.id}
      className={cn("mt-6 rounded-md border px-3 py-3", active ? "border-accent bg-accent-soft" : "border-line bg-soft")}
    >
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="flex min-w-0 items-center gap-2">
          <Folder className="h-4 w-4 shrink-0 text-muted-ink" aria-hidden />
          <h3 className="truncate text-[13px] font-medium">{folder.name}</h3>
          <span className="shrink-0 text-[12px] text-muted-ink">{plural(projects.length, "project")}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" onClick={onNewProject}>
            New project
          </Button>
          <Dropdown
            trigger={
              <button type="button" aria-label={`${folder.name} actions`} className="rounded-md p-1 text-muted-ink hover:bg-canvas hover:text-ink">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            }
          >
            <DropdownItem onSelect={onRename}>Rename</DropdownItem>
            <DropdownItem onSelect={onDelete}>Delete folder</DropdownItem>
          </Dropdown>
        </div>
      </div>
      {projects.length ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {projects.map((bundle) => (
            <ProjectCard
              key={bundle.project.id}
              bundle={bundle}
              folders={folders}
              grouping={groupingId === bundle.project.id}
              onNewFolder={onNewFolder}
              onDragPointerDown={onDragPointerDown}
            />
          ))}
        </div>
      ) : (
        <p className="mt-3 px-1 text-[13px] text-muted-ink">Empty folder. Drop a project here, or create one in this folder.</p>
      )}
    </section>
  );
}
