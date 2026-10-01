"use client";

import { useParams } from "next/navigation";
import { PersonasView } from "@/components/views/remaining-views";

export default function PersonasPage() {
  const params = useParams<{ projectId: string }>();
  return <PersonasView projectId={params.projectId} />;
}
