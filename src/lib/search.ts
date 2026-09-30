import type { ProjectBundle, SearchResult } from "./types";
import { excerptAround } from "./utils";

export function searchWorkspace(bundles: ProjectBundle[], rawQuery: string): SearchResult[] {
  const query = rawQuery.trim().toLowerCase().replace(/^#/, "");
  if (!query) return [];
  const results: SearchResult[] = [];

  const hit = (value: string) => value.toLowerCase().includes(query);

  for (const bundle of bundles) {
    const { project } = bundle;
    const projectHref = `/projects/${project.id}`;
    if (hit(project.name) || hit(project.researchQuestion) || hit(project.description) || project.tags.some(hit)) {
      results.push({
        id: project.id,
        projectId: project.id,
        type: "Project",
        title: project.name,
        excerpt: excerptAround(project.researchQuestion, query),
        href: projectHref,
      });
    }

    for (const participant of bundle.participants) {
      if (hit(participant.name) || hit(participant.role) || hit(participant.detail) || hit(participant.code) || participant.tags.some(hit)) {
        results.push({
          id: participant.id,
          projectId: project.id,
          type: "Participant",
          title: `${participant.code} · ${participant.name}`,
          excerpt: excerptAround(`${participant.role}. ${participant.detail}`, query),
          href: `${projectHref}/interviews`,
        });
      }
    }

    for (const interview of bundle.interviews) {
      const blob = interview.transcript.turns.map((turn) => turn.text).join(" ");
      if (hit(interview.title) || hit(blob)) {
        results.push({
          id: interview.id,
          projectId: project.id,
          type: "Interview",
          title: interview.title,
          excerpt: excerptAround(blob, query),
          href: `${projectHref}/interviews/${interview.id}`,
        });
      }
    }

    for (const quote of bundle.quotes) {
      if (hit(quote.text) || quote.tags.some(hit)) {
        results.push({
          id: quote.id,
          projectId: project.id,
          type: "Quote",
          title: excerptAround(quote.text, query, 48),
          excerpt: excerptAround(quote.text, query),
          href: `${projectHref}/research`,
          focusId: quote.id,
        });
      }
    }

    for (const note of bundle.notes) {
      if (hit(note.title) || hit(note.body) || note.tags.some(hit)) {
        results.push({
          id: note.id,
          projectId: project.id,
          type: "Note",
          title: note.title,
          excerpt: excerptAround(note.body, query),
          href: `${projectHref}/notes`,
          focusId: note.id,
        });
      }
    }

    for (const insight of bundle.insights) {
      if (insight.status === "rejected") continue;
      if (hit(insight.title) || hit(insight.description) || insight.tags.some(hit)) {
        results.push({
          id: insight.id,
          projectId: project.id,
          type: "Insight",
          title: insight.title,
          excerpt: excerptAround(insight.description, query),
          href: `${projectHref}/insights/${insight.id}`,
        });
      }
    }

    for (const theme of bundle.themes) {
      if (hit(theme.name) || hit(theme.description)) {
        results.push({
          id: theme.id,
          projectId: project.id,
          type: "Theme",
          title: theme.name,
          excerpt: excerptAround(theme.description, query),
          href: `${projectHref}/research`,
          focusId: theme.id,
        });
      }
    }
  }

  const rank = { Project: 0, Insight: 1, Theme: 2, Quote: 3, Interview: 4, Note: 5, Participant: 6 };
  return results
    .sort((a, b) => rank[a.type] - rank[b.type])
    .slice(0, 24);
}
