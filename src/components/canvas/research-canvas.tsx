"use client";

import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { CanvasToolbar } from "@/components/canvas/canvas-toolbar";
import { CanvasObject } from "@/components/canvas/canvas-object";
import { FindingCard } from "@/components/canvas/finding-card";
import { Minimap } from "@/components/canvas/minimap";
import { ParticipantObject } from "@/components/canvas/participant-object";
import { QuoteCard } from "@/components/canvas/quote-card";
import { StickyNote } from "@/components/canvas/sticky-note";
import { ThemeCluster } from "@/components/canvas/theme-cluster";
import { ZoomControls } from "@/components/canvas/zoom-controls";
import { InsightCard } from "@/components/insights/insight-card";
import { Button } from "@/components/ui/button";
import { canvasBoxes, contentBounds, expandSelection, intersects } from "@/lib/canvas";
import type { CanvasFilter, CanvasItemKind, CanvasView } from "@/lib/types";
import { clamp, snapTo } from "@/lib/utils";
import { usePreferencesStore } from "@/store/preferences";
import { useProject, useWorkspaceStore } from "@/store/workspace";

type Gesture =
  | { type: "pan"; startX: number; startY: number; originX: number; originY: number }
  | { type: "marquee"; x1: number; y1: number; x2: number; y2: number; additive: boolean }
  | { type: "drag"; startX: number; startY: number; primary: string; ids: string[]; positions: Record<string, { x: number; y: number }>; moved: boolean; wasSelected: boolean }
  | { type: "resize"; id: string; startX: number; startY: number; width: number; height: number; moved: boolean };

function fadeFor(kind: CanvasItemKind, filter: CanvasFilter, aiGenerated = false): "dim" | "mute" | null {
  if (filter === "all") return null;
  if (filter === "clusters") return kind === "cluster" ? null : "dim";
  if (filter === "stickies") {
    if (kind === "sticky") return null;
    if (kind === "cluster") return "mute";
    return "dim";
  }
  if (kind === "finding" || (kind === "insight" && aiGenerated)) return null;
  if (kind === "cluster") return "mute";
  return "dim";
}

export function ResearchCanvas({ projectId }: { projectId: string }) {
  const bundle = useProject(projectId);
  const view = useWorkspaceStore((state) => state.canvas[projectId] ?? { x: 24, y: 16, zoom: 0.86 });
  const selection = useWorkspaceStore((state) => state.selection);
  const filter = useWorkspaceStore((state) => state.filter);
  const showGrid = usePreferencesStore((state) => state.showGrid);
  const snap = usePreferencesStore((state) => state.snap);
  const showMinimap = usePreferencesStore((state) => state.showMinimap);
  const setCanvas = useWorkspaceStore((state) => state.setCanvas);
  const setViewport = useWorkspaceStore((state) => state.setViewport);
  const viewport = useWorkspaceStore((state) => state.viewport);
  const setAnalysisOpen = useWorkspaceStore((state) => state.setAnalysisOpen);
  const ref = useRef<HTMLDivElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const space = useRef(false);
  const [marquee, setMarquee] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [panning, setPanning] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(() => {
      setViewport({ width: element.clientWidth, height: element.clientHeight });
    });
    observer.observe(element);
    setViewport({ width: element.clientWidth, height: element.clientHeight });
    return () => observer.disconnect();
  }, [setViewport]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const current = useWorkspaceStore.getState().canvas[projectId] ?? view;
      if (event.ctrlKey || event.metaKey) {
        zoomAt(event.clientX, event.clientY, current.zoom * Math.exp(-event.deltaY * 0.0015));
      } else {
        setCanvas(projectId, { x: current.x - event.deltaX, y: current.y - event.deltaY });
      }
    };
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, [projectId, setCanvas, view]);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.code === "Space") space.current = true;
    };
    const up = (event: KeyboardEvent) => {
      if (event.code === "Space") space.current = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  useEffect(() => {
    const move = (event: PointerEvent) => {
      const current = gesture.current;
      const state = useWorkspaceStore.getState();
      const cam = state.canvas[projectId] ?? view;
      if (!current) return;
      if (current.type === "pan") {
        setCanvas(projectId, { x: current.originX + (event.clientX - current.startX), y: current.originY + (event.clientY - current.startY) });
      } else if (current.type === "marquee" && ref.current) {
        const rect = ref.current.getBoundingClientRect();
        const x2 = event.clientX - rect.left;
        const y2 = event.clientY - rect.top;
        current.x2 = x2;
        current.y2 = y2;
        setMarquee({ x1: current.x1, y1: current.y1, x2, y2 });
        const world = worldRect(current, cam);
        const hits = canvasBoxes(state.projects[projectId]).filter((box) => intersects(box, world)).map((box) => box.id);
        state.select(hits, current.additive ? "add" : "replace");
      } else if (current.type === "drag") {
        const distance = Math.hypot(event.clientX - current.startX, event.clientY - current.startY);
        if (!current.moved && distance < 4) return;
        if (!current.moved) {
          current.moved = true;
          state.beginHistory();
        }
        const dx = (event.clientX - current.startX) / cam.zoom;
        const dy = (event.clientY - current.startY) / cam.zoom;
        const origin = current.positions[current.primary];
        if (!origin) return;
        const snappedX = snapTo(origin.x + dx, snap);
        const snappedY = snapTo(origin.y + dy, snap);
        const appliedX = snappedX - origin.x;
        const appliedY = snappedY - origin.y;
        state.updatePositions(
          projectId,
          Object.entries(current.positions).map(([id, position]) => ({ id, x: position.x + appliedX, y: position.y + appliedY })),
        );
      } else if (current.type === "resize") {
        if (!current.moved) {
          current.moved = true;
          state.beginHistory();
        }
        const width = Math.max(240, current.width + (event.clientX - current.startX) / cam.zoom);
        const height = Math.max(140, current.height + (event.clientY - current.startY) / cam.zoom);
        state.updateSize(projectId, current.id, { width, height });
      }
    };
    const up = () => {
      const current = gesture.current;
      const state = useWorkspaceStore.getState();
      if (current?.type === "drag") {
        if (current.moved) state.reassignClusters(projectId, current.ids);
        else if (current.wasSelected) state.setEditingId(current.primary);
      }
      gesture.current = null;
      setMarquee(null);
      setPanning(false);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [projectId, setCanvas, snap, view]);

  function zoomAt(clientX: number, clientY: number, nextZoom: number) {
    const element = ref.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const current = useWorkspaceStore.getState().canvas[projectId] ?? view;
    const zoom = clamp(nextZoom, 0.25, 2);
    const worldX = (clientX - rect.left - current.x) / current.zoom;
    const worldY = (clientY - rect.top - current.y) / current.zoom;
    setCanvas(projectId, { zoom, x: clientX - rect.left - worldX * zoom, y: clientY - rect.top - worldY * zoom });
  }

  function fit() {
    if (!bundle || !ref.current) return;
    const bounds = contentBounds(bundle);
    const rect = ref.current.getBoundingClientRect();
    if (!bounds) {
      setCanvas(projectId, { x: 48, y: 48, zoom: 1 });
      return;
    }
    const zoom = clamp(Math.min((rect.width - 80) / bounds.width, (rect.height - 80) / bounds.height), 0.25, 1.25);
    setCanvas(projectId, {
      zoom,
      x: (rect.width - bounds.width * zoom) / 2 - bounds.minX * zoom,
      y: (rect.height - bounds.height * zoom) / 2 - bounds.minY * zoom,
    });
  }

  function onBackgroundPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button === 1 || space.current) {
      const current = useWorkspaceStore.getState().canvas[projectId] ?? view;
      gesture.current = { type: "pan", startX: event.clientX, startY: event.clientY, originX: current.x, originY: current.y };
      setPanning(true);
      return;
    }
    if (event.button !== 0 || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (!event.shiftKey) useWorkspaceStore.getState().clearSelection();
    gesture.current = { type: "marquee", x1: x, y1: y, x2: x, y2: y, additive: event.shiftKey };
    setMarquee({ x1: x, y1: y, x2: x, y2: y });
  }

  function onObjectPointerDown(event: ReactPointerEvent<HTMLDivElement>, id: string) {
    if (event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (target.closest("button, a, input, textarea, select, [data-no-drag]")) return;
    event.stopPropagation();
    const state = useWorkspaceStore.getState();
    const currentBundle = state.projects[projectId];
    if (!currentBundle) return;
    const additive = event.shiftKey || event.metaKey || event.ctrlKey;
    const wasSelected = state.selection.includes(id);
    if (additive) state.select([id], "toggle");
    else if (!wasSelected) state.select([id]);
    const ids = expandSelection(currentBundle, additive || wasSelected ? useWorkspaceStore.getState().selection : [id]);
    const positions: Record<string, { x: number; y: number }> = {};
    for (const box of canvasBoxes(currentBundle)) {
      if (ids.includes(box.id)) positions[box.id] = { x: box.x, y: box.y };
    }
    gesture.current = { type: "drag", startX: event.clientX, startY: event.clientY, primary: id, ids, positions, moved: false, wasSelected: wasSelected && !additive };
  }

  function onResizeStart(event: ReactPointerEvent<HTMLButtonElement>, id: string) {
    event.stopPropagation();
    const theme = useWorkspaceStore.getState().projects[projectId]?.themes.find((item) => item.id === id);
    if (!theme) return;
    gesture.current = { type: "resize", id, startX: event.clientX, startY: event.clientY, width: theme.width, height: theme.height, moved: false };
  }

  if (!bundle) return null;
  const collapsed = new Set(bundle.themes.filter((theme) => theme.collapsed).map((theme) => theme.id));
  const hidden = (clusterId?: string) => Boolean(clusterId && collapsed.has(clusterId));
  const boxes = canvasBoxes(bundle);

  return (
    <div className="relative h-full min-h-0">
      <div
        ref={ref}
        className={`relative h-full overflow-hidden bg-canvas ${panning ? "cursor-grabbing" : "cursor-default"}`}
        onPointerDown={onBackgroundPointerDown}
        style={{
          backgroundImage: showGrid ? "radial-gradient(circle, var(--grid-dot) 0.8px, transparent 0.9px)" : undefined,
          backgroundSize: `${24 * view.zoom}px ${24 * view.zoom}px`,
          backgroundPosition: `${view.x}px ${view.y}px`,
        }}
        role="application"
        aria-label="Research synthesis canvas"
      >
        <div className="absolute left-0 top-0 origin-top-left" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})` }}>
          {bundle.themes.map((theme) => (
            <CanvasObject key={theme.id} id={theme.id} x={theme.x} y={theme.y} width={theme.width} selected={selection.includes(theme.id)} faded={fadeFor("cluster", filter)} label={`Theme cluster ${theme.name}`} onPointerDown={onObjectPointerDown}>
              <ThemeCluster theme={theme} projectId={projectId} selected={selection.includes(theme.id)} onResizeStart={onResizeStart} />
            </CanvasObject>
          ))}
          {bundle.quotes.filter((quote) => !hidden(quote.clusterId)).map((quote) => (
            <CanvasObject key={quote.id} id={quote.id} x={quote.x} y={quote.y} width={quote.width} selected={selection.includes(quote.id)} faded={fadeFor("quote", filter)} label={`Quote from ${bundle.participants.find((person) => person.id === quote.participantId)?.code ?? "participant"}: ${quote.text}`} onPointerDown={onObjectPointerDown}>
              <QuoteCard quote={quote} projectId={projectId} selected={selection.includes(quote.id)} participant={bundle.participants.find((person) => person.id === quote.participantId)} sourceTitle={bundle.sources.find((source) => source.id === quote.sourceId)?.title} />
            </CanvasObject>
          ))}
          {bundle.stickies.filter((note) => !hidden(note.clusterId)).map((note) => (
            <CanvasObject key={note.id} id={note.id} x={note.x} y={note.y} width={note.width} selected={selection.includes(note.id)} faded={fadeFor("sticky", filter)} label={`Sticky note: ${note.text || "Empty note"}`} onPointerDown={onObjectPointerDown}>
              <StickyNote note={note} projectId={projectId} selected={selection.includes(note.id)} />
            </CanvasObject>
          ))}
          {bundle.insights.filter((insight) => insight.onCanvas && !hidden(insight.clusterId)).map((insight) => (
            <CanvasObject key={insight.id} id={insight.id} x={insight.x} y={insight.y} width={insight.width} selected={selection.includes(insight.id)} faded={fadeFor("insight", filter, insight.aiGenerated && insight.status !== "validated")} label={`Insight: ${insight.title}`} onPointerDown={onObjectPointerDown}>
              <InsightCard insight={insight} themes={bundle.themes} canvas selected={selection.includes(insight.id)} />
            </CanvasObject>
          ))}
          {bundle.findings.filter((finding) => finding.onCanvas && finding.status === "pending" && !hidden(finding.clusterId)).map((finding) => (
            <CanvasObject key={finding.id} id={finding.id} x={finding.x} y={finding.y} width={finding.width} selected={selection.includes(finding.id)} faded={fadeFor("finding", filter)} label={`AI finding requiring review: ${finding.title}`} onPointerDown={onObjectPointerDown}>
              <FindingCard finding={finding} projectId={projectId} selected={selection.includes(finding.id)} />
            </CanvasObject>
          ))}
          {bundle.cards.filter((card) => !hidden(card.clusterId)).map((card) => (
            <CanvasObject key={card.id} id={card.id} x={card.x} y={card.y} width={card.width} selected={selection.includes(card.id)} faded={fadeFor("participant", filter)} label={`Participant card ${bundle.participants.find((person) => person.id === card.participantId)?.name ?? ""}`} onPointerDown={onObjectPointerDown}>
              <ParticipantObject participant={bundle.participants.find((person) => person.id === card.participantId)} selected={selection.includes(card.id)} />
            </CanvasObject>
          ))}
        </div>
        {marquee ? (
          <div
            className="pointer-events-none absolute z-40 border border-accent bg-accent-soft"
            style={{
              left: Math.min(marquee.x1, marquee.x2),
              top: Math.min(marquee.y1, marquee.y2),
              width: Math.abs(marquee.x2 - marquee.x1),
              height: Math.abs(marquee.y2 - marquee.y1),
            }}
          />
        ) : null}
      </div>
      {boxes.length === 0 ? (
        <div className="pointer-events-none absolute left-1/2 top-16 w-[min(420px,calc(100%-2rem))] -translate-x-1/2 rounded-md border border-line bg-canvas p-4 shadow-card">
          <h2 className="text-sm font-medium">No research on the canvas</h2>
          <p className="mt-1 text-[13px] text-muted-ink">Add interviews, surveys, or research notes to begin synthesizing. A sticky note is the fastest way to capture a thought.</p>
          <div className="pointer-events-auto mt-3">
            <Button variant="primary" onClick={() => setAnalysisOpen(true, "setup")}>Analyze research</Button>
          </div>
        </div>
      ) : null}
      <CanvasToolbar projectId={projectId} />
      <ZoomControls
        zoom={view.zoom}
        onZoom={(factor) => {
          const rect = ref.current?.getBoundingClientRect();
          if (!rect) return;
          zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, view.zoom * factor);
        }}
        onFit={fit}
        onReset={() => {
          const rect = ref.current?.getBoundingClientRect();
          if (!rect) return;
          zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, 1);
        }}
      />
      {showMinimap ? (
        <Minimap
          boxes={boxes}
          view={view}
          viewport={viewport}
          onCenter={(x, y) => {
            const rect = ref.current?.getBoundingClientRect();
            if (!rect) return;
            setCanvas(projectId, { x: rect.width / 2 - x * view.zoom, y: rect.height / 2 - y * view.zoom });
          }}
        />
      ) : null}
    </div>
  );
}

function worldRect(marquee: { x1: number; y1: number; x2: number; y2: number }, view: CanvasView) {
  const left = Math.min(marquee.x1, marquee.x2);
  const top = Math.min(marquee.y1, marquee.y2);
  const width = Math.abs(marquee.x2 - marquee.x1);
  const height = Math.abs(marquee.y2 - marquee.y1);
  return {
    x: (left - view.x) / view.zoom,
    y: (top - view.y) / view.zoom,
    width: width / view.zoom,
    height: height / view.zoom,
  };
}
