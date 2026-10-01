"use client";

import { CircleHelp, Search, Share2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "@/components/brand/logo";
import { AccentColorPicker, ThemeToggle } from "@/components/theme/theme-controls";
import { Button } from "@/components/ui/button";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";
import { Tooltip } from "@/components/ui/tooltip";
import { resolveTheme } from "@/lib/theme";
import { cn, firstName } from "@/lib/utils";
import { usePreferencesStore } from "@/store/preferences";
import { useProject, useWorkspaceStore } from "@/store/workspace";
import { useEffect, useState } from "react";

function sectionLabel(pathname: string, projectId?: string) {
  if (!projectId) return "Projects";
  if (pathname.endsWith("/research")) return "Research Synthesis";
  if (/\/insights\/[^/]+$/.test(pathname)) return "Insight";
  if (pathname.endsWith("/insights")) return "Insights";
  if (pathname.includes("/interviews")) return "Interviews";
  if (pathname.endsWith("/personas")) return "Personas";
  if (pathname.endsWith("/notes")) return "Research notes";
  if (pathname.endsWith("/reports")) return "Report";
  if (pathname.endsWith("/settings")) return "Settings";
  if (pathname.endsWith("/surveys")) return "Surveys";
  if (pathname.endsWith("/usability")) return "Usability tests";
  return "Overview";
}

export function TopBar({ projectId }: { projectId?: string }) {
  const pathname = usePathname();
  const project = useProject(projectId ?? "");
  const profile = usePreferencesStore((state) => state.profile);
  const mode = usePreferencesStore((state) => state.mode);
  const [resolved, setResolved] = useState<"light" | "dark">("light");
  const [mod, setMod] = useState("Ctrl");
  const setCommandOpen = useWorkspaceStore((state) => state.setCommandOpen);
  const setHelpOpen = useWorkspaceStore((state) => state.setHelpOpen);
  const setShareOpen = useWorkspaceStore((state) => state.setShareOpen);
  const setAnalysisOpen = useWorkspaceStore((state) => state.setAnalysisOpen);
  const label = sectionLabel(pathname, projectId);
  const initials = profile.name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  useEffect(() => {
    setResolved(resolveTheme(mode));
    setMod(/Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl");
  }, [mode]);

  return (
    <header className="relative flex h-12 shrink-0 items-center gap-3 border-b border-line bg-canvas px-3">
      <Link href="/" className="shrink-0 rounded-md" aria-label="Insightboard home">
        <Wordmark compact={Boolean(projectId)} />
      </Link>
      {project ? (
        <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 text-[13px] sm:flex">
          <Link href="/" className="text-muted-ink hover:text-ink">Projects</Link>
          <span className="text-muted-ink">/</span>
          <Link href={`/projects/${project.project.id}`} className="truncate text-muted-ink hover:text-ink">{project.project.name}</Link>
          <span className="text-muted-ink">/</span>
          <span className="truncate text-ink">{label}</span>
        </nav>
      ) : (
        <span className="text-[13px] text-muted-ink">Projects</span>
      )}
      <div className="pointer-events-none absolute left-1/2 hidden -translate-x-1/2 text-[13px] font-medium md:block">{projectId ? label : null}</div>
      <div className="ml-auto flex items-center gap-1">
        {projectId && (pathname.endsWith("/research") || pathname.endsWith("/insights")) ? (
          <Button variant="primary" className="hidden sm:inline-flex" onClick={() => setAnalysisOpen(true, "setup")}>
            Analyze research
          </Button>
        ) : null}
        <button
          type="button"
          onClick={() => setCommandOpen(true, "")}
          className="hidden h-8 items-center gap-2 rounded-md border border-line px-2 text-[13px] text-muted-ink hover:bg-soft sm:inline-flex"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Search</span>
          <kbd className="rounded border border-line px-1 text-[10px]">{mod}K</kbd>
        </button>
        <Tooltip content="Search">
          <Button variant="ghost" size="icon" className="sm:hidden" aria-label="Search" onClick={() => setCommandOpen(true, "")}>
            <Search className="h-4 w-4" />
          </Button>
        </Tooltip>
        {projectId ? (
          <Tooltip content="Share">
            <Button variant="ghost" size="icon" aria-label="Share project" onClick={() => setShareOpen(true)}>
              <Share2 className="h-4 w-4" />
            </Button>
          </Tooltip>
        ) : null}
        <Tooltip content="Help and shortcuts">
          <Button variant="ghost" size="icon" aria-label="Help" onClick={() => setHelpOpen(true)}>
            <CircleHelp className="h-4 w-4" />
          </Button>
        </Tooltip>
        <ThemeToggle resolved={resolved} />
        <AccentColorPicker />
        <Dropdown
          trigger={
            <button type="button" className="ml-1 flex h-7 w-7 items-center justify-center rounded-full border border-line bg-soft text-[10px] font-medium" aria-label={`Account menu for ${profile.name}`}>
              {initials}
            </button>
          }
        >
          <div className="px-2 py-1.5">
            <div className="text-[13px] font-medium">{profile.name}</div>
            <div className="text-[11px] text-muted-ink">{profile.email}</div>
          </div>
          <DropdownItem onSelect={() => { window.location.href = projectId ? `/projects/${projectId}/settings` : "/"; }}>
            {projectId ? "Project settings" : `Signed in as ${firstName(profile.name)}`}
          </DropdownItem>
        </Dropdown>
      </div>
      <span className={cn("sr-only")}>{label}</span>
    </header>
  );
}
