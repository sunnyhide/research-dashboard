"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { ParticipantList } from "@/components/research/participant-list";
import { EmptyState } from "@/components/ui/empty-state";
import { useProject } from "@/store/workspace";

export default function InterviewsPage() {
  const params = useParams<{ projectId: string }>();
  const bundle = useProject(params.projectId);
  const router = useRouter();
  useEffect(() => {
    if (bundle?.interviews[0]) router.replace(`/projects/${params.projectId}/interviews/${bundle.interviews[0].id}`);
  }, [bundle, params.projectId, router]);
  if (!bundle) return null;
  if (!bundle.interviews.length) {
    return (
      <div className="flex h-full">
        <div className="hidden w-60 md:block"><ParticipantList projectId={params.projectId} /></div>
        <EmptyState title="No research uploaded" body="Add interviews, surveys, or research notes to begin synthesizing." />
      </div>
    );
  }
  return <div className="h-full" />;
}
