import type { StateStorage } from "zustand/middleware";
import type { ProjectBundle } from "./types";

/**
 * Aggregate the UI reads and writes. A remote implementation can replace
 * LocalResearchRepository without changing page components.
 */
export interface ResearchRepository {
  list(): Promise<Pick<ProjectBundle, "project">[]>;
  get(projectId: string): Promise<ProjectBundle | null>;
  save(bundle: ProjectBundle): Promise<void>;
}

/**
 * Debounced localStorage adapter used by the workspace store.
 * Swap this StateStorage for an API-backed cache when a database exists.
 */
export function createDebouncedStorage(delay = 200): StateStorage {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pending: { name: string; value: string } | null = null;

  const flush = () => {
    if (!pending || typeof window === "undefined") return;
    localStorage.setItem(pending.name, pending.value);
    pending = null;
  };

  if (typeof window !== "undefined") {
    window.addEventListener("pagehide", flush);
  }

  return {
    getItem: (name) => {
      if (typeof window === "undefined") return null;
      return localStorage.getItem(name);
    },
    setItem: (name, value) => {
      pending = { name, value };
      clearTimeout(timer);
      timer = setTimeout(flush, delay);
    },
    removeItem: (name) => {
      pending = null;
      if (typeof window === "undefined") return;
      localStorage.removeItem(name);
    },
  };
}

export const WORKSPACE_STORAGE_KEY = "insightboard-workspace";
export const PREFS_STORAGE_KEY = "insightboard-prefs";
