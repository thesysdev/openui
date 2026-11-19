"use client";

import {
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";

/* ---------- Row charts: hover band, pointer tooltip, grid ---------- */

/**
 * Hover for charts drawn as rows of HTML (Dumbbell, Distribution, Intervals,
 * Leaderboard), matching the Recharts charts: the hovered row takes a soft
 * band and the kit tooltip follows the pointer, flipping left near the right
 * edge. Put `ref` on a `.openui-dashboard-rows` wrapper, spread `rowProps` on each row and
 * render `tip` inside the wrapper.
 */
export function useRowHover() {
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{
    key: string;
    x: number;
    y: number;
    flip: boolean;
    content: ReactNode;
  } | null>(null);
  // The pointer is read on every move but applied once per frame: a burst of moves is one render.
  const frame = useRef(0);
  const pending = useRef<{
    key: string;
    clientX: number;
    clientY: number;
    content: () => ReactNode;
  } | null>(null);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);
  const rowProps = (key: string, content: () => ReactNode) => ({
    "data-hover": hover?.key === key ? "" : undefined,
    onMouseMove: (event: ReactMouseEvent) => {
      pending.current = { key, clientX: event.clientX, clientY: event.clientY, content };
      if (frame.current) return;
      frame.current = requestAnimationFrame(() => {
        frame.current = 0;
        const next = pending.current;
        const box = ref.current?.getBoundingClientRect();
        if (!next || !box) return;
        const x = next.clientX - box.left;
        setHover({
          key: next.key,
          x,
          y: next.clientY - box.top,
          flip: x > box.width - 220,
          content: next.content(),
        });
      });
    },
    onMouseLeave: () => {
      // A move still waiting for its frame mustn't bring the tip back after the pointer left.
      if (pending.current?.key === key) pending.current = null;
      setHover((current) => (current?.key === key ? null : current));
    },
  });
  const tip = hover ? (
    <div
      className="openui-dashboard-rowtip"
      data-flip={hover.flip ? "" : undefined}
      style={{ left: hover.x, top: hover.y }}
      aria-hidden
    >
      {hover.content}
    </div>
  ) : null;
  return { ref, rowProps, tip, active: hover?.key ?? null };
}
