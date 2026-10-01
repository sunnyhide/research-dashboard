"use client";

import { useParams } from "next/navigation";
import { OverviewView } from "@/components/views/overview-view";

export default function ProjectOverviewPage() {
  const params = useParams<{ projectId: string }>();
  return <OverviewView projectId={params.projectId} />;
}
