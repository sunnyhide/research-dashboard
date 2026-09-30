"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";
import { Tooltip } from "@/components/ui/tooltip";
import { ACCENTS } from "@/lib/theme";
import type { AccentId, ThemeMode } from "@/lib/types";
import { cn } from "@/lib/utils";
import { usePreferencesStore } from "@/store/preferences";

const swatch: Record<AccentId, string> = {
  blue: "#2F6BED",
  purple: "#6A4FB3",
  green: "#2E7D57",
  orange: "#C96A2C",
  pink: "#C14B74",
  red: "#C44747",
};

export function ThemeToggle({ resolved }: { resolved: "light" | "dark" }) {
  const toggleMode = usePreferencesStore((state) => state.toggleMode);
  const label = resolved === "dark" ? "Switch to light" : "Switch to dark";
  const Icon = resolved === "dark" ? Sun : Moon;
  return (
    <Tooltip content={label}>
      <Button variant="ghost" size="icon" aria-label={label} onClick={toggleMode}>
        <Icon className="h-4 w-4" />
      </Button>
    </Tooltip>
  );
}

export function AccentColorPicker() {
  const accent = usePreferencesStore((state) => state.accent);
  const setAccent = usePreferencesStore((state) => state.setAccent);
  return (
    <Dropdown
      trigger={
        <Button variant="ghost" size="icon" aria-label={`Accent color: ${accent}`}>
          <span className="h-3.5 w-3.5 rounded-full" style={{ background: swatch[accent] }} />
        </Button>
      }
    >
      {ACCENTS.map((item) => (
        <DropdownItem key={item.id} onSelect={() => setAccent(item.id)}>
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: swatch[item.id] }} />
          <span className="flex-1">{item.label}</span>
          {accent === item.id ? <span className="text-[11px] text-muted-ink">Selected</span> : null}
        </DropdownItem>
      ))}
    </Dropdown>
  );
}

export function ThemeModePicker() {
  const mode = usePreferencesStore((state) => state.mode);
  const setMode = usePreferencesStore((state) => state.setMode);
  const options: { id: ThemeMode; label: string; icon: typeof Sun }[] = [
    { id: "light", label: "Light", icon: Sun },
    { id: "dark", label: "Dark", icon: Moon },
    { id: "system", label: "System", icon: Monitor },
  ];
  return (
    <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Theme">
      {options.map((option) => {
        const Icon = option.icon;
        const selected = mode === option.id;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => setMode(option.id)}
            className={cn(
              "flex h-16 flex-col items-center justify-center gap-1 rounded-md border text-[12px]",
              selected ? "border-accent bg-accent-soft text-accent-ink" : "border-line hover:bg-soft",
            )}
          >
            <Icon className="h-4 w-4" />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function AccentChoices() {
  const accent = usePreferencesStore((state) => state.accent);
  const setAccent = usePreferencesStore((state) => state.setAccent);
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Accent color">
      {ACCENTS.map((item) => {
        const selected = accent === item.id;
        return (
          <button
            key={item.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => setAccent(item.id)}
            className={cn(
              "flex h-10 items-center gap-2 rounded-md border px-2.5 text-[13px]",
              selected ? "border-accent bg-accent-soft text-accent-ink" : "border-line hover:bg-soft",
            )}
          >
            <span className="h-3 w-3 rounded-full" style={{ background: swatch[item.id] }} />
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
