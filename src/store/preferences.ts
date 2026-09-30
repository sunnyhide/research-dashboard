"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AccentId, InsightStatus, ThemeMode } from "@/lib/types";
import { PREFS_STORAGE_KEY } from "@/lib/repository";

export interface PreferencesState {
  mode: ThemeMode;
  accent: AccentId;
  showGrid: boolean;
  snap: boolean;
  showMinimap: boolean;
  defaultInsightStatus: Extract<InsightStatus, "draft" | "needs-review">;
  analysis: {
    themes: boolean;
    painPoints: boolean;
    patterns: boolean;
    questions: boolean;
  };
  profile: {
    name: string;
    email: string;
    role: string;
    notifications: {
      analysis: boolean;
      mentions: boolean;
      weekly: boolean;
    };
  };
  setMode: (mode: ThemeMode) => void;
  setAccent: (accent: AccentId) => void;
  cycleAccent: () => void;
  toggleMode: () => void;
  updateCanvas: (patch: Partial<Pick<PreferencesState, "showGrid" | "snap" | "showMinimap">>) => void;
  updateAnalysis: (patch: Partial<PreferencesState["analysis"]>) => void;
  setDefaultInsightStatus: (status: PreferencesState["defaultInsightStatus"]) => void;
  updateProfile: (patch: Partial<Omit<PreferencesState["profile"], "notifications">>) => void;
  updateNotifications: (patch: Partial<PreferencesState["profile"]["notifications"]>) => void;
}

const accents: AccentId[] = ["blue", "purple", "green", "orange", "pink", "red"];

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set, get) => ({
      mode: "light",
      accent: "blue",
      showGrid: true,
      snap: true,
      showMinimap: true,
      defaultInsightStatus: "needs-review",
      analysis: { themes: true, painPoints: true, patterns: true, questions: true },
      profile: {
        name: "Isabella Reyes",
        email: "isabella.reyes@northline.studio",
        role: "UX Researcher",
        notifications: { analysis: true, mentions: false, weekly: true },
      },
      setMode: (mode) => set({ mode }),
      setAccent: (accent) => set({ accent }),
      cycleAccent: () => {
        const current = accents.indexOf(get().accent);
        set({ accent: accents[(current + 1) % accents.length] });
      },
      toggleMode: () => set({ mode: get().mode === "dark" ? "light" : "dark" }),
      updateCanvas: (patch) => set(patch),
      updateAnalysis: (patch) => set({ analysis: { ...get().analysis, ...patch } }),
      setDefaultInsightStatus: (defaultInsightStatus) => set({ defaultInsightStatus }),
      updateProfile: (patch) => set({ profile: { ...get().profile, ...patch } }),
      updateNotifications: (patch) =>
        set({ profile: { ...get().profile, notifications: { ...get().profile.notifications, ...patch } } }),
    }),
    { name: PREFS_STORAGE_KEY, version: 1 },
  ),
);
