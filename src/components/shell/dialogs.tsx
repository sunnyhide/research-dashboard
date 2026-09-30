"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import type { ResearchKind } from "@/lib/types";
import { useWorkspaceStore } from "@/store/workspace";

const shortcuts = [
  ["⌘/Ctrl K", "Search and commands"],
  ["N", "New sticky note"],
  ["I", "New insight"],
  ["Q", "New quote"],
  ["C", "New cluster"],
  ["Delete", "Delete selected"],
  ["⌘/Ctrl D", "Duplicate"],
  ["⌘/Ctrl Z", "Undo"],
  ["⌘/Ctrl Shift Z", "Redo"],
  ["Esc", "Clear selection"],
  ["Space drag", "Pan canvas"],
  ["Scroll", "Pan"],
  ["⌘/Ctrl scroll", "Zoom"],
];

export function AppDialogs() {
  return (
    <>
      <HelpDialog />
      <ShareDialog />
      <NewProjectDialog />
    </>
  );
}

function HelpDialog() {
  const open = useWorkspaceStore((state) => state.helpOpen);
  const setOpen = useWorkspaceStore((state) => state.setHelpOpen);
  return (
    <Modal open={open} onOpenChange={setOpen} title="Shortcuts" description="The canvas stays out of the way until you ask it to move.">
      <ul className="divide-y divide-line">
        {shortcuts.map(([keys, label]) => (
          <li key={label} className="flex items-center justify-between gap-4 py-2 text-[13px]">
            <span>{label}</span>
            <kbd className="rounded border border-line px-1.5 py-0.5 text-[11px] text-muted-ink">{keys}</kbd>
          </li>
        ))}
      </ul>
    </Modal>
  );
}

function ShareDialog() {
  const open = useWorkspaceStore((state) => state.shareOpen);
  const setOpen = useWorkspaceStore((state) => state.setShareOpen);
  const toast = useWorkspaceStore((state) => state.toast);
  const pathname = usePathname();
  const projectId = pathname.match(/^\/projects\/([^/]+)/)?.[1];
  return (
    <Modal open={open} onOpenChange={setOpen} title="Share project" description="Anyone with the link can view this prototype on this browser.">
      <p className="rounded-md border border-line bg-soft px-3 py-2 text-[13px] text-muted-ink">
        {typeof window !== "undefined" && projectId ? `${window.location.origin}/projects/${projectId}` : "Open a project to copy a link."}
      </p>
      <div className="mt-4 flex justify-end">
        <Button
          variant="primary"
          onClick={async () => {
            if (!projectId) return;
            await navigator.clipboard.writeText(`${window.location.origin}/projects/${projectId}`);
            toast("Link copied");
            setOpen(false);
          }}
        >
          Copy link
        </Button>
      </div>
    </Modal>
  );
}

function NewProjectDialog() {
  const open = useWorkspaceStore((state) => state.newProjectOpen);
  const folderId = useWorkspaceStore((state) => state.newProjectFolderId);
  const folderName = useWorkspaceStore((state) => state.folders.find((folder) => folder.id === folderId)?.name);
  const setOpen = useWorkspaceStore((state) => state.setNewProjectOpen);
  const createProject = useWorkspaceStore((state) => state.createProject);
  const router = useRouter();
  const [name, setName] = useState("");
  const [researchType, setResearchType] = useState<ResearchKind>("Discovery");
  const [question, setQuestion] = useState("");

  return (
    <Modal
      open={open}
      onOpenChange={setOpen}
      title="New project"
      description={folderName ? `This project will be added to ${folderName}.` : "Start with a question. Evidence can come later."}
    >
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          const id = createProject({ name, researchType, researchQuestion: question });
          setName("");
          setQuestion("");
          router.push(`/projects/${id}`);
        }}
      >
        <label className="block text-[13px]">
          <span className="mb-1 block text-muted-ink">Name</span>
          <input required value={name} onChange={(event) => setName(event.target.value)} className="h-8 w-full rounded-md border border-line bg-canvas px-2" />
        </label>
        <label className="block text-[13px]">
          <span className="mb-1 block text-muted-ink">Research type</span>
          <select value={researchType} onChange={(event) => setResearchType(event.target.value as ResearchKind)} className="h-8 w-full rounded-md border border-line bg-canvas px-2">
            {["Discovery", "Usability", "Survey", "Mixed methods"].map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </label>
        <label className="block text-[13px]">
          <span className="mb-1 block text-muted-ink">Research question</span>
          <textarea required value={question} onChange={(event) => setQuestion(event.target.value)} rows={3} className="w-full rounded-md border border-line bg-canvas px-2 py-1.5" />
        </label>
        <div className="flex justify-end">
          <Button type="submit" variant="primary">Create project</Button>
        </div>
      </form>
    </Modal>
  );
}
