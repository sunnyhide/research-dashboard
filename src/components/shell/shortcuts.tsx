"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isEditableTarget } from "@/lib/utils";
import { useWorkspaceStore } from "@/store/workspace";

export function Shortcuts() {
  const router = useRouter();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const store = useWorkspaceStore.getState();
      const meta = event.metaKey || event.ctrlKey;
      if (meta && event.key.toLowerCase() === "k") {
        event.preventDefault();
        store.setCommandOpen(true, "");
        return;
      }
      if (isEditableTarget(event.target) || store.commandOpen || store.analysisOpen || store.helpOpen || store.newProjectOpen || store.shareOpen) return;

      const projectId = window.location.pathname.match(/\/projects\/([^/]+)/)?.[1] ?? store.order[0];
      if (!projectId) return;
      const research = `/projects/${projectId}/research`;
      const goResearch = () => {
        if (!window.location.pathname.endsWith("/research")) router.push(research);
      };
      const key = event.key.toLowerCase();

      if (meta && key === "z") {
        event.preventDefault();
        if (event.shiftKey) store.redo();
        else store.undo();
      } else if (meta && key === "d") {
        event.preventDefault();
        store.duplicateSelected(projectId);
      } else if (event.key === "Escape") {
        store.clearSelection();
      } else if ((event.key === "Backspace" || event.key === "Delete") && store.selection.length) {
        event.preventDefault();
        store.deleteSelected(projectId);
      } else if (!meta && key === "n") {
        store.addSticky(projectId);
        goResearch();
      } else if (!meta && key === "i") {
        store.addInsight(projectId);
        goResearch();
      } else if (!meta && key === "q") {
        store.addQuote(projectId);
        goResearch();
      } else if (!meta && key === "c") {
        store.addCluster(projectId);
        goResearch();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  return null;
}
