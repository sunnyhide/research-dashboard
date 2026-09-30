export type AccentId = "blue" | "purple" | "green" | "orange" | "pink" | "red";
export type ThemeMode = "light" | "dark" | "system";
export type ResearchKind = "Discovery" | "Usability" | "Survey" | "Mixed methods";
export type SourceType = "interview" | "survey" | "usability" | "note";
export type StickyColor = "yellow" | "blue" | "green" | "pink" | "orange" | "purple" | "gray";
export type ClusterColor = "sand" | "sage" | "slate" | "mist" | "rose" | "clay";
export type InsightStatus = "validated" | "ai-suggested" | "needs-review" | "rejected" | "draft";
export type Confidence = "low" | "medium" | "high";
export type FindingStatus = "pending" | "accepted" | "rejected";
export type FindingKind = "theme" | "pain-point" | "pattern" | "question";
export type NoteKind = "text" | "sticky" | "quote" | "question";
export type CanvasFilter = "all" | "clusters" | "stickies" | "findings";
export type Speaker = "researcher" | "participant";

export interface Project {
  id: string;
  name: string;
  researchType: ResearchKind;
  researchQuestion: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  tags: string[];
}

export interface Participant {
  id: string;
  projectId: string;
  name: string;
  code: string;
  role: string;
  detail: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  tags: string[];
}

export interface ResearchSource {
  id: string;
  projectId: string;
  type: SourceType;
  title: string;
  date: string;
  participantIds: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  tags: string[];
}

export interface TranscriptTurn {
  id: string;
  speaker: Speaker;
  text: string;
}

export interface Transcript {
  id: string;
  projectId: string;
  interviewId: string;
  turns: TranscriptTurn[];
  createdAt: string;
  updatedAt: string;
}

export interface Interview {
  id: string;
  projectId: string;
  sourceId: string;
  participantId: string;
  title: string;
  date: string;
  duration: string;
  transcript: Transcript;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  tags: string[];
}

export interface Quote {
  id: string;
  projectId: string;
  text: string;
  participantId: string;
  sourceId: string;
  interviewId?: string;
  tags: string[];
  x: number;
  y: number;
  width: number;
  height: number;
  clusterId?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface StickyNote {
  id: string;
  projectId: string;
  text: string;
  author: string;
  color: StickyColor;
  tags: string[];
  sourceId?: string;
  insightId?: string;
  quoteId?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  clusterId?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface Insight {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: InsightStatus;
  confidence: Confidence;
  themeIds: string[];
  quoteIds: string[];
  participantIds: string[];
  sourceIds: string[];
  tags: string[];
  evidenceQuotes: number;
  evidenceParticipants: number;
  aiGenerated: boolean;
  researcherNotes: string[];
  x: number;
  y: number;
  width: number;
  height: number;
  onCanvas: boolean;
  clusterId?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface Theme {
  id: string;
  projectId: string;
  name: string;
  description: string;
  color: ClusterColor;
  x: number;
  y: number;
  width: number;
  height: number;
  collapsed: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  tags: string[];
}

export interface AIFinding {
  id: string;
  projectId: string;
  title: string;
  description: string;
  kind: FindingKind;
  confidence: Confidence;
  suggestedTheme: string;
  quoteIds: string[];
  participantIds: string[];
  sourceIds: string[];
  evidenceQuotes: number;
  evidenceParticipants: number;
  status: FindingStatus;
  tags: string[];
  x: number;
  y: number;
  width: number;
  height: number;
  onCanvas: boolean;
  clusterId?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface AIAnalysis {
  id: string;
  projectId: string;
  sourceIds: string[];
  kinds: FindingKind[];
  status: "running" | "complete";
  findingIds: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface Persona {
  id: string;
  projectId: string;
  name: string;
  role: string;
  summary: string;
  goals: string[];
  frustrations: string[];
  behaviors: string[];
  evidenceParticipants: number;
  evidenceQuotes: number;
  participantIds: string[];
  generatedFromResearch: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  tags: string[];
}

export interface ResearchNote {
  id: string;
  projectId: string;
  kind: NoteKind;
  title: string;
  body: string;
  participantId?: string;
  interviewId?: string;
  insightId?: string;
  themeId?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface ParticipantCard {
  id: string;
  projectId: string;
  participantId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  clusterId?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface SurveyQuestion {
  id: string;
  projectId: string;
  prompt: string;
  responses: { label: string; value: number }[];
  createdAt: string;
  updatedAt: string;
}

export interface UsabilityTest {
  id: string;
  projectId: string;
  sourceId: string;
  title: string;
  date: string;
  participants: number;
  summary: string;
  findings: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface ProjectBundle {
  project: Project;
  participants: Participant[];
  sources: ResearchSource[];
  interviews: Interview[];
  quotes: Quote[];
  stickies: StickyNote[];
  insights: Insight[];
  themes: Theme[];
  findings: AIFinding[];
  analyses: AIAnalysis[];
  personas: Persona[];
  notes: ResearchNote[];
  cards: ParticipantCard[];
  survey: SurveyQuestion[];
  tests: UsabilityTest[];
}

export interface CanvasView {
  x: number;
  y: number;
  zoom: number;
}

export type CanvasItemKind = "sticky" | "quote" | "insight" | "cluster" | "finding" | "participant";

export interface SearchResult {
  id: string;
  projectId: string;
  type: "Project" | "Participant" | "Quote" | "Note" | "Insight" | "Theme" | "Interview";
  title: string;
  excerpt: string;
  href: string;
  focusId?: string;
}
