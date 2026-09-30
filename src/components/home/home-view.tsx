"use client";

import { Folder, MoreHorizontal } from "lucide-react";
import { useState, type DragEvent } from "react";
import { FolderDialog } from "@/components/home/folder-dialog";
import { ProjectCard } from "@/components/home/project-card";
import { TopBar } from "@/components/shell/top-bar";
import { Button } from "@/components/ui/button";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";
import type { ProjectBundle, ProjectFolder } from "@/lib/types";
import { cn, firstName, greeting, plural } from "@/lib/utils";
import { usePreferencesStore } from "@/store/preferences";
import { useWorkspaceStore } from "@/store/workspace";

type FolderPrompt = { kind: "create" } | { kind: "rename"; id: string; name: string } | { kind: "create-for"; projectId: string };

export function HomeView() {
  const order = useWorkspaceStore((state) => state.order);
  const projects = useWorkspaceStore((state) => state.projects);
  const folders = useWorkspaceStore((state) => state.folders);
  const setNewProjectOpen = useWorkspaceStore((state) => state.setNewProjectOpen);
  const createFolder = useWorkspaceStore((state) => state.createFolder);
  const renameFolder = useWorkspaceStore((state) => state.renameFolder);
  const deleteFolder = useWorkspaceStore((state) => state.deleteFolder);
  const moveProjectToFolder = useWorkspaceStore((state) => state.moveProjectToFolder);
  const name = usePreferencesStore((state) => state.profile.name);
  const [hello] = useState(() => greeting());
  const [prompt, setPrompt] = useState<FolderPrompt | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  function setPromptForProject(projectId: string) {
    setPrompt({ kind: "create-for", projectId });
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

  function takeDrop(folderId: string | null, event: DragEvent) {
    event.preventDefault();
    const projectId = event.dataTransfer.getData("text/plain");
    setDragOver(null);
    if (projectId) moveProjectToFolder(projectId, folderId);
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
            <p className="mt-1 text-[13px] text-muted-ink">Group studies into folders. Drag a project onto a folder, or use the menu on a card.</p>
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
            active={dragOver === folder.id}
            onDragEnter={() => setDragOver(folder.id)}
            onDragLeave={(event) => {
              if (event.currentTarget.contains(event.relatedTarget as Node)) return;
              setDragOver((current) => (current === folder.id ? null : current));
            }}
            onDrop={(event) => takeDrop(folder.id, event)}
            onNewProject={() => setNewProjectOpen(true, folder.id)}
            onRename={() => setPrompt({ kind: "rename", id: folder.id, name: folder.name })}
            onDelete={() => deleteFolder(folder.id)}
            onNewFolder={setPromptForProject}
          />
        ))}

        <section
          className={cn("mt-6 rounded-md px-1 py-1", dragOver === "none" && "bg-accent-soft")}
          onDragEnter={(event) => {
            event.preventDefault();
            setDragOver("none");
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver("none");
          }}
          onDragLeave={(event) => {
            if (event.currentTarget.contains(event.relatedTarget as Node)) return;
            setDragOver((current) => (current === "none" ? null : current));
          }}
          onDrop={(event) => takeDrop(null, event)}
        >
          {folders.length ? <h3 className="px-1 text-[13px] font-medium">Ungrouped</h3> : null}
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {ungrouped.map((bundle) => (
              <ProjectCard key={bundle.project.id} bundle={bundle} folders={folders} onNewFolder={setPromptForProject} />
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
        title={prompt?.kind === "rename" ? "Rename folder" : "New folder"}
        description={prompt?.kind === "create-for" ? "The selected project will be moved into this folder." : "Folders keep related studies together."}
        initialName={prompt?.kind === "rename" ? prompt.name : ""}
        confirmLabel={prompt?.kind === "rename" ? "Rename" : "Create folder"}
        onOpenChange={(open) => {
          if (!open) setPrompt(null);
        }}
        onSubmit={(folderName) => {
          if (prompt?.kind === "rename") renameFolder(prompt.id, folderName);
          else {
            const id = createFolder(folderName);
            if (prompt?.kind === "create-for" && id) moveProjectToFolder(prompt.projectId, id);
          }
          setPrompt(null);
        }}
      />
    </div>
  );
}

function FolderSection({
  folder,
  projects,
  folders,
  active,
  onDragEnter,
  onDragLeave,
  onDrop,
  onNewProject,
  onRename,
  onDelete,
  onNewFolder,
}: {
  folder: ProjectFolder;
  projects: ProjectBundle[];
  folders: ProjectFolder[];
  active: boolean;
  onDragEnter: () => void;
  onDragLeave: (event: DragEvent) => void;
  onDrop: (event: DragEvent) => void;
  onNewProject: () => void;
  onRename: () => void;
  onDelete: () => void;
  onNewFolder: (projectId: string) => void;
}) {
  return (
    <section
      aria-label={folder.name}
      className={cn("mt-6 rounded-md border px-3 py-3", active ? "border-accent bg-accent-soft" : "border-line bg-soft")}
      onDragEnter={(event) => {
        event.preventDefault();
        onDragEnter();
      }}
      onDragOver={(event) => {
        event.preventDefault();
        onDragEnter();
      }}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
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
            <ProjectCard key={bundle.project.id} bundle={bundle} folders={folders} onNewFolder={onNewFolder} />
          ))}
        </div>
      ) : (
        <p className="mt-3 px-1 text-[13px] text-muted-ink">Empty folder. Drop a project here, or create one in this folder.</p>
      )}
    </section>
  );
}
