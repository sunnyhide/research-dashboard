"use client";

import { useState } from "react";
import type { Persona } from "@/lib/types";
import { plural } from "@/lib/utils";
import { useWorkspaceStore } from "@/store/workspace";

export function PersonaCard({ projectId, persona }: { projectId: string; persona: Persona }) {
  const update = useWorkspaceStore((state) => state.updatePersona);
  const [editing, setEditing] = useState(false);
  return (
    <article className="rounded-md border border-line bg-canvas p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          {editing ? (
            <input value={persona.name} onChange={(event) => update(projectId, persona.id, { name: event.target.value })} aria-label="Persona name" className="h-8 rounded-md border border-line px-2 text-base font-medium" />
          ) : (
            <h2 className="text-base font-medium">{persona.name}</h2>
          )}
          {editing ? (
            <input value={persona.role} onChange={(event) => update(projectId, persona.id, { role: event.target.value })} aria-label="Persona role" className="mt-1 h-8 w-full rounded-md border border-line px-2 text-[13px]" />
          ) : (
            <p className="text-[13px] text-muted-ink">{persona.role}</p>
          )}
        </div>
        <button type="button" className="text-[12px] text-accent-ink" onClick={() => setEditing((value) => !value)}>{editing ? "Done" : "Edit"}</button>
      </div>
      {persona.generatedFromResearch ? <p className="mt-2 text-[11px] uppercase tracking-[0.12em] text-muted-ink">Generated from research</p> : null}
      <p className="mt-3 text-[13px] leading-relaxed">{persona.summary}</p>
      <List title="Goals" items={persona.goals} editing={editing} onChange={(goals) => update(projectId, persona.id, { goals })} />
      <List title="Frustrations" items={persona.frustrations} editing={editing} onChange={(frustrations) => update(projectId, persona.id, { frustrations })} />
      <List title="Behaviors" items={persona.behaviors} editing={editing} onChange={(behaviors) => update(projectId, persona.id, { behaviors })} />
      <p className="mt-4 text-[12px] text-muted-ink">{plural(persona.evidenceParticipants, "participant")} · {plural(persona.evidenceQuotes, "quote")}</p>
    </article>
  );
}

function List({ title, items, editing, onChange }: { title: string; items: string[]; editing: boolean; onChange: (items: string[]) => void }) {
  return (
    <section className="mt-4">
      <h3 className="text-[12px] font-medium uppercase tracking-[0.12em] text-muted-ink">{title}</h3>
      <ul className="mt-1 space-y-1">
        {items.map((item, index) => (
          <li key={`${title}-${index}`} className="text-[13px]">
            {editing ? (
              <input value={item} aria-label={`${title} ${index + 1}`} onChange={(event) => onChange(items.map((value, itemIndex) => itemIndex === index ? event.target.value : value))} className="h-8 w-full rounded-md border border-line px-2" />
            ) : (
              item
            )}
          </li>
        ))}
      </ul>
      {editing ? <button type="button" className="mt-1 text-[12px] text-accent-ink" onClick={() => onChange([...items, ""])}>Add</button> : null}
    </section>
  );
}
