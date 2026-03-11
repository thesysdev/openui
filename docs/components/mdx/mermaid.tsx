"use client";

import { useTheme } from "next-themes";
import { use, useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.2;

function subscribe() {
  return () => {};
}

function useIsClient() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

const cache = new Map<string, Promise<unknown>>();

function cachePromise<T>(key: string, setPromise: () => Promise<T>): Promise<T> {
  const cached = cache.get(key);
  if (cached) return cached as Promise<T>;
  const promise = setPromise();
  cache.set(key, promise);
  return promise;
}

export function Mermaid({ chart, initialZoom = 1 }: { chart: string; initialZoom?: number }) {
  const isClient = useIsClient();
  if (!isClient) return null;
  return <MermaidContent chart={chart} initialZoom={initialZoom} />;
}

function MermaidContent({ chart, initialZoom = 1 }: { chart: string; initialZoom?: number }) {
  const id = useId();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [zoom, setZoom] = useState(initialZoom);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef({ x: 0, y: 0 });
  const positionRef = useRef(position);
  const zoomRef = useRef(zoom);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);
  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  const { default: mermaid } = use(cachePromise("mermaid", () => import("mermaid")));

  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "loose",
    fontFamily: "inherit",
    theme: isDark ? "dark" : "default",
  });

  const { svg, bindFunctions } = use(
    cachePromise(`${chart}-${resolvedTheme}`, () =>
      mermaid.render(id, chart.replaceAll("\\n", "\n")),
    ),
  );

  // Ctrl + scroll to zoom
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
        setZoom((prev) => Math.min(Math.max(prev + delta, MIN_ZOOM), MAX_ZOOM));
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // Drag to pan
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX - positionRef.current.x,
      y: e.clientY - positionRef.current.y,
    };
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      setPosition({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y,
      });
    },
    [isDragging],
  );

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  // Styles
  const border = isDark ? "#27272a" : "#e4e4e7";
  const btnBg = isDark ? "#18181b" : "#ffffff";
  const btnColor = isDark ? "#a1a1aa" : "#52525b";
  const badgeBg = isDark ? "#18181b" : "#f4f4f5";
  const badgeColor = isDark ? "#a1a1aa" : "#52525b";

  const btnBase: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    border: `1px solid ${border}`,
    background: btnBg,
    color: btnColor,
    cursor: "pointer",
    userSelect: "none",
  };

  return (
    <div
      style={{
        position: "relative",
        margin: "1.5rem 0",
        borderRadius: 8,
        border: `1px solid ${border}`,
        overflow: "hidden",
      }}
    >
      {/* Top-right controls */}
      <div style={{ position: "absolute", top: 8, right: 8, zIndex: 10 }}>
        <button
          style={{ ...btnBase, width: "auto", padding: "0 10px", fontSize: 11 }}
          onClick={() => {
            setZoom(initialZoom);
            setPosition({ x: 0, y: 0 });
          }}
          title="Reset"
        >
          Reset
        </button>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        style={{
          width: "100%",
          aspectRatio: "16/9",
          minHeight: 260,
          overflow: "hidden",
          cursor: isDragging ? "grabbing" : "grab",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          touchAction: "none",
          userSelect: "none",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          ref={(el) => {
            (svgRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
            if (el) bindFunctions?.(el);
          }}
          dangerouslySetInnerHTML={{ __html: svg }}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
            transformOrigin: "center center",
            transition: isDragging ? "none" : "transform 0.15s ease-out",
            maxWidth: "100%",
            maxHeight: "100%",
            userSelect: "none",
          }}
        />
      </div>

      {/* Bottom-left zoom badge + hint */}
      <div
        style={{
          position: "absolute",
          bottom: 8,
          left: 8,
          display: "flex",
          flexDirection: "column",
          gap: 4,
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            padding: "3px 8px",
            borderRadius: 6,
            border: `1px solid ${border}`,
            background: badgeBg,
            color: badgeColor,
            fontSize: 11,
          }}
        >
          {Math.round(zoom * 100)}%
        </span>
        <span
          style={{
            padding: "3px 8px",
            borderRadius: 6,
            border: `1px solid ${border}`,
            background: badgeBg,
            color: badgeColor,
            fontSize: 10,
          }}
        >
          Drag to pan · Ctrl+Scroll to zoom
        </span>
      </div>
    </div>
  );
}
