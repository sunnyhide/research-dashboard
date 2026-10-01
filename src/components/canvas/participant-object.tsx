import type { Participant } from "@/lib/types";

export function ParticipantObject({ participant, selected }: { participant?: Participant; selected: boolean }) {
  return (
    <article className={`rounded-md border border-line bg-canvas px-3 py-2 shadow-card ${selected ? "outline outline-2 outline-offset-2 outline-accent" : ""}`}>
      <div className="text-[10px] uppercase tracking-[0.14em] text-muted-ink">Participant</div>
      <h3 className="text-[13px] font-medium">{participant?.name ?? "Unknown"}</h3>
      <p className="text-[12px] text-muted-ink">{participant ? `${participant.code} · ${participant.role}` : "Missing record"}</p>
    </article>
  );
}
