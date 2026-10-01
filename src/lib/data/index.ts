import type { FindingKind, ProjectBundle, ResearchKind } from "../types";
import { nowIso, uid } from "../utils";
import { AUTHOR } from "./build";
import { checkoutBundle } from "./checkout";
import { remoteBundle } from "./remote";
import { wellnessBundle } from "./wellness";

export const seedBundles: ProjectBundle[] = [wellnessBundle, remoteBundle, checkoutBundle];

export const seedCanvas: Record<string, { x: number; y: number; zoom: number }> = {
  "college-wellness": { x: 24, y: 16, zoom: 0.86 },
  "remote-teams": { x: 24, y: 16, zoom: 0.9 },
  "checkout-study": { x: 24, y: 16, zoom: 0.92 },
};

export function createEmptyBundle(input: {
  name: string;
  researchType: ResearchKind;
  researchQuestion: string;
  createdBy?: string;
}): ProjectBundle {
  const id = uid("project");
  const stamp = nowIso();
  const createdBy = input.createdBy || AUTHOR;
  return {
    project: {
      id,
      name: input.name.trim() || "Untitled project",
      researchType: input.researchType,
      researchQuestion: input.researchQuestion.trim(),
      description: "",
      createdAt: stamp,
      updatedAt: stamp,
      createdBy,
      tags: [],
    },
    participants: [],
    sources: [],
    interviews: [],
    quotes: [],
    stickies: [],
    insights: [],
    themes: [],
    findings: [],
    analyses: [],
    personas: [],
    notes: [],
    cards: [],
    survey: [],
    tests: [],
  };
}

export function cloneSeed(): Record<string, ProjectBundle> {
  return Object.fromEntries(structuredClone(seedBundles).map((bundle) => [bundle.project.id, bundle]));
}

export const FINDING_KIND_LABEL: Record<FindingKind, string> = {
  theme: "Theme",
  "pain-point": "Pain point",
  pattern: "Behavioral pattern",
  question: "Research question",
};
