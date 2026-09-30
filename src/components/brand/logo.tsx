import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className={cn("h-4 w-4", className)}>
      <rect x="1" y="1" width="6" height="6" rx="1.2" fill="currentColor" />
      <rect x="9" y="1" width="6" height="6" rx="1.2" fill="currentColor" opacity="0.45" />
      <rect x="1" y="9" width="6" height="6" rx="1.2" fill="currentColor" opacity="0.72" />
      <rect x="9" y="9" width="6" height="6" rx="1.2" fill="currentColor" opacity="0.28" />
    </svg>
  );
}

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 text-ink">
      <LogoMark />
      {compact ? null : <span className="text-[13px] font-medium tracking-tight">Insightboard</span>}
    </span>
  );
}
