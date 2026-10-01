import type { AccentId, ThemeMode } from "./types";

export const ACCENTS: { id: AccentId; label: string }[] = [
  { id: "blue", label: "Blue" },
  { id: "purple", label: "Purple" },
  { id: "green", label: "Green" },
  { id: "orange", label: "Orange" },
  { id: "pink", label: "Pink" },
  { id: "red", label: "Red" },
];

export const STICKY_COLORS: { id: import("./types").StickyColor; label: string }[] = [
  { id: "yellow", label: "Yellow" },
  { id: "blue", label: "Blue" },
  { id: "green", label: "Green" },
  { id: "pink", label: "Pink" },
  { id: "orange", label: "Orange" },
  { id: "purple", label: "Purple" },
  { id: "gray", label: "Gray" },
];

export const CLUSTER_COLORS: { id: import("./types").ClusterColor; label: string }[] = [
  { id: "sand", label: "Sand" },
  { id: "sage", label: "Sage" },
  { id: "slate", label: "Slate" },
  { id: "mist", label: "Mist" },
  { id: "rose", label: "Rose" },
  { id: "clay", label: "Clay" },
];

export function resolveTheme(mode: ThemeMode) {
  if (typeof window === "undefined") return mode === "dark" ? "dark" : "light";
  if (mode === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return mode;
}

export function applyDocumentTheme(mode: ThemeMode, accent: AccentId) {
  if (typeof document === "undefined") return;
  const resolved = resolveTheme(mode);
  document.documentElement.classList.toggle("dark", resolved === "dark");
  document.documentElement.dataset.theme = resolved;
  document.documentElement.dataset.accent = accent;
  document.documentElement.style.colorScheme = resolved;
}

export const STATUS_LABEL = {
  validated: "Validated",
  "ai-suggested": "AI suggested",
  "needs-review": "Needs review",
  rejected: "Rejected",
  draft: "Draft",
} as const;

export const CONFIDENCE_LABEL = {
  low: "Low",
  medium: "Medium",
  high: "High",
} as const;
