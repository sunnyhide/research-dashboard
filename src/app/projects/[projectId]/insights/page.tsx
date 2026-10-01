"use client";

import { useParams } from "next/navigation";
import { InsightsView } from "@/components/views/insights-view";

export default function InsightsPage() {
  const params = useParams<{ projectId: string }>();
  return <InsightsView projectId={params.projectId} />;
}
