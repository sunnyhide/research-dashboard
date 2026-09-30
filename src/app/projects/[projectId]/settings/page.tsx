"use client";

import { useParams } from "next/navigation";
import { SettingsView } from "@/components/views/remaining-views";

export default function SettingsPage() {
  const params = useParams<{ projectId: string }>();
  return <SettingsView projectId={params.projectId} />;
}
