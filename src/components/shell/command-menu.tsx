"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SearchDialog, type PaletteItem } from "@/components/shell/search-dialog";
import { searchWorkspace } from "@/lib/search";
import { usePreferencesStore } from "@/store/preferences";
import { useWorkspaceStore } from "@/store/workspace";

export function CommandMenu() {
  const open = useWorkspaceStore((state) => state.commandOpen);
  const query = useWorkspaceStore((state) => state.commandQuery);
  const setCommandOpen = useWorkspaceStore((state) => state.setCommandOpen);
  const projects = useWorkspaceStore((state) => state.projects);
  const order = useWorkspaceStore((state) => state.order);
  const addSticky = useWorkspaceStore((state) => state.addSticky);
  const addInsight = useWorkspaceStore((state) => state.addInsight);
  const addQuote = useWorkspaceStore((state) => state.addQuote);
  const addCluster = useWorkspaceStore((state) => state.addCluster);
  const setAnalysisOpen = useWorkspaceStore((state) => state.setAnalysisOpen);
  const focusObject = useWorkspaceStore((state) => state.focusObject);
  const toggleMode = usePreferencesStore((state) => state.toggleMode);
  const cycleAccent = usePreferencesStore((state) => state.cycleAccent);
  const pathname = usePathname();
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);

  const projectId = pathname.match(/^\/projects\/([^/]+)/)?.[1] ?? order[0];

  const items = useMemo(() => {
    const go = (href: string, after?: () => void) => {
      setCommandOpen(false, "");
      if (!pathname.startsWith(href)) router.push(href);
      after?.();
    };
    const research = `/projects/${projectId}/research`;
    const commands: PaletteItem[] = projectId
      ? [
          { id: "cmd-sticky", label: "Add sticky note", detail: "N", meta: "Command", onSelect: () => go(research, () => addSticky(projectId)) },
          { id: "cmd-insight", label: "Add insight", detail: "I", meta: "Command", onSelect: () => go(research, () => addInsight(projectId)) },
          { id: "cmd-quote", label: "Add quote", detail: "Q", meta: "Command", onSelect: () => go(research, () => addQuote(projectId)) },
          { id: "cmd-cluster", label: "Create cluster", detail: "C", meta: "Command", onSelect: () => go(research, () => addCluster(projectId)) },
          { id: "cmd-analyze", label: "Analyze research", meta: "Command", onSelect: () => { setCommandOpen(false, ""); setAnalysisOpen(true, "setup"); if (!pathname.startsWith(research)) router.push(research); } },
          { id: "cmd-search", label: "Search research", detail: "Type to search", meta: "Command", onSelect: () => setCommandOpen(true, query || "") },
          { id: "cmd-theme", label: "Toggle dark mode", meta: "Command", onSelect: () => { toggleMode(); setCommandOpen(false, ""); } },
          { id: "cmd-accent", label: "Change accent color", meta: "Command", onSelect: () => { cycleAccent(); setCommandOpen(false, ""); } },
          { id: "cmd-settings", label: "Open settings", meta: "Command", onSelect: () => go(`/projects/${projectId}/settings`) },
        ]
      : [];
    const results: PaletteItem[] = searchWorkspace(order.map((id) => projects[id]).filter(Boolean), query).map((result) => ({
      id: `result-${result.projectId}-${result.id}`,
      label: result.title,
      detail: result.excerpt,
      meta: result.type,
      onSelect: () => {
        setCommandOpen(false, "");
        router.push(result.href);
        if (result.focusId) {
          window.setTimeout(() => focusObject(result.projectId, result.focusId!), 50);
        }
      },
    }));
    const q = query.trim().toLowerCase();
    const filteredCommands = q ? commands.filter((item) => item.label.toLowerCase().includes(q)) : commands;
    return q ? [...results, ...filteredCommands] : filteredCommands;
  }, [addCluster, addInsight, addQuote, addSticky, cycleAccent, focusObject, order, pathname, projectId, projects, query, router, setAnalysisOpen, setCommandOpen, toggleMode]);

  useEffect(() => setActiveIndex(0), [query, open]);

  return (
    <SearchDialog
      open={open}
      query={query}
      onQueryChange={(value) => setCommandOpen(true, value)}
      onOpenChange={(next) => setCommandOpen(next, next ? query : "")}
      items={items}
      activeIndex={Math.min(activeIndex, Math.max(items.length - 1, 0))}
      onActiveIndex={setActiveIndex}
    />
  );
}
