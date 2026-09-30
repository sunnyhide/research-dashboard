"use client";

import {
  ChartColumn,
  ClipboardCheck,
  FileText,
  FolderOpen,
  Frame,
  Layers,
  ListTree,
  MessagesSquare,
  NotebookPen,
  PanelLeft,
  ScanSearch,
  Settings,
  StickyNote,
  Users,
  Group,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ComponentType } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Tooltip } from "@/components/ui/tooltip";
import type { CanvasFilter } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/store/workspace";

function Item({
  href,
  label,
  icon: Icon,
  active,
  collapsed,
  onClick,
}: {
  href?: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  active?: boolean;
  collapsed: boolean;
  onClick?: () => void;
}) {
  const className = cn(
    "flex h-8 items-center gap-2 rounded-md px-2 text-[13px] text-ink",
    active ? "bg-accent-soft font-medium text-accent-ink" : "hover:bg-soft",
    collapsed && "justify-center px-0",
  );
  const body = (
    <>
      <Icon className="h-4 w-4 shrink-0" />
      {collapsed ? null : <span className="truncate">{label}</span>}
    </>
  );
  const control = href ? (
    <Link href={href} aria-current={active ? "page" : undefined} className={className} onClick={onClick}>
      {body}
    </Link>
  ) : (
    <button type="button" className={cn(className, "w-full text-left")} onClick={onClick} aria-pressed={active}>
      {body}
    </button>
  );
  if (!collapsed) return control;
  return (
    <Tooltip content={label} side="right">
      {control}
    </Tooltip>
  );
}

export function Sidebar({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const collapsed = useWorkspaceStore((state) => state.sidebarCollapsed);
  const toggle = useWorkspaceStore((state) => state.toggleSidebar);
  const filter = useWorkspaceStore((state) => state.filter);
  const setFilter = useWorkspaceStore((state) => state.setFilter);
  const reduce = useReducedMotion();
  const base = `/projects/${projectId}`;
  const onResearch = pathname.endsWith("/research");

  const goCanvas = (next: CanvasFilter) => {
    setFilter(next);
    if (!onResearch) router.push(`${base}/research`);
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 52 : 228 }}
      transition={{ duration: reduce ? 0 : 0.2, ease: "easeOut" }}
      className="hidden h-full shrink-0 flex-col border-r border-line bg-bg md:flex"
      aria-label="Project"
    >
      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
        <Section label="Project" collapsed={collapsed} />
        <div className="space-y-0.5">
          <Item collapsed={collapsed} href={base} label="Overview" icon={FolderOpen} active={pathname === base} />
          <Item collapsed={collapsed} href={`${base}/research`} label="Research" icon={Frame} active={onResearch} />
          <Item collapsed={collapsed} href={`${base}/insights`} label="Insights" icon={ListTree} active={pathname.includes("/insights")} />
          <Item collapsed={collapsed} href={`${base}/personas`} label="Personas" icon={Users} active={pathname.endsWith("/personas")} />
          <Item collapsed={collapsed} href={`${base}/reports`} label="Reports" icon={FileText} active={pathname.endsWith("/reports")} />
        </div>
        <Section label="Research" collapsed={collapsed} />
        <div className="space-y-0.5">
          <Item collapsed={collapsed} href={`${base}/interviews`} label="Interviews" icon={MessagesSquare} active={pathname.includes("/interviews")} />
          <Item collapsed={collapsed} href={`${base}/surveys`} label="Surveys" icon={ChartColumn} active={pathname.endsWith("/surveys")} />
          <Item collapsed={collapsed} href={`${base}/usability`} label="Usability tests" icon={ClipboardCheck} active={pathname.endsWith("/usability")} />
          <Item collapsed={collapsed} href={`${base}/notes`} label="Research notes" icon={NotebookPen} active={pathname.endsWith("/notes")} />
        </div>
        <Section label="Canvas" collapsed={collapsed} />
        <div className="space-y-0.5">
          <Item collapsed={collapsed} label="All objects" icon={Layers} active={onResearch && filter === "all"} onClick={() => goCanvas("all")} />
          <Item collapsed={collapsed} label="Clusters" icon={Group} active={onResearch && filter === "clusters"} onClick={() => goCanvas("clusters")} />
          <Item collapsed={collapsed} label="Sticky notes" icon={StickyNote} active={onResearch && filter === "stickies"} onClick={() => goCanvas("stickies")} />
          <Item collapsed={collapsed} label="AI findings" icon={ScanSearch} active={onResearch && filter === "findings"} onClick={() => goCanvas("findings")} />
        </div>
      </div>
      <div className="space-y-0.5 border-t border-line p-2">
        <Item collapsed={collapsed} href={`${base}/settings`} label="Settings" icon={Settings} active={pathname.endsWith("/settings")} />
        <button
          type="button"
          onClick={toggle}
          className={cn("flex h-8 w-full items-center gap-2 rounded-md px-2 text-[13px] text-muted-ink hover:bg-soft", collapsed && "justify-center px-0")}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <PanelLeft className="h-4 w-4" />
          {collapsed ? null : <span>Collapse</span>}
        </button>
      </div>
    </motion.aside>
  );
}

function Section({ label, collapsed }: { label: string; collapsed: boolean }) {
  if (collapsed) return <div className="h-3" />;
  return <div className="px-2 pb-1 pt-4 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-ink">{label}</div>;
}
