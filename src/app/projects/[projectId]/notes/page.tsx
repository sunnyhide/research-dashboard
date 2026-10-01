"use client";

import { useParams } from "next/navigation";
import { NotesView } from "@/components/views/remaining-views";

export default function NotesPage() {
  const params = useParams<{ projectId: string }>();
  return <NotesView projectId={params.projectId} />;
}
