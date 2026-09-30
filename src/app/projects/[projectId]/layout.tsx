import { WorkspaceShell } from "@/components/shell/workspace-shell";
import type { ReactNode } from "react";

export default function ProjectLayout({ children }: { children: ReactNode }) {
  return <WorkspaceShell>{children}</WorkspaceShell>;
}
