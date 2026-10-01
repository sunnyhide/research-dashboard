"use client";

import { useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ResearchCanvas } from "@/components/canvas/research-canvas";
import { ResearchInspector } from "@/components/inspector/research-inspector";
import { PersonaCard } from "@/components/personas/persona-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { AccentChoices, ThemeModePicker } from "@/components/theme/theme-controls";
import type { NoteKind } from "@/lib/types";
import { plural } from "@/lib/utils";
import { usePreferencesStore } from "@/store/preferences";
import { useWorkspaceStore } from "@/store/workspace";

export function ResearchView({ projectId }: { projectId: string }) {
  const bundle = useWorkspaceStore((state) => state.projects[projectId]);
  const inspectorOpen = useWorkspaceStore((state) => state.inspectorOpen);
  const setInspectorOpen = useWorkspaceStore((state) => state.setInspectorOpen);
  const [tab, setTab] = useState<"notes" | "quotes" | "findings">("notes");
  if (!bundle) return null;
  return (
    <div className="flex h-full min-h-0">
      <div className="relative hidden h-full min-w-0 flex-1 md:block">
        <ResearchCanvas projectId={projectId} />
        {!inspectorOpen ? <button type="button" className="absolute right-3 top-3 z-30 rounded-md border border-line bg-canvas px-2 py-1 text-[12px]" onClick={() => setInspectorOpen(true)}>Inspector</button> : null}
      </div>
      {inspectorOpen ? (
        <div className="absolute inset-y-0 right-0 z-40 hidden h-full md:block lg:static">
          <ResearchInspector projectId={projectId} />
        </div>
      ) : null}
      <div className="h-full w-full overflow-y-auto md:hidden">
        <div className="flex gap-2 px-4 pt-4">
          {(["notes", "quotes", "findings"] as const).map((item) => (
            <button key={item} type="button" onClick={() => setTab(item)} className={`h-7 rounded-md px-2 text-[12px] capitalize ${tab === item ? "bg-accent-soft text-accent-ink" : "text-muted-ink"}`}>{item}</button>
          ))}
        </div>
        <ul className="space-y-3 px-4 py-4">
          {tab === "notes" ? bundle.stickies.map((note) => <li key={note.id} className="rounded-md border border-line bg-canvas p-3 text-[13px]">{note.text}</li>) : null}
          {tab === "quotes" ? bundle.quotes.map((quote) => <li key={quote.id} className="rounded-md border border-line bg-canvas p-3 font-serif text-[14px] italic">“{quote.text}”</li>) : null}
          {tab === "findings" ? bundle.findings.filter((finding) => finding.status === "pending").map((finding) => <li key={finding.id} className="rounded-md border border-line bg-canvas p-3 text-[13px]">{finding.title}</li>) : null}
        </ul>
      </div>
    </div>
  );
}

export function PersonasView({ projectId }: { projectId: string }) {
  const bundle = useWorkspaceStore((state) => state.projects[projectId]);
  if (!bundle) return null;
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="text-xl font-medium tracking-tight">Personas</h1>
        <p className="mt-1 text-[13px] text-muted-ink">Composites drawn from the study. Edit anything that overreaches the evidence.</p>
        {bundle.personas.length === 0 ? <EmptyState title="No personas yet" body="Personas appear after there is enough evidence to describe a recurring person, not a single interview." /> : (
          <div className="mt-5 grid gap-4 lg:grid-cols-2">{bundle.personas.map((persona) => <PersonaCard key={persona.id} projectId={projectId} persona={persona} />)}</div>
        )}
      </div>
    </div>
  );
}

export function NotesView({ projectId }: { projectId: string }) {
  const bundle = useWorkspaceStore((state) => state.projects[projectId]);
  const addNote = useWorkspaceStore((state) => state.addNote);
  const deleteNote = useWorkspaceStore((state) => state.deleteNote);
  const [kind, setKind] = useState<NoteKind>("text");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [participantId, setParticipantId] = useState("");
  const [interviewId, setInterviewId] = useState("");
  const [insightId, setInsightId] = useState("");
  const [themeId, setThemeId] = useState("");
  if (!bundle) return null;
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="text-xl font-medium tracking-tight">Research notes</h1>
        <p className="mt-1 text-[13px] text-muted-ink">Text notes, sticky notes, quotes, and questions. Link them to the study.</p>
        <form className="mt-5 space-y-2 rounded-md border border-line bg-canvas p-3" onSubmit={(event) => { event.preventDefault(); addNote(projectId, { kind, title, body, participantId: participantId || undefined, interviewId: interviewId || undefined, insightId: insightId || undefined, themeId: themeId || undefined }); setTitle(""); setBody(""); }}>
          <div className="flex gap-2">
            <select aria-label="Note type" value={kind} onChange={(event) => setKind(event.target.value as NoteKind)} className="h-8 rounded-md border border-line px-2 text-[13px]">
              <option value="text">Text</option>
              <option value="sticky">Sticky</option>
              <option value="quote">Quote</option>
              <option value="question">Question</option>
            </select>
            <input required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Title" aria-label="Note title" className="h-8 min-w-0 flex-1 rounded-md border border-line px-2 text-[13px]" />
          </div>
          <textarea required value={body} onChange={(event) => setBody(event.target.value)} placeholder="Note" aria-label="Note body" rows={3} className="w-full rounded-md border border-line px-2 py-1.5 text-[13px]" />
          <div className="grid gap-2 sm:grid-cols-2">
            <select aria-label="Participant" value={participantId} onChange={(event) => setParticipantId(event.target.value)} className="h-8 rounded-md border border-line px-2 text-[13px]"><option value="">Participant</option>{bundle.participants.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select>
            <select aria-label="Interview" value={interviewId} onChange={(event) => setInterviewId(event.target.value)} className="h-8 rounded-md border border-line px-2 text-[13px]"><option value="">Interview</option>{bundle.interviews.map((interview) => <option key={interview.id} value={interview.id}>{interview.title}</option>)}</select>
            <select aria-label="Insight" value={insightId} onChange={(event) => setInsightId(event.target.value)} className="h-8 rounded-md border border-line px-2 text-[13px]"><option value="">Insight</option>{bundle.insights.map((insight) => <option key={insight.id} value={insight.id}>{insight.title}</option>)}</select>
            <select aria-label="Theme" value={themeId} onChange={(event) => setThemeId(event.target.value)} className="h-8 rounded-md border border-line px-2 text-[13px]"><option value="">Theme</option>{bundle.themes.map((theme) => <option key={theme.id} value={theme.id}>{theme.name}</option>)}</select>
          </div>
          <Button type="submit" variant="primary">Add note</Button>
        </form>
        {bundle.notes.length === 0 ? <EmptyState title="No research notes" body="Add interviews, surveys, or research notes to begin synthesizing." /> : (
          <ul className="mt-5 divide-y divide-line border-y border-line">
            {bundle.notes.map((item) => (
              <li key={item.id} className="py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.12em] text-muted-ink">{item.kind}</p>
                    <h2 className="text-[14px] font-medium">{item.title}</h2>
                    <p className="mt-1 text-[13px] text-muted-ink">{item.body}</p>
                  </div>
                  <button type="button" className="text-[12px] text-danger" onClick={() => deleteNote(projectId, item.id)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function SurveysView({ projectId }: { projectId: string }) {
  const bundle = useWorkspaceStore((state) => state.projects[projectId]);
  if (!bundle) return null;
  if (!bundle.survey.length) return <EmptyState title="No research uploaded" body="Add interviews, surveys, or research notes to begin synthesizing." />;
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <h1 className="text-xl font-medium tracking-tight">Surveys</h1>
        <p className="mt-1 text-[13px] text-muted-ink">{plural(bundle.sources.find((source) => source.type === "survey") ? bundle.participants.length : 0, "participant")} in the latest survey sample.</p>
        <div className="mt-6 space-y-6">
          {bundle.survey.map((question) => (
            <section key={question.id} className="rounded-md border border-line bg-canvas p-4">
              <h2 className="text-sm font-medium">{question.prompt}</h2>
              <div className="mt-3 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={question.responses} layout="vertical" margin={{ left: 16 }}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="label" width={120} tick={{ fontSize: 12, fill: "var(--text-secondary)" }} />
                    <Tooltip contentStyle={{ background: "var(--canvas)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12 }} />
                    <Bar dataKey="value" fill="var(--accent)" radius={[0, 2, 2, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

export function UsabilityView({ projectId }: { projectId: string }) {
  const bundle = useWorkspaceStore((state) => state.projects[projectId]);
  if (!bundle) return null;
  if (!bundle.tests.length) return <EmptyState title="No usability tests" body="Session notes will show up here once a test is added to the study." />;
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="text-xl font-medium tracking-tight">Usability tests</h1>
        <ul className="mt-5 space-y-4">
          {bundle.tests.map((test) => (
            <li key={test.id} className="rounded-md border border-line bg-canvas p-4">
              <h2 className="text-sm font-medium">{test.title}</h2>
              <p className="mt-1 text-[12px] text-muted-ink">{test.date} · {plural(test.participants, "participant")}</p>
              <p className="mt-2 text-[13px] leading-relaxed">{test.summary}</p>
              <ul className="mt-3 list-disc space-y-1 pl-4 text-[13px] text-muted-ink">{test.findings.map((finding) => <li key={finding}>{finding}</li>)}</ul>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function ReportsView({ projectId }: { projectId: string }) {
  const bundle = useWorkspaceStore((state) => state.projects[projectId]);
  const toast = useWorkspaceStore((state) => state.toast);
  if (!bundle) return null;
  const validated = bundle.insights.filter((insight) => insight.status === "validated");
  const text = [
    bundle.project.name,
    bundle.project.researchQuestion,
    "",
    ...validated.map((insight, index) => `${index + 1}. ${insight.title}\n${insight.description}\n${insight.evidenceQuotes} quotes · ${insight.evidenceParticipants} participants`),
    "",
    "Candidate insights were proposed by an analysis assistant and accepted only after researcher review.",
  ].join("\n");
  return (
    <div className="h-full overflow-y-auto">
      <article className="mx-auto max-w-3xl px-6 py-8">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[12px] uppercase tracking-[0.14em] text-muted-ink">Synthesis report</p>
            <h1 className="mt-1 text-xl font-medium tracking-tight">{bundle.project.name}</h1>
          </div>
          <Button onClick={async () => { await navigator.clipboard.writeText(text); toast("Changes saved"); }}>Copy summary</Button>
        </div>
        <p className="mt-4 text-[15px] leading-relaxed">{bundle.project.researchQuestion}</p>
        <p className="mt-2 text-[13px] text-muted-ink">{bundle.project.description}</p>
        <h2 className="mt-8 text-sm font-medium">Validated findings</h2>
        {validated.length === 0 ? <p className="mt-2 text-[13px] text-muted-ink">No validated insights yet.</p> : (
          <ol className="mt-3 space-y-4">
            {validated.map((insight) => (
              <li key={insight.id}>
                <h3 className="text-[15px] font-medium">{insight.title}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-muted-ink">{insight.description}</p>
                <p className="mt-1 text-[12px] text-muted-ink">{insight.evidenceQuotes} supporting quotes · {insight.evidenceParticipants} participants</p>
              </li>
            ))}
          </ol>
        )}
        <p className="mt-8 border-t border-line pt-4 text-[13px] text-muted-ink">Candidate insights were proposed by an analysis assistant and accepted only after researcher review.</p>
      </article>
    </div>
  );
}

export function SettingsView({ projectId }: { projectId: string }) {
  const showGrid = usePreferencesStore((state) => state.showGrid);
  const snap = usePreferencesStore((state) => state.snap);
  const showMinimap = usePreferencesStore((state) => state.showMinimap);
  const updateCanvas = usePreferencesStore((state) => state.updateCanvas);
  const analysis = usePreferencesStore((state) => state.analysis);
  const updateAnalysis = usePreferencesStore((state) => state.updateAnalysis);
  const status = usePreferencesStore((state) => state.defaultInsightStatus);
  const setStatus = usePreferencesStore((state) => state.setDefaultInsightStatus);
  const profile = usePreferencesStore((state) => state.profile);
  const updateProfile = usePreferencesStore((state) => state.updateProfile);
  const updateNotifications = usePreferencesStore((state) => state.updateNotifications);
  const reset = useWorkspaceStore((state) => state.resetWorkspace);
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-2xl space-y-8 px-6 py-8">
        <div>
          <h1 className="text-xl font-medium tracking-tight">Settings</h1>
          <p className="mt-1 text-[13px] text-muted-ink">Appearance, canvas, and how AI suggestions enter the study.</p>
        </div>
        <section>
          <h2 className="text-sm font-medium">Appearance</h2>
          <div className="mt-3"><ThemeModePicker /></div>
          <h3 className="mb-2 mt-4 text-[13px] text-muted-ink">Accent color</h3>
          <AccentChoices />
        </section>
        <section className="space-y-2">
          <h2 className="text-sm font-medium">Canvas</h2>
          <Toggle label="Show grid" checked={showGrid} onChange={(checked) => updateCanvas({ showGrid: checked })} />
          <Toggle label="Snap objects" checked={snap} onChange={(checked) => updateCanvas({ snap: checked })} />
          <Toggle label="Show minimap" checked={showMinimap} onChange={(checked) => updateCanvas({ showMinimap: checked })} />
        </section>
        <section className="space-y-2">
          <h2 className="text-sm font-medium">Research</h2>
          <label className="block text-[13px]">
            Default insight status
            <select value={status} onChange={(event) => setStatus(event.target.value as "draft" | "needs-review")} className="mt-1 h-8 w-full rounded-md border border-line bg-canvas px-2">
              <option value="needs-review">Needs review</option>
              <option value="draft">Draft</option>
            </select>
          </label>
          <Toggle label="Identify themes" checked={analysis.themes} onChange={(checked) => updateAnalysis({ themes: checked })} />
          <Toggle label="Identify pain points" checked={analysis.painPoints} onChange={(checked) => updateAnalysis({ painPoints: checked })} />
          <Toggle label="Identify behavioral patterns" checked={analysis.patterns} onChange={(checked) => updateAnalysis({ patterns: checked })} />
          <Toggle label="Generate research questions" checked={analysis.questions} onChange={(checked) => updateAnalysis({ questions: checked })} />
        </section>
        <section className="space-y-2">
          <h2 className="text-sm font-medium">Account</h2>
          <label className="block text-[13px]">Profile<input value={profile.name} onChange={(event) => updateProfile({ name: event.target.value })} className="mt-1 h-8 w-full rounded-md border border-line px-2" /></label>
          <label className="block text-[13px]">Email<input type="email" value={profile.email} onChange={(event) => updateProfile({ email: event.target.value })} className="mt-1 h-8 w-full rounded-md border border-line px-2" /></label>
          <Toggle label="Analysis notifications" checked={profile.notifications.analysis} onChange={(checked) => updateNotifications({ analysis: checked })} />
          <Toggle label="Mentions" checked={profile.notifications.mentions} onChange={(checked) => updateNotifications({ mentions: checked })} />
          <Toggle label="Weekly digest" checked={profile.notifications.weekly} onChange={(checked) => updateNotifications({ weekly: checked })} />
        </section>
        <section>
          <h2 className="text-sm font-medium">Sample data</h2>
          <p className="mt-1 text-[13px] text-muted-ink">Restore the College Wellness, remote team, and checkout studies.</p>
          <Button className="mt-3" onClick={reset}>Restore sample workspace</Button>
          <p className="mt-2 text-[11px] text-muted-ink">Project id {projectId}</p>
        </section>
      </div>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-md border border-line bg-canvas px-3 py-2 text-[13px]">
      {label}
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}
