"use client";

import { useParams } from "next/navigation";
import { SurveysView } from "@/components/views/remaining-views";

export default function SurveysPage() {
  const params = useParams<{ projectId: string }>();
  return <SurveysView projectId={params.projectId} />;
}
