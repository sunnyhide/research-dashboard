"use client";

import { useParams } from "next/navigation";
import { ResearchView } from "@/components/views/remaining-views";

export default function ResearchPage() {
  const params = useParams<{ projectId: string }>();
  return <ResearchView projectId={params.projectId} />;
}
