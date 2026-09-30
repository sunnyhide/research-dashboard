"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AIInsightReview } from "@/components/ai/insight-review";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { analysisClient, type AnalysisProgress } from "@/lib/ai/client";
import type { FindingKind } from "@/lib/types";
import { usePreferencesStore } from "@/store/preferences";
import { useWorkspaceStore } from "@/store/workspace";

export function AnalysisModal() {
  const open = useWorkspaceStore((state) => state.analysisOpen);
  const view = useWorkspaceStore((state) => state.analysisView);
  const setOpen = useWorkspaceStore((state) => state.setAnalysisOpen);
  const pathname = usePathname();
  const order = useWorkspaceStore((state) => state.order);
  const projectId = pathname.match(/^\/projects\/([^/]+)/)?.[1] ?? order[0];
  const bundle = useWorkspaceStore((state) => (projectId ? state.projects[projectId] : undefined));
  const prefs = usePreferencesStore((state) => state.analysis);
  const addFindings = useWorkspaceStore((state) => state.addFindings);
  const toast = useWorkspaceStore((state) => state.toast);
  const [step, setStep] = useState<"sources" | "kinds" | "progress" | "review">("sources");
  const [sources, setSources] = useState<string[]>([]);
  const [kinds, setKinds] = useState<FindingKind[]>([]);
  const [progress, setProgress] = useState<AnalysisProgress | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!open || !projectId) return;
    const current = useWorkspaceStore.getState().projects[projectId];
    const analysis = usePreferencesStore.getState().analysis;
    if (!current) return;
    setStep(view === "review" ? "review" : "sources");
    setSources(current.sources.map((source) => source.id));
    setKinds([
      analysis.themes ? "theme" : null,
      analysis.painPoints ? "pain-point" : null,
      analysis.patterns ? "pattern" : null,
      analysis.questions ? "question" : null,
    ].filter((item): item is FindingKind => Boolean(item)));
  }, [open, view, projectId]);

  if (!projectId || !bundle) return null;

  const kindOptions: { id: FindingKind; label: string }[] = [
    { id: "theme", label: "Identify themes" },
    { id: "pain-point", label: "Identify pain points" },
    { id: "pattern", label: "Identify behavioral patterns" },
    { id: "question", label: "Generate research questions" },
  ];

  async function run() {
    setStep("progress");
    const findings = await analysisClient.analyzeResearch(
      {
        projectId,
        sourceIds: sources,
        kinds,
        existingTitles: bundle!.findings.map((finding) => finding.title),
        quotes: bundle!.quotes,
        notes: bundle!.stickies,
        themes: bundle!.themes.map((theme) => ({ id: theme.id, name: theme.name, description: theme.description })),
      },
      setProgress,
    );
    if (findings.length) addFindings(projectId, findings);
    toast("Research analysis complete");
    setStep("review");
  }

  return (
    <Modal
      open={open}
      onOpenChange={setOpen}
      title={step === "review" ? "AI Research Findings" : "Analyze research"}
      description={step === "review" ? "Review these findings before adding them to your research synthesis." : "AI proposes. You decide what becomes an insight."}
      className="w-[min(760px,calc(100%-2rem))]"
    >
      {step === "sources" ? (
        <div>
          <p className="text-[12px] uppercase tracking-[0.14em] text-muted-ink">Step 1 · Sources</p>
          <ul className="mt-3 space-y-2">
            {bundle.sources.map((source) => (
              <li key={source.id}>
                <label className="flex items-center gap-2 text-[13px]">
                  <input type="checkbox" checked={sources.includes(source.id)} onChange={(event) => setSources((current) => event.target.checked ? [...current, source.id] : current.filter((id) => id !== source.id))} />
                  {source.title}
                </label>
              </li>
            ))}
            {bundle.sources.length === 0 ? <li className="text-[13px] text-muted-ink">No research uploaded. Add interviews or notes before running analysis.</li> : null}
          </ul>
          <div className="mt-4 flex justify-end">
            <Button variant="primary" disabled={!sources.length} onClick={() => setStep("kinds")}>Continue</Button>
          </div>
        </div>
      ) : null}
      {step === "kinds" ? (
        <div>
          <p className="text-[12px] uppercase tracking-[0.14em] text-muted-ink">Step 2 · Analysis</p>
          <ul className="mt-3 space-y-2">
            {kindOptions.map((option) => (
              <li key={option.id}>
                <label className="flex items-center gap-2 text-[13px]">
                  <input type="checkbox" checked={kinds.includes(option.id)} onChange={(event) => setKinds((current) => event.target.checked ? [...current, option.id] : current.filter((id) => id !== option.id))} />
                  {option.label}
                </label>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between">
            <Button onClick={() => setStep("sources")}>Back</Button>
            <Button variant="primary" disabled={!kinds.length} onClick={run}>Analyze research</Button>
          </div>
        </div>
      ) : null}
      {step === "progress" && progress ? (
        <div className="py-6">
          <p className="text-sm font-medium">{progress.label}</p>
          <ol className="mt-4 space-y-2">
            {["Reading participant responses", "Finding recurring patterns", "Comparing evidence", "Generating candidate insights"].map((detail, index) => (
              <li key={detail} className={index === progress.stage ? "text-[13px] text-ink" : index < progress.stage ? "text-[13px] text-muted-ink" : "text-[13px] text-muted-ink/50"}>
                <AnimatePresence mode="wait">
                  <motion.span key={`${detail}-${index <= progress.stage}`} initial={reduce ? false : { opacity: 0.4 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
                    {index < progress.stage ? "Done · " : index === progress.stage ? "Now · " : ""}{detail}
                  </motion.span>
                </AnimatePresence>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
      {step === "review" ? <AIInsightReview projectId={projectId} /> : null}
    </Modal>
  );
}
