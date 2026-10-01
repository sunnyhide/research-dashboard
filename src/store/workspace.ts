"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { canvasBoxes, themeAtPoint } from "@/lib/canvas";
import { cloneSeed, createEmptyBundle, seedBundles, seedCanvas } from "@/lib/data";
import { createDebouncedStorage, WORKSPACE_STORAGE_KEY } from "@/lib/repository";
import type {
  AIFinding,
  CanvasFilter,
  CanvasView,
  ClusterColor,
  Confidence,
  Insight,
  InsightStatus,
  NoteKind,
  Persona,
  ProjectBundle,
  ProjectFolder,
  Quote,
  ResearchKind,
  ResearchNote,
  ResearchSource,
  SourceType,
  StickyColor,
  StickyNote,
  Theme,
} from "@/lib/types";
import { nowIso, uid } from "@/lib/utils";
import { usePreferencesStore } from "./preferences";

interface Snapshot {
  projects: Record<string, ProjectBundle>;
}

interface ToastItem {
  id: string;
  message: string;
}

interface WorkspaceState {
  projects: Record<string, ProjectBundle>;
  order: string[];
  folders: ProjectFolder[];
  canvas: Record<string, CanvasView>;
  selection: string[];
  filter: CanvasFilter;
  sidebarCollapsed: boolean;
  inspectorOpen: boolean;
  toasts: ToastItem[];
  past: Snapshot[];
  future: Snapshot[];
  commandOpen: boolean;
  commandQuery: string;
  analysisOpen: boolean;
  analysisView: "setup" | "review";
  helpOpen: boolean;
  shareOpen: boolean;
  newProjectOpen: boolean;
  newProjectFolderId: string | null;
  editingId: string | null;
  pendingFocusId: string | null;
  viewport: { width: number; height: number };
  toast: (message: string) => void;
  dismissToast: (id: string) => void;
  select: (ids: string[], mode?: "replace" | "add" | "toggle") => void;
  clearSelection: () => void;
  setCanvas: (projectId: string, view: Partial<CanvasView>) => void;
  setFilter: (filter: CanvasFilter) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  setInspectorOpen: (open: boolean) => void;
  setCommandOpen: (open: boolean, query?: string) => void;
  setAnalysisOpen: (open: boolean, view?: "setup" | "review") => void;
  setHelpOpen: (open: boolean) => void;
  setShareOpen: (open: boolean) => void;
  setNewProjectOpen: (open: boolean, folderId?: string | null) => void;
  setEditingId: (id: string | null) => void;
  setPendingFocusId: (id: string | null) => void;
  setViewport: (viewport: { width: number; height: number }) => void;
  beginHistory: () => void;
  undo: () => void;
  redo: () => void;
  updatePositions: (projectId: string, updates: { id: string; x: number; y: number }[]) => void;
  updateSize: (projectId: string, id: string, size: { width?: number; height?: number }) => void;
  reassignClusters: (projectId: string, ids: string[]) => void;
  addSticky: (projectId: string, partial?: Partial<StickyNote>) => string | null;
  updateSticky: (projectId: string, id: string, patch: Partial<StickyNote>, history?: boolean) => void;
  addQuote: (projectId: string, partial?: Partial<Quote>) => string | null;
  updateQuote: (projectId: string, id: string, patch: Partial<Quote>, history?: boolean) => void;
  addInsight: (projectId: string, partial?: Partial<Insight>) => string | null;
  updateInsight: (projectId: string, id: string, patch: Partial<Insight>, history?: boolean) => void;
  addCluster: (projectId: string, partial?: Partial<Theme>) => string | null;
  updateCluster: (projectId: string, id: string, patch: Partial<Theme>, history?: boolean) => void;
  addParticipantCard: (projectId: string, participantId: string) => string | null;
  deleteIds: (projectId: string, ids: string[]) => void;
  deleteSelected: (projectId: string) => void;
  duplicateIds: (projectId: string, ids: string[]) => void;
  duplicateSelected: (projectId: string) => void;
  acceptFinding: (projectId: string, id: string) => void;
  rejectFinding: (projectId: string, id: string) => void;
  updateFinding: (projectId: string, id: string, patch: Partial<AIFinding>, history?: boolean) => void;
  mergeFindings: (projectId: string, ids: string[]) => void;
  addFindings: (projectId: string, findings: AIFinding[]) => void;
  addNote: (projectId: string, partial?: Partial<ResearchNote>) => string | null;
  addUploadedFiles: (projectId: string, files: { name: string; text: string; type: SourceType }[]) => void;
  updateNote: (projectId: string, id: string, patch: Partial<ResearchNote>) => void;
  deleteNote: (projectId: string, id: string) => void;
  updatePersona: (projectId: string, id: string, patch: Partial<Persona>) => void;
  createProject: (input: { name: string; researchType: ResearchKind; researchQuestion: string; folderId?: string | null }) => string;
  createFolder: (name: string) => string;
  createFolderWithProjects: (name: string, projectIds: string[]) => string;
  renameFolder: (id: string, name: string) => void;
  deleteFolder: (id: string) => void;
  moveProjectToFolder: (projectId: string, folderId: string | null) => void;
  resetWorkspace: () => void;
  focusObject: (projectId: string, id: string) => void;
  linkQuote: (projectId: string, insightId: string, quoteId: string) => void;
  unlinkQuote: (projectId: string, insightId: string, quoteId: string) => void;
  addResearcherNote: (projectId: string, insightId: string, text: string) => void;
}

function snapshotOf(projects: Record<string, ProjectBundle>): Snapshot {
  return { projects: structuredClone(projects) };
}

function centerOf(projectId: string, state: WorkspaceState) {
  const view = state.canvas[projectId] ?? { x: 48, y: 48, zoom: 1 };
  const width = state.viewport.width || 1200;
  const height = state.viewport.height || 800;
  return {
    x: (width / 2 - view.x) / view.zoom - 110,
    y: (height / 2 - view.y) / view.zoom - 80,
  };
}

function author() {
  return usePreferencesStore.getState().profile.name || "Isabella Reyes";
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      projects: cloneSeed(),
      order: seedBundles.map((bundle) => bundle.project.id),
      folders: [],
      canvas: { ...seedCanvas },
      selection: [],
      filter: "all",
      sidebarCollapsed: false,
      inspectorOpen: true,
      toasts: [],
      past: [],
      future: [],
      commandOpen: false,
      commandQuery: "",
      analysisOpen: false,
      analysisView: "setup",
      helpOpen: false,
      shareOpen: false,
      newProjectOpen: false,
      newProjectFolderId: null,
      editingId: null,
      pendingFocusId: null,
      viewport: { width: 1280, height: 800 },

      toast: (message) => {
        const id = uid("toast");
        set((state) => ({ toasts: [...state.toasts, { id, message }].slice(-3) }));
        window.setTimeout(() => get().dismissToast(id), 2800);
      },
      dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
      select: (ids, mode = "replace") =>
        set((state) => {
          if (mode === "replace") return { selection: ids };
          const current = new Set(state.selection);
          for (const id of ids) {
            if (mode === "toggle" && current.has(id)) current.delete(id);
            else current.add(id);
          }
          return { selection: [...current] };
        }),
      clearSelection: () => set({ selection: [], editingId: null }),
      setCanvas: (projectId, view) =>
        set((state) => ({
          canvas: { ...state.canvas, [projectId]: { ...(state.canvas[projectId] ?? { x: 24, y: 16, zoom: 0.9 }), ...view } },
        })),
      setFilter: (filter) => set({ filter }),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setInspectorOpen: (inspectorOpen) => set({ inspectorOpen }),
      setCommandOpen: (commandOpen, query) => set({ commandOpen, commandQuery: query ?? (commandOpen ? get().commandQuery : "") }),
      setAnalysisOpen: (analysisOpen, view = "setup") => set({ analysisOpen, analysisView: analysisOpen ? view : "setup" }),
      setHelpOpen: (helpOpen) => set({ helpOpen }),
      setShareOpen: (shareOpen) => set({ shareOpen }),
      setNewProjectOpen: (newProjectOpen, folderId = null) =>
        set({ newProjectOpen, newProjectFolderId: newProjectOpen ? folderId : null }),
      setEditingId: (editingId) => set({ editingId }),
      setPendingFocusId: (pendingFocusId) => set({ pendingFocusId }),
      setViewport: (viewport) => set({ viewport }),
      beginHistory: () => {
        const state = get();
        set({ past: [...state.past, snapshotOf(state.projects)].slice(-40), future: [] });
      },
      undo: () => {
        const state = get();
        const previous = state.past.at(-1);
        if (!previous) return;
        set({
          projects: previous.projects,
          past: state.past.slice(0, -1),
          future: [...state.future, snapshotOf(state.projects)],
        });
        get().toast("Undone");
      },
      redo: () => {
        const state = get();
        const next = state.future.at(-1);
        if (!next) return;
        set({
          projects: next.projects,
          future: state.future.slice(0, -1),
          past: [...state.past, snapshotOf(state.projects)].slice(-40),
        });
        get().toast("Redone");
      },
      updatePositions: (projectId, updates) =>
        set((state) => {
          const bundle = state.projects[projectId];
          if (!bundle || !updates.length) return state;
          const map = new Map(updates.map((update) => [update.id, update]));
          const move = <T extends { id: string; x: number; y: number }>(list: T[]) =>
            list.map((item) => {
              const next = map.get(item.id);
              return next ? { ...item, x: next.x, y: next.y } : item;
            });
          return {
            projects: {
              ...state.projects,
              [projectId]: {
                ...bundle,
                themes: move(bundle.themes),
                stickies: move(bundle.stickies),
                quotes: move(bundle.quotes),
                insights: move(bundle.insights),
                findings: move(bundle.findings),
                cards: move(bundle.cards),
              },
            },
          };
        }),
      updateSize: (projectId, id, size) =>
        set((state) => {
          const bundle = state.projects[projectId];
          if (!bundle) return state;
          const apply = <T extends { id: string; width: number; height: number }>(list: T[]) =>
            list.map((item) => (item.id === id ? { ...item, ...size } : item));
          return {
            projects: {
              ...state.projects,
              [projectId]: {
                ...bundle,
                themes: apply(bundle.themes),
                stickies: apply(bundle.stickies),
                quotes: apply(bundle.quotes),
                insights: apply(bundle.insights),
                findings: apply(bundle.findings),
                cards: apply(bundle.cards),
              },
            },
          };
        }),
      reassignClusters: (projectId, ids) =>
        set((state) => {
          const bundle = state.projects[projectId];
          if (!bundle) return state;
          const movingThemes = ids.some((id) => bundle.themes.some((theme) => theme.id === id));
          if (movingThemes) return state;
          const boxes = canvasBoxes(bundle);
          const assign = <T extends { id: string; x: number; y: number; width: number; height: number; clusterId?: string }>(list: T[]) =>
            list.map((item) => {
              if (!ids.includes(item.id)) return item;
              const clusterId = themeAtPoint(bundle.themes, item.x, item.y, item.width, item.height);
              return { ...item, clusterId };
            });
          void boxes;
          return {
            projects: {
              ...state.projects,
              [projectId]: {
                ...bundle,
                stickies: assign(bundle.stickies),
                quotes: assign(bundle.quotes),
                insights: assign(bundle.insights),
                findings: assign(bundle.findings),
                cards: assign(bundle.cards),
              },
            },
          };
        }),
      addSticky: (projectId, partial) => {
        const state = get();
        const bundle = state.projects[projectId];
        if (!bundle) return null;
        state.beginHistory();
        const spot = centerOf(projectId, get());
        const stamp = nowIso();
        const id = uid("sticky");
        const sticky: StickyNote = {
          id,
          projectId,
          text: "",
          author: author(),
          color: "yellow",
          tags: [],
          x: spot.x,
          y: spot.y,
          width: 200,
          height: 140,
          createdAt: stamp,
          updatedAt: stamp,
          createdBy: author(),
          ...partial,
        };
        set((current) => {
          const next = current.projects[projectId];
          if (!next) return current;
          return {
            projects: { ...current.projects, [projectId]: { ...next, stickies: [...next.stickies, sticky], project: { ...next.project, updatedAt: stamp } } },
            selection: [id],
            editingId: id,
            inspectorOpen: true,
          };
        });
        get().toast("Sticky note created");
        return id;
      },
      updateSticky: (projectId, id, patch, history = false) => {
        if (history) get().beginHistory();
        set((state) => {
          const bundle = state.projects[projectId];
          if (!bundle) return state;
          return {
            projects: {
              ...state.projects,
              [projectId]: { ...bundle, stickies: bundle.stickies.map((item) => (item.id === id ? { ...item, ...patch, updatedAt: nowIso() } : item)) },
            },
          };
        });
      },
      addQuote: (projectId, partial) => {
        const state = get();
        if (!state.projects[projectId]) return null;
        state.beginHistory();
        const spot = centerOf(projectId, get());
        const stamp = nowIso();
        const id = uid("quote");
        const quote: Quote = {
          id,
          projectId,
          text: partial?.text ?? "",
          participantId: partial?.participantId ?? state.projects[projectId].participants[0]?.id ?? "",
          sourceId: partial?.sourceId ?? "",
          tags: partial?.tags ?? [],
          x: partial?.x ?? spot.x,
          y: partial?.y ?? spot.y,
          width: 230,
          height: 160,
          createdAt: stamp,
          updatedAt: stamp,
          createdBy: author(),
          ...partial,
        };
        set((current) => {
          const bundle = current.projects[projectId];
          if (!bundle) return current;
          return {
            projects: { ...current.projects, [projectId]: { ...bundle, quotes: [...bundle.quotes, quote], project: { ...bundle.project, updatedAt: stamp } } },
            selection: [id],
            editingId: partial?.text ? null : id,
            inspectorOpen: true,
          };
        });
        get().toast("Quote added to canvas");
        return id;
      },
      updateQuote: (projectId, id, patch, history = false) => {
        if (history) get().beginHistory();
        set((state) => {
          const bundle = state.projects[projectId];
          if (!bundle) return state;
          return {
            projects: {
              ...state.projects,
              [projectId]: { ...bundle, quotes: bundle.quotes.map((item) => (item.id === id ? { ...item, ...patch, updatedAt: nowIso() } : item)) },
            },
          };
        });
      },
      addInsight: (projectId, partial) => {
        const state = get();
        const bundle = state.projects[projectId];
        if (!bundle) return null;
        state.beginHistory();
        const spot = centerOf(projectId, get());
        const stamp = nowIso();
        const id = uid("insight");
        const status = partial?.status ?? usePreferencesStore.getState().defaultInsightStatus;
        const insight: Insight = {
          id,
          projectId,
          title: partial?.title ?? "Untitled insight",
          description: partial?.description ?? "",
          status,
          confidence: partial?.confidence ?? "medium",
          themeIds: partial?.themeIds ?? [],
          quoteIds: partial?.quoteIds ?? [],
          participantIds: partial?.participantIds ?? [],
          sourceIds: partial?.sourceIds ?? [],
          tags: partial?.tags ?? [],
          evidenceQuotes: partial?.evidenceQuotes ?? partial?.quoteIds?.length ?? 0,
          evidenceParticipants: partial?.evidenceParticipants ?? partial?.participantIds?.length ?? 0,
          aiGenerated: partial?.aiGenerated ?? false,
          researcherNotes: partial?.researcherNotes ?? [],
          x: partial?.x ?? spot.x,
          y: partial?.y ?? spot.y,
          width: 280,
          height: 190,
          onCanvas: partial?.onCanvas ?? true,
          clusterId: partial?.clusterId,
          createdAt: stamp,
          updatedAt: stamp,
          createdBy: author(),
        };
        set((current) => {
          const next = current.projects[projectId];
          if (!next) return current;
          return {
            projects: { ...current.projects, [projectId]: { ...next, insights: [...next.insights, insight], project: { ...next.project, updatedAt: stamp } } },
            selection: [id],
            pendingFocusId: id,
            inspectorOpen: true,
          };
        });
        get().toast(insight.aiGenerated ? "Insight needs review" : "Insight created");
        return id;
      },
      updateInsight: (projectId, id, patch, history = false) => {
        if (history) get().beginHistory();
        set((state) => {
          const bundle = state.projects[projectId];
          if (!bundle) return state;
          return {
            projects: {
              ...state.projects,
              [projectId]: {
                ...bundle,
                insights: bundle.insights.map((item) => (item.id === id ? { ...item, ...patch, updatedAt: nowIso() } : item)),
                project: patch.status ? { ...bundle.project, updatedAt: nowIso() } : bundle.project,
              },
            },
          };
        });
      },
      addCluster: (projectId, partial) => {
        const state = get();
        if (!state.projects[projectId]) return null;
        state.beginHistory();
        const spot = centerOf(projectId, get());
        const stamp = nowIso();
        const id = uid("theme");
        const colors: ClusterColor[] = ["sand", "sage", "slate", "mist", "rose", "clay"];
        const theme: Theme = {
          id,
          projectId,
          name: partial?.name ?? "Untitled cluster",
          description: partial?.description ?? "Group related evidence, notes, and candidate insights.",
          color: partial?.color ?? colors[get().projects[projectId].themes.length % colors.length],
          x: partial?.x ?? spot.x - 40,
          y: partial?.y ?? spot.y - 30,
          width: partial?.width ?? 460,
          height: partial?.height ?? 320,
          collapsed: false,
          createdAt: stamp,
          updatedAt: stamp,
          createdBy: author(),
          tags: [],
        };
        set((current) => {
          const bundle = current.projects[projectId];
          if (!bundle) return current;
          return {
            projects: { ...current.projects, [projectId]: { ...bundle, themes: [...bundle.themes, theme], project: { ...bundle.project, updatedAt: stamp } } },
            selection: [id],
            pendingFocusId: id,
            inspectorOpen: true,
          };
        });
        get().toast("Cluster created");
        return id;
      },
      updateCluster: (projectId, id, patch, history = false) => {
        if (history) get().beginHistory();
        set((state) => {
          const bundle = state.projects[projectId];
          if (!bundle) return state;
          return {
            projects: {
              ...state.projects,
              [projectId]: { ...bundle, themes: bundle.themes.map((item) => (item.id === id ? { ...item, ...patch, updatedAt: nowIso() } : item)) },
            },
          };
        });
      },
      addParticipantCard: (projectId, participantId) => {
        const state = get();
        const bundle = state.projects[projectId];
        if (!bundle) return null;
        state.beginHistory();
        const spot = centerOf(projectId, get());
        const stamp = nowIso();
        const id = uid("card");
        set((current) => {
          const next = current.projects[projectId];
          if (!next) return current;
          return {
            projects: {
              ...current.projects,
              [projectId]: {
                ...next,
                cards: [...next.cards, { id, projectId, participantId, x: spot.x, y: spot.y, width: 200, height: 92, createdAt: stamp, updatedAt: stamp, createdBy: author() }],
                project: { ...next.project, updatedAt: stamp },
              },
            },
            selection: [id],
            inspectorOpen: true,
          };
        });
        get().toast("Participant added to canvas");
        return id;
      },
      deleteIds: (projectId, ids) => {
        if (!ids.length) return;
        const state = get();
        const bundle = state.projects[projectId];
        if (!bundle) return;
        state.beginHistory();
        const drop = new Set(ids);
        set((current) => {
          const next = current.projects[projectId];
          if (!next) return current;
          const stamp = nowIso();
          return {
            projects: {
              ...current.projects,
              [projectId]: {
                ...next,
                themes: next.themes.filter((item) => !drop.has(item.id)),
                stickies: next.stickies.filter((item) => !drop.has(item.id)).map((item) => (item.clusterId && drop.has(item.clusterId) ? { ...item, clusterId: undefined } : item)),
                quotes: next.quotes.filter((item) => !drop.has(item.id)).map((item) => (item.clusterId && drop.has(item.clusterId) ? { ...item, clusterId: undefined } : item)),
                insights: next.insights
                  .filter((item) => !drop.has(item.id))
                  .map((item) => ({
                    ...item,
                    clusterId: item.clusterId && drop.has(item.clusterId) ? undefined : item.clusterId,
                    quoteIds: item.quoteIds.filter((quoteId) => !drop.has(quoteId)),
                  })),
                findings: next.findings.filter((item) => !drop.has(item.id)).map((item) => (item.clusterId && drop.has(item.clusterId) ? { ...item, clusterId: undefined } : item)),
                cards: next.cards.filter((item) => !drop.has(item.id)),
                project: { ...next.project, updatedAt: stamp },
              },
            },
            selection: current.selection.filter((id) => !drop.has(id)),
            editingId: current.editingId && drop.has(current.editingId) ? null : current.editingId,
          };
        });
        get().toast("Deleted");
      },
      deleteSelected: (projectId) => get().deleteIds(projectId, get().selection),
      duplicateIds: (projectId, ids) => {
        if (!ids.length) return;
        const state = get();
        const bundle = state.projects[projectId];
        if (!bundle) return;
        state.beginHistory();
        const stamp = nowIso();
        const created: string[] = [];
        const clone = <T extends { id: string; x: number; y: number }>(item: T, prefix: string): T => {
          const id = uid(prefix);
          created.push(id);
          return { ...structuredClone(item), id, x: item.x + 28, y: item.y + 28, createdAt: stamp, updatedAt: stamp };
        };
        const idSet = new Set(ids);
        set((current) => {
          const next = current.projects[projectId];
          if (!next) return current;
          return {
            projects: {
              ...current.projects,
              [projectId]: {
                ...next,
                themes: [...next.themes, ...next.themes.filter((item) => idSet.has(item.id)).map((item) => clone(item, "theme"))],
                stickies: [...next.stickies, ...next.stickies.filter((item) => idSet.has(item.id)).map((item) => clone(item, "sticky"))],
                quotes: [...next.quotes, ...next.quotes.filter((item) => idSet.has(item.id)).map((item) => clone(item, "quote"))],
                insights: [...next.insights, ...next.insights.filter((item) => idSet.has(item.id)).map((item) => clone(item, "insight"))],
                findings: [...next.findings, ...next.findings.filter((item) => idSet.has(item.id)).map((item) => clone(item, "finding"))],
                cards: [...next.cards, ...next.cards.filter((item) => idSet.has(item.id)).map((item) => clone(item, "card"))],
                project: { ...next.project, updatedAt: stamp },
              },
            },
            selection: created,
          };
        });
        get().toast("Duplicated");
      },
      duplicateSelected: (projectId) => get().duplicateIds(projectId, get().selection),
      acceptFinding: (projectId, id) => {
        const bundle = get().projects[projectId];
        const finding = bundle?.findings.find((item) => item.id === id);
        if (!bundle || !finding || finding.status === "accepted") return;
        get().beginHistory();
        const stamp = nowIso();
        const theme = bundle.themes.find((item) => item.name === finding.suggestedTheme);
        const insight: Insight = {
          id: uid("insight"),
          projectId,
          title: finding.title,
          description: finding.description,
          status: "needs-review",
          confidence: finding.confidence,
          themeIds: theme ? [theme.id] : [],
          quoteIds: [...finding.quoteIds],
          participantIds: [...finding.participantIds],
          sourceIds: [...finding.sourceIds],
          tags: [...finding.tags],
          evidenceQuotes: finding.evidenceQuotes,
          evidenceParticipants: finding.evidenceParticipants,
          aiGenerated: true,
          researcherNotes: [],
          x: finding.x,
          y: finding.y,
          width: Math.max(finding.width, 280),
          height: finding.height,
          onCanvas: true,
          clusterId: finding.clusterId,
          createdAt: stamp,
          updatedAt: stamp,
          createdBy: author(),
        };
        set((state) => {
          const next = state.projects[projectId];
          if (!next) return state;
          return {
            projects: {
              ...state.projects,
              [projectId]: {
                ...next,
                insights: [...next.insights, insight],
                findings: next.findings.map((item) => (item.id === id ? { ...item, status: "accepted" as const, onCanvas: false, updatedAt: stamp } : item)),
                project: { ...next.project, updatedAt: stamp },
              },
            },
            selection: [insight.id],
          };
        });
        get().toast("Insight accepted");
      },
      rejectFinding: (projectId, id) => {
        get().beginHistory();
        set((state) => {
          const bundle = state.projects[projectId];
          if (!bundle) return state;
          const stamp = nowIso();
          return {
            projects: {
              ...state.projects,
              [projectId]: {
                ...bundle,
                findings: bundle.findings.map((item) => (item.id === id ? { ...item, status: "rejected" as const, onCanvas: false, updatedAt: stamp } : item)),
              },
            },
            selection: state.selection.filter((selected) => selected !== id),
          };
        });
        get().toast("Insight rejected");
      },
      updateFinding: (projectId, id, patch, history = false) => {
        if (history) get().beginHistory();
        set((state) => {
          const bundle = state.projects[projectId];
          if (!bundle) return state;
          return {
            projects: {
              ...state.projects,
              [projectId]: { ...bundle, findings: bundle.findings.map((item) => (item.id === id ? { ...item, ...patch, updatedAt: nowIso() } : item)) },
            },
          };
        });
      },
      mergeFindings: (projectId, ids) => {
        const bundle = get().projects[projectId];
        if (!bundle) return;
        const chosen = bundle.findings.filter((item) => ids.includes(item.id) && item.status === "pending");
        if (chosen.length < 2) return;
        get().beginHistory();
        const stamp = nowIso();
        const [first] = chosen;
        const merged: AIFinding = {
          ...structuredClone(first),
          id: uid("finding"),
          title: first.title,
          description: chosen.map((item) => item.description).join("\n\n"),
          quoteIds: [...new Set(chosen.flatMap((item) => item.quoteIds))],
          participantIds: [...new Set(chosen.flatMap((item) => item.participantIds))],
          sourceIds: [...new Set(chosen.flatMap((item) => item.sourceIds))],
          evidenceQuotes: chosen.reduce((sum, item) => sum + item.evidenceQuotes, 0),
          evidenceParticipants: new Set(chosen.flatMap((item) => item.participantIds)).size,
          tags: [...new Set(chosen.flatMap((item) => item.tags))],
          confidence: chosen.some((item) => item.confidence === "low") ? "low" : first.confidence,
          status: "pending",
          onCanvas: true,
          createdAt: stamp,
          updatedAt: stamp,
        };
        const retire = new Set(chosen.map((item) => item.id));
        set((state) => {
          const next = state.projects[projectId];
          if (!next) return state;
          return {
            projects: {
              ...state.projects,
              [projectId]: {
                ...next,
                findings: [...next.findings.map((item) => (retire.has(item.id) ? { ...item, status: "rejected" as const, onCanvas: false, updatedAt: stamp } : item)), merged],
              },
            },
          };
        });
        get().toast("Findings merged");
      },
      addFindings: (projectId, findings) => {
        if (!findings.length) return;
        const state = get();
        const bundle = state.projects[projectId];
        if (!bundle) return;
        state.beginHistory();
        const spot = centerOf(projectId, get());
        const placed = findings.map((finding, index) => ({
          ...finding,
          x: spot.x + index * 28,
          y: spot.y + index * 24,
          onCanvas: true,
          status: "pending" as const,
        }));
        set((current) => {
          const next = current.projects[projectId];
          if (!next) return current;
          return {
            projects: {
              ...current.projects,
              [projectId]: { ...next, findings: [...next.findings, ...placed], project: { ...next.project, updatedAt: nowIso() } },
            },
          };
        });
      },
      addNote: (projectId, partial) => {
        const bundle = get().projects[projectId];
        if (!bundle) return null;
        get().beginHistory();
        const stamp = nowIso();
        const id = uid("note");
        const note: ResearchNote = {
          id,
          projectId,
          kind: partial?.kind ?? "text",
          title: partial?.title ?? "Untitled note",
          body: partial?.body ?? "",
          participantId: partial?.participantId,
          interviewId: partial?.interviewId,
          insightId: partial?.insightId,
          themeId: partial?.themeId,
          tags: partial?.tags ?? [],
          createdAt: stamp,
          updatedAt: stamp,
          createdBy: author(),
        };
        set((state) => {
          const next = state.projects[projectId];
          if (!next) return state;
          return { projects: { ...state.projects, [projectId]: { ...next, notes: [note, ...next.notes] } } };
        });
        get().toast("Note created");
        return id;
      },
      addUploadedFiles: (projectId, files) => {
        if (!files.length || !get().projects[projectId]) return;
        get().beginHistory();
        const stamp = nowIso();
        const who = author();
        const sources: ResearchSource[] = [];
        const notes: ResearchNote[] = [];
        for (const file of files) {
          const sourceId = uid("src");
          const body = file.text.trim();
          sources.push({
            id: sourceId,
            projectId,
            type: file.type,
            title: file.name,
            date: stamp.slice(0, 10),
            participantIds: [],
            createdAt: stamp,
            updatedAt: stamp,
            createdBy: who,
            tags: ["upload"],
          });
          notes.push({
            id: uid("note"),
            projectId,
            kind: file.type === "interview" ? "quote" : "text",
            title: file.name,
            body: body ? body.slice(0, 12000) : "File added. Text could not be read from this format, so only the file name is stored with the project.",
            tags: ["upload"],
            createdAt: stamp,
            updatedAt: stamp,
            createdBy: who,
          });
        }
        set((state) => {
          const next = state.projects[projectId];
          if (!next) return state;
          return {
            projects: {
              ...state.projects,
              [projectId]: {
                ...next,
                sources: [...sources, ...next.sources],
                notes: [...notes, ...next.notes],
                project: { ...next.project, updatedAt: stamp },
              },
            },
          };
        });
        get().toast(files.length === 1 ? "File uploaded" : `${files.length} files uploaded`);
      },
      updateNote: (projectId, id, patch) =>
        set((state) => {
          const bundle = state.projects[projectId];
          if (!bundle) return state;
          return {
            projects: {
              ...state.projects,
              [projectId]: { ...bundle, notes: bundle.notes.map((note) => (note.id === id ? { ...note, ...patch, updatedAt: nowIso() } : note)) },
            },
          };
        }),
      deleteNote: (projectId, id) => {
        get().beginHistory();
        set((state) => {
          const bundle = state.projects[projectId];
          if (!bundle) return state;
          return { projects: { ...state.projects, [projectId]: { ...bundle, notes: bundle.notes.filter((note) => note.id !== id) } } };
        });
        get().toast("Note deleted");
      },
      updatePersona: (projectId, id, patch) =>
        set((state) => {
          const bundle = state.projects[projectId];
          if (!bundle) return state;
          return {
            projects: {
              ...state.projects,
              [projectId]: { ...bundle, personas: bundle.personas.map((persona) => (persona.id === id ? { ...persona, ...patch, updatedAt: nowIso() } : persona)) },
            },
          };
        }),
      createProject: (input) => {
        const bundle = createEmptyBundle({ ...input, createdBy: author() });
        const folderId = input.folderId !== undefined ? input.folderId : get().newProjectFolderId;
        if (folderId && get().folders.some((folder) => folder.id === folderId)) bundle.project.folderId = folderId;
        set((state) => ({
          projects: { ...state.projects, [bundle.project.id]: bundle },
          order: [bundle.project.id, ...state.order],
          canvas: { ...state.canvas, [bundle.project.id]: { x: 48, y: 48, zoom: 1 } },
          newProjectOpen: false,
          newProjectFolderId: null,
        }));
        get().toast("Project created");
        return bundle.project.id;
      },
      createFolder: (name) => {
        const clean = name.trim();
        if (!clean) return "";
        const stamp = nowIso();
        const folder: ProjectFolder = { id: uid("folder"), name: clean, createdAt: stamp, updatedAt: stamp };
        set((state) => ({ folders: [...state.folders, folder] }));
        get().toast("Folder created");
        return folder.id;
      },
      createFolderWithProjects: (name, projectIds) => {
        const clean = name.trim();
        const ids = [...new Set(projectIds)].filter((id) => get().projects[id]);
        if (!clean || ids.length < 2) return "";
        const stamp = nowIso();
        const folder: ProjectFolder = { id: uid("folder"), name: clean, createdAt: stamp, updatedAt: stamp };
        set((state) => ({
          folders: [...state.folders, folder],
          projects: Object.fromEntries(
            Object.entries(state.projects).map(([projectId, bundle]) => [
              projectId,
              ids.includes(projectId) ? { ...bundle, project: { ...bundle.project, folderId: folder.id } } : bundle,
            ]),
          ),
        }));
        get().toast("Folder created");
        return folder.id;
      },
      renameFolder: (id, name) => {
        const clean = name.trim();
        if (!clean) return;
        set((state) => ({
          folders: state.folders.map((folder) => (folder.id === id ? { ...folder, name: clean, updatedAt: nowIso() } : folder)),
        }));
        get().toast("Folder renamed");
      },
      deleteFolder: (id) => {
        set((state) => ({
          folders: state.folders.filter((folder) => folder.id !== id),
          projects: Object.fromEntries(
            Object.entries(state.projects).map(([projectId, bundle]) => [
              projectId,
              bundle.project.folderId === id ? { ...bundle, project: { ...bundle.project, folderId: null } } : bundle,
            ]),
          ),
        }));
        get().toast("Folder deleted. Projects were kept.");
      },
      moveProjectToFolder: (projectId, folderId) => {
        const bundle = get().projects[projectId];
        if (!bundle) return;
        const nextFolder = folderId && get().folders.some((folder) => folder.id === folderId) ? folderId : null;
        if ((bundle.project.folderId ?? null) === nextFolder) return;
        set((state) => {
          const current = state.projects[projectId];
          if (!current) return state;
          return {
            projects: {
              ...state.projects,
              [projectId]: { ...current, project: { ...current.project, folderId: nextFolder } },
            },
          };
        });
        const folder = nextFolder ? get().folders.find((item) => item.id === nextFolder) : undefined;
        get().toast(folder ? `Moved to ${folder.name}` : "Removed from folder");
      },
      resetWorkspace: () => {
        set({
          projects: cloneSeed(),
          order: seedBundles.map((bundle) => bundle.project.id),
          folders: [],
          canvas: { ...seedCanvas },
          selection: [],
          past: [],
          future: [],
        });
        get().toast("Sample workspace restored");
      },
      focusObject: (projectId, id) => {
        const bundle = get().projects[projectId];
        const box = bundle ? canvasBoxes(bundle).find((item) => item.id === id) : undefined;
        const viewport = get().viewport;
        const zoom = get().canvas[projectId]?.zoom ?? 0.9;
        if (box) {
          get().setCanvas(projectId, {
            zoom,
            x: viewport.width / 2 - (box.x + box.width / 2) * zoom,
            y: viewport.height / 2 - (box.y + box.height / 2) * zoom,
          });
        }
        set({ selection: [id], inspectorOpen: true });
      },
      linkQuote: (projectId, insightId, quoteId) => {
        get().beginHistory();
        set((state) => {
          const bundle = state.projects[projectId];
          if (!bundle) return state;
          return {
            projects: {
              ...state.projects,
              [projectId]: {
                ...bundle,
                insights: bundle.insights.map((insight) => {
                  if (insight.id !== insightId || insight.quoteIds.includes(quoteId)) return insight;
                  const quote = bundle.quotes.find((item) => item.id === quoteId);
                  const participantIds = quote && !insight.participantIds.includes(quote.participantId) ? [...insight.participantIds, quote.participantId] : insight.participantIds;
                  return {
                    ...insight,
                    quoteIds: [...insight.quoteIds, quoteId],
                    participantIds,
                    evidenceQuotes: Math.max(insight.evidenceQuotes, insight.quoteIds.length + 1),
                    evidenceParticipants: participantIds.length,
                    updatedAt: nowIso(),
                  };
                }),
              },
            },
          };
        });
        get().toast("Evidence added");
      },
      unlinkQuote: (projectId, insightId, quoteId) => {
        get().beginHistory();
        set((state) => {
          const bundle = state.projects[projectId];
          if (!bundle) return state;
          return {
            projects: {
              ...state.projects,
              [projectId]: {
                ...bundle,
                insights: bundle.insights.map((insight) =>
                  insight.id === insightId ? { ...insight, quoteIds: insight.quoteIds.filter((id) => id !== quoteId), updatedAt: nowIso() } : insight,
                ),
              },
            },
          };
        });
        get().toast("Evidence removed");
      },
      addResearcherNote: (projectId, insightId, text) => {
        const clean = text.trim();
        if (!clean) return;
        get().beginHistory();
        set((state) => {
          const bundle = state.projects[projectId];
          if (!bundle) return state;
          return {
            projects: {
              ...state.projects,
              [projectId]: {
                ...bundle,
                insights: bundle.insights.map((insight) =>
                  insight.id === insightId ? { ...insight, researcherNotes: [...insight.researcherNotes, clean], updatedAt: nowIso() } : insight,
                ),
              },
            },
          };
        });
        get().toast("Changes saved");
      },
    }),
    {
      name: WORKSPACE_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => createDebouncedStorage()),
      partialize: (state) => ({ projects: state.projects, order: state.order, folders: state.folders, canvas: state.canvas }),
    },
  ),
);

export function useProject(projectId: string) {
  return useWorkspaceStore((state) => state.projects[projectId]);
}

export type { Confidence, InsightStatus, NoteKind, StickyColor };
