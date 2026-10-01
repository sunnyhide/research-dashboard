"use client";

import { useParams } from "next/navigation";
import { ParticipantList } from "@/components/research/participant-list";
import { TranscriptViewer } from "@/components/research/transcript-viewer";

export default function InterviewPage() {
  const params = useParams<{ projectId: string; interviewId: string }>();
  return (
    <div className="grid h-full grid-cols-1 md:grid-cols-[240px_minmax(0,1fr)]">
      <div className="hidden md:block">
        <ParticipantList projectId={params.projectId} activeId={params.interviewId} />
      </div>
      <TranscriptViewer projectId={params.projectId} interviewId={params.interviewId} />
    </div>
  );
}
