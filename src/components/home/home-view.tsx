"use client";

import { useState } from "react";
import { ProjectCard } from "@/components/home/project-card";
import { TopBar } from "@/components/shell/top-bar";
import { Button } from "@/components/ui/button";
import { firstName, greeting } from "@/lib/utils";
import { usePreferencesStore } from "@/store/preferences";
import { useWorkspaceStore } from "@/store/workspace";

export function HomeView() {
  const order = useWorkspaceStore((state) => state.order);
  const projects = useWorkspaceStore((state) => state.projects);
  const setNewProjectOpen = useWorkspaceStore((state) => state.setNewProjectOpen);
  const name = usePreferencesStore((state) => state.profile.name);
  const [hello] = useState(() => greeting());
  const bundles = order.map((id) => projects[id]).filter(Boolean).sort((a, b) => b.project.updatedAt.localeCompare(a.project.updatedAt));

  return (
    <div className="min-h-screen bg-bg text-ink">
      <TopBar />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <p className="text-[13px] text-muted-ink">{hello}</p>
        <h1 className="mt-1 text-2xl font-medium tracking-tight">{firstName(name)}</h1>
        <p className="mt-2 max-w-xl text-[13px] text-muted-ink">Pick up a study or start a new synthesis.</p>
        <div className="mt-8 flex items-center justify-between">
          <h2 className="text-[13px] font-medium">Recent projects</h2>
          <Button variant="primary" onClick={() => setNewProjectOpen(true)}>New project</Button>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {bundles.map((bundle) => <ProjectCard key={bundle.project.id} bundle={bundle} />)}
          <button type="button" onClick={() => setNewProjectOpen(true)} className="flex min-h-36 items-center justify-center rounded-md border border-dashed border-line text-[13px] text-muted-ink hover:bg-canvas">
            New project
          </button>
        </div>
      </main>
    </div>
  );
}
