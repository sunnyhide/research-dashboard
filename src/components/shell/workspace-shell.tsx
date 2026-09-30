"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Sidebar } from "@/components/shell/sidebar";
import { TopBar } from "@/components/shell/top-bar";
import { useWorkspaceStore } from "@/store/workspace";

const links = [
  ["", "Projects"],
  ["/research", "Research"],
  ["/insights", "Insights"],
  ["/notes", "Notes"],
] as const;

export function WorkspaceShell({ children }: { children: ReactNode }) {
  const params = useParams<{ projectId: string }>();
  const pathname = usePathname();
  const project = useWorkspaceStore((state) => state.projects[params.projectId]);
  const setCollapsed = useWorkspaceStore((state) => state.setSidebarCollapsed);

  useEffect(() => {
    if (window.innerWidth < 1100) setCollapsed(true);
  }, [setCollapsed]);

  if (!project) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg px-6">
        <div>
          <h1 className="text-lg font-medium">Project not found</h1>
          <Link href="/" className="mt-2 inline-block text-[13px] text-accent-ink">Back to projects</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-bg text-ink">
      <TopBar projectId={params.projectId} />
      <div className="flex min-h-0 flex-1">
        <Sidebar projectId={params.projectId} />
        <div className="relative min-w-0 flex-1 pb-14 md:pb-0">{children}</div>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-40 flex h-14 border-t border-line bg-canvas md:hidden" aria-label="Mobile">
        <Link href="/" className="flex flex-1 items-center justify-center text-[12px] text-muted-ink">Projects</Link>
        {links.slice(1).map(([href, label]) => {
          const path = `/projects/${params.projectId}${href}`;
          const active = pathname.startsWith(path);
          return (
            <Link key={href} href={path} className={`flex flex-1 items-center justify-center text-[12px] ${active ? "text-accent-ink" : "text-muted-ink"}`}>
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
