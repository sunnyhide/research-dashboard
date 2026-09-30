"use client";

import { useParams } from "next/navigation";
import { ReportsView } from "@/components/views/remaining-views";

export default function ReportsPage() {
  const params = useParams<{ projectId: string }>();
  return <ReportsView projectId={params.projectId} />;
}
