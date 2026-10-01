"use client";

import { useParams } from "next/navigation";
import { InsightDetail } from "@/components/views/insight-detail";

export default function InsightPage() {
  const params = useParams<{ projectId: string; insightId: string }>();
  return <InsightDetail projectId={params.projectId} insightId={params.insightId} />;
}
