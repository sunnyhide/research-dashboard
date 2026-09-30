import type { AIFinding, Confidence, FindingKind, Interview, Quote, StickyNote } from "../types";
import { nowIso, truncate, uid } from "../utils";

export interface AnalysisProgress {
  stage: number;
  total: number;
  label: string;
  detail: string;
}

export interface AnalyzeInput {
  projectId: string;
  sourceIds: string[];
  kinds: FindingKind[];
  existingTitles: string[];
  quotes: Quote[];
  notes: StickyNote[];
  themes: { id: string; name: string; description: string }[];
}

export interface GeneratedInsightDraft {
  title: string;
  description: string;
  confidence: Confidence;
  suggestedTheme: string;
  tags: string[];
}

/**
 * Analysis boundary. UI calls this client and never embeds model logic.
 * Replace `analysisClient` with an API-backed implementation later.
 */
export interface AnalysisClient {
  analyzeResearch(input: AnalyzeInput, onProgress?: (progress: AnalysisProgress) => void): Promise<AIFinding[]>;
  generateThemes(input: Pick<AnalyzeInput, "projectId" | "quotes" | "notes">): Promise<Array<{ name: string; description: string }>>;
  generateInsights(text: string, themes: { name: string }[]): Promise<GeneratedInsightDraft>;
  summarizeInterview(interview: Interview): Promise<string>;
}

const STAGES = [
  { label: "Analyzing research…", detail: "Reading participant responses" },
  { label: "Analyzing research…", detail: "Finding recurring patterns" },
  { label: "Analyzing research…", detail: "Comparing evidence" },
  { label: "Analyzing research…", detail: "Generating candidate insights" },
] as const;

const FOLLOW_UPS: Record<string, Array<Omit<AIFinding, "id" | "projectId" | "createdAt" | "updatedAt" | "x" | "y" | "onCanvas" | "status">>> = {
  "college-wellness": [
    {
      title: "What would a useful first week include if it never asked for a streak?",
      description: "Students describe value in one-minute check-ins and describe harm in broken streaks. A follow-up study should watch a week of use with tracking turned off.",
      kind: "question",
      confidence: "medium",
      suggestedTheme: "Motivation",
      quoteIds: ["q05", "q06"],
      participantIds: ["p05", "p08", "p04"],
      sourceIds: ["src-int-05", "src-int-08"],
      evidenceQuotes: 4,
      evidenceParticipants: 3,
      tags: ["motivation"],
      width: 280,
      height: 200,
      createdBy: "Insightboard",
    },
    {
      title: "Which audiences are students protecting mood data from?",
      description: "Parents, the university, professors, and future employers are named specifically. 'Privacy' is too broad to design against until those audiences are separated.",
      kind: "question",
      confidence: "high",
      suggestedTheme: "Privacy",
      quoteIds: ["q04", "q12"],
      participantIds: ["p02", "p07", "p05"],
      sourceIds: ["src-int-02"],
      evidenceQuotes: 5,
      evidenceParticipants: 3,
      tags: ["privacy"],
      width: 280,
      height: 200,
      createdBy: "Insightboard",
    },
    {
      title: "Exam weeks need a different session length, not a different persona",
      description: "The same students who will answer one prompt on an ordinary night reject goal-setting during exams. Context is the variable. Identity is not.",
      kind: "pattern",
      confidence: "medium",
      suggestedTheme: "Personalization",
      quoteIds: ["q15", "q07"],
      participantIds: ["p03", "p01", "p05"],
      sourceIds: ["src-int-03"],
      evidenceQuotes: 4,
      evidenceParticipants: 3,
      tags: ["personalization", "time"],
      width: 280,
      height: 200,
      createdBy: "Insightboard",
    },
  ],
  "remote-teams": [
    {
      title: "Which decisions are still safe to leave in a thread?",
      description: "Not every side conversation needs a ceremony. The open question is which decisions change someone else's work if they stay invisible.",
      kind: "question",
      confidence: "medium",
      suggestedTheme: "Context gaps",
      quoteIds: ["rq1"],
      participantIds: ["rp1", "rp2"],
      sourceIds: ["rs1"],
      evidenceQuotes: 2,
      evidenceParticipants: 2,
      tags: ["context"],
      width: 270,
      height: 190,
      createdBy: "Insightboard",
    },
  ],
  "checkout-study": [
    {
      title: "Does an early shipping range change completion, or only satisfaction?",
      description: "Participants say they would stay if the fee appeared sooner. The study has not yet measured whether showing a range on the product page changes payment completion.",
      kind: "question",
      confidence: "medium",
      suggestedTheme: "Shipping cost",
      quoteIds: ["cq1"],
      participantIds: ["cp1", "cp3"],
      sourceIds: ["cs2"],
      evidenceQuotes: 2,
      evidenceParticipants: 2,
      tags: ["shipping"],
      width: 270,
      height: 190,
      createdBy: "Insightboard",
    },
  ],
};

const SUMMARIES: Record<string, string> = {
  "int-01": "Maya stops using wellness apps when they ask for a journal before they offer any help. She wants a single control for a feeling, usually late at night, and treats longer onboarding as a reason to leave.",
  "int-02": "Jordan will not write an honest entry if the school, his parents, or a vague cloud policy might see it. He would record a single word if it stayed on his phone. University branding makes trust worse, not better.",
  "int-03": "Priya experienced generic advice as proof the product was not listening. She wants exam weeks remembered without a fresh explanation, and she reacts badly to clinical words like symptoms.",
  "int-04": "Alex deletes wellness tools that assign work at the moment of overwhelm. A one-minute check-in almost kept him, until a paywall appeared after he had started caring.",
  "int-05": "Sam describes streaks as a punishment during finals. Campus counseling links feel too institutional for a Tuesday night, and visible progress would turn the habit into a performance.",
  "int-06": "Elena wants plain language and refuses anything that sounds like a chart she would write at work. Morning notifications miss her entirely. A one-question check-in is the only format she says she would finish.",
  "int-07": "Chris liked sharing a check-in with his roommate until a streak made it competitive. He would consider one chosen person, with the ability to go quiet during exams without a failure notice.",
  "int-08": "Taylor's whole session is about two minutes after midnight. A specific story from another student helped. Expert tips did not. She is unsure whether voice notes are actually more private.",
};

function delay(ms: number) {
  const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return new Promise((resolve) => setTimeout(resolve, reduced ? 40 : ms));
}

function keywordTheme(text: string, themes: { name: string }[]) {
  const pairs: Array<[RegExp, string]> = [
    [/privacy|school|parent|cloud|employer/i, "Privacy"],
    [/minute|time|journal|question|night|morning|notification/i, "Time & Effort"],
    [/streak|motivat|competition|habit/i, "Motivation"],
    [/clinic|symptom|language|tone|diagnosis/i, "Emotional Support"],
    [/paywall|trust|campus|counsel/i, "Trust"],
    [/exam|housing|listen|generic|personal/i, "Personalization"],
    [/meeting|status|overlap/i, "Meeting load"],
    [/thread|document|decision/i, "Context gaps"],
    [/shipping|fee|delivery/i, "Shipping cost"],
    [/account|password|guest/i, "Account wall"],
    [/return|gift|reassur/i, "Reassurance"],
  ];
  const match = pairs.find(([pattern]) => pattern.test(text));
  if (match && themes.some((theme) => theme.name === match[1])) return match[1];
  return themes[0]?.name ?? "Unsorted";
}

export const analysisClient: AnalysisClient = {
  async analyzeResearch(input, onProgress) {
    for (let index = 0; index < STAGES.length; index += 1) {
      onProgress?.({ stage: index, total: STAGES.length, ...STAGES[index] });
      await delay(680);
    }

    const pool = FOLLOW_UPS[input.projectId] ?? [];
    const known = new Set(input.existingTitles.map((title) => title.toLowerCase()));
    const selected = new Set(input.kinds);
    const fresh = pool.filter((item) => selected.has(item.kind) && !known.has(item.title.toLowerCase()));

    if (fresh.length === 0 && selected.has("question")) {
      const quote = input.quotes[0];
      if (quote && !known.has("what should we ask next?")) {
        fresh.push({
          title: "What should we ask in the next round of research?",
          description: `Current evidence is concentrated in a few stories, including “${truncate(quote.text, 120)}” A follow-up should test whether that pattern holds beyond the people already interviewed.`,
          kind: "question",
          confidence: "low",
          suggestedTheme: input.themes[0]?.name ?? "Unsorted",
          quoteIds: [quote.id],
          participantIds: [quote.participantId],
          sourceIds: [quote.sourceId],
          evidenceQuotes: 1,
          evidenceParticipants: 1,
          tags: quote.tags,
          width: 280,
          height: 200,
          createdBy: "Insightboard",
        });
      }
    }

    const stamp = nowIso();
    return fresh.slice(0, 3).map((item, index) => ({
      ...item,
      id: uid("finding"),
      projectId: input.projectId,
      status: "pending" as const,
      onCanvas: true,
      x: 80 + index * 24,
      y: 80 + index * 24,
      createdAt: stamp,
      updatedAt: stamp,
    }));
  },

  async generateThemes(input) {
    await delay(400);
    const blobs = [...input.quotes.map((quote) => quote.text), ...input.notes.map((note) => note.text)];
    const names = [
      [/time|minute|long|quick/i, "Time & Effort", "Interactions that have to fit a short, tired moment."],
      [/privacy|trust|school|parent/i, "Privacy", "Concerns about who can see an honest entry."],
      [/streak|motivat/i, "Motivation", "What brings people back, and what makes them feel worse."],
      [/shipping|cost|fee/i, "Shipping cost", "When the price of delivery becomes the decision."],
      [/meeting|status/i, "Meeting load", "Shared time spent repeating written information."],
    ] as const;
    return names
      .filter(([pattern]) => blobs.some((text) => pattern.test(text)))
      .map(([, name, description]) => ({ name, description }));
  },

  async generateInsights(text, themes) {
    await delay(520);
    const suggestedTheme = keywordTheme(text, themes);
    const sentence = truncate(text, 90);
    return {
      title: sentence.length < 80 ? sentence : `Review this signal: ${sentence}`,
      description: `A highlighted passage suggests a candidate insight about ${suggestedTheme.toLowerCase()}. The participant said: “${truncate(text, 220)}” This is a suggestion. It needs more than one source before it should be treated as a finding.`,
      confidence: text.length > 80 ? "medium" : "low",
      suggestedTheme,
      tags: [suggestedTheme.toLowerCase().split(" ")[0]],
    };
  },

  async summarizeInterview(interview) {
    await delay(640);
    const written = SUMMARIES[interview.id];
    if (written) {
      return `${written} Draft summary · review before sharing.`;
    }
    const lines = interview.transcript.turns.filter((turn) => turn.speaker === "participant").slice(0, 2);
    const body = lines.map((turn) => turn.text).join(" ");
    return `${interview.title}: ${truncate(body, 320)} Draft summary · review before sharing.`;
  },
};
