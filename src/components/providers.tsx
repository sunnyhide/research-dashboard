"use client";

import { useEffect, useState, type ReactNode } from "react";
import { CommandMenu } from "@/components/shell/command-menu";
import { Shortcuts } from "@/components/shell/shortcuts";
import { AppDialogs } from "@/components/shell/dialogs";
import { AnalysisModal } from "@/components/ai/analysis-modal";
import { Toaster } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { applyDocumentTheme } from "@/lib/theme";
import { usePreferencesStore } from "@/store/preferences";
import { useWorkspaceStore } from "@/store/workspace";

export function Providers({ children }: { children: ReactNode }) {
  const mode = usePreferencesStore((state) => state.mode);
  const accent = usePreferencesStore((state) => state.accent);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let pending = 0;
    const done = () => {
      pending += 1;
      if (pending >= 2) setReady(true);
    };
    const unsubWorkspace = useWorkspaceStore.persist.onFinishHydration(done);
    const unsubPrefs = usePreferencesStore.persist.onFinishHydration(done);
    if (useWorkspaceStore.persist.hasHydrated()) done();
    if (usePreferencesStore.persist.hasHydrated()) done();
    const timer = window.setTimeout(() => setReady(true), 500);
    return () => {
      unsubWorkspace();
      unsubPrefs();
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    applyDocumentTheme(mode, accent);
    if (mode !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyDocumentTheme("system", accent);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [mode, accent]);

  if (!ready) return <div className="min-h-screen bg-bg" />;

  return (
    <TooltipProvider>
      <Shortcuts />
      {children}
      <CommandMenu />
      <AppDialogs />
      <AnalysisModal />
      <Toaster />
    </TooltipProvider>
  );
}
