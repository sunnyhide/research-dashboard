"use client";

import { useParams } from "next/navigation";
import { UsabilityView } from "@/components/views/remaining-views";

export default function UsabilityPage() {
  const params = useParams<{ projectId: string }>();
  return <UsabilityView projectId={params.projectId} />;
}
