"use client";

import { FileUp } from "lucide-react";
import { useState } from "react";
import type { ResearchSource, SourceType } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";
import { useWorkspaceStore } from "@/store/workspace";

const ACCEPT = ".txt,.md,.csv,.tsv,.json,.vtt,.srt,.rtf,text/plain";

function sourceType(name: string): SourceType {
  const lower = name.toLowerCase();
  if (lower.endsWith(".csv") || lower.endsWith(".tsv") || lower.includes("survey")) return "survey";
  if (lower.includes("usability") || lower.includes("session")) return "usability";
  if (lower.endsWith(".vtt") || lower.endsWith(".srt") || lower.includes("interview") || lower.includes("transcript")) return "interview";
  return "note";
}

const typeLabel: Record<SourceType, string> = {
  interview: "Interview",
  survey: "Survey",
  usability: "Usability test",
  note: "Note",
};

export function UploadResearch({ projectId, sources }: { projectId: string; sources: ResearchSource[] }) {
  const addUploadedFiles = useWorkspaceStore((state) => state.addUploadedFiles);
  const [dragging, setDragging] = useState(false);

  async function take(list: FileList | File[]) {
    const files = [...list];
    if (!files.length) return;
    const prepared = await Promise.all(
      files.map(async (file) => ({
        name: file.name,
        text: await file.text().catch(() => ""),
        type: sourceType(file.name),
      })),
    );
    addUploadedFiles(projectId, prepared);
  }

  return (
    <section aria-labelledby="upload-research-heading">
      <label
        className={cn(
          "flex cursor-pointer flex-col items-center rounded-md border-2 border-dashed px-6 py-8 text-center transition-colors",
          dragging ? "border-accent bg-accent-soft" : "border-accent/45 bg-accent-soft/50 hover:border-accent hover:bg-accent-soft",
        )}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(event) => {
          if (event.currentTarget.contains(event.relatedTarget as Node)) return;
          setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void take(event.dataTransfer.files);
        }}
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-md border border-line bg-canvas text-accent-ink">
          <FileUp className="h-5 w-5" aria-hidden />
        </span>
        <h2 id="upload-research-heading" className="mt-3 text-base font-medium">
          {dragging ? "Drop files to upload" : "Upload files"}
        </h2>
        <p className="mt-1 max-w-md text-[13px] leading-relaxed text-muted-ink">
          Drop interview transcripts, survey exports, or notes here, or click to choose files. They are added to this project.
        </p>
        <span className="mt-4 inline-flex h-8 items-center rounded-md bg-accent px-3 text-[13px] font-medium text-white">
          Choose files
        </span>
        <p className="mt-3 text-[12px] text-muted-ink">.txt, .md, .csv, .tsv, .json, .vtt</p>
        <input
          type="file"
          multiple
          accept={ACCEPT}
          className="sr-only"
          onChange={(event) => {
            if (event.target.files) void take(event.target.files);
            event.target.value = "";
          }}
        />
      </label>
      <div className="mt-4">
        <h3 className="text-[12px] font-medium uppercase tracking-[0.14em] text-muted-ink">
          Files in this project{sources.length ? ` · ${sources.length}` : ""}
        </h3>
        {sources.length === 0 ? (
          <p className="mt-2 text-[13px] text-muted-ink">No files yet. Use the area above to upload.</p>
        ) : (
          <ul className="mt-2 divide-y divide-line border-y border-line">
            {sources.map((source) => (
              <li key={source.id} className="flex items-baseline justify-between gap-3 py-2 text-[13px]">
                <span className="min-w-0 truncate">{source.title}</span>
                <span className="shrink-0 text-[12px] text-muted-ink">
                  {typeLabel[source.type]} · {formatDate(source.updatedAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
