"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

export type ScrollAreaProps = {
  maxHeight: number;
  /**
   * Fill mode: the list takes whatever height its card gives it (a row of taller cards) and scrolls past that.
   * It never sits shorter than it needs, up to maxHeight: pass the list's own height as `fill` so a short list
   * isn't padded out.
   */
  fill?: number;
  children: ReactNode;
  label?: string;
  /** Re-measure when this changes (sort order, filtered rows). */
  watch?: unknown;
  style?: CSSProperties;
};

/* ---------- Scroll area ---------- */

/**
 * The one overflow treatment: content scrolls inside a max height, a fade
 * shows while more sits below, and a compact up/down stepper appears only
 * when the content overflows — each half disabled at its end.
 */
export function ScrollArea({
  maxHeight,
  children,
  label = "Scroll",
  watch,
  style,
  fill,
}: ScrollAreaProps) {
  const body = useRef<HTMLDivElement>(null);
  const [state, setState] = useState({ overflow: false, up: false, down: false });
  const sync = () => {
    const el = body.current;
    if (!el) return;
    const next = {
      overflow: el.scrollHeight - el.clientHeight > 8,
      up: el.scrollTop > 8,
      down: el.scrollHeight - el.scrollTop - el.clientHeight > 8,
    };
    setState((s) =>
      s.overflow === next.overflow && s.up === next.up && s.down === next.down ? s : next,
    );
  };
  useEffect(() => {
    sync();
    const el = body.current;
    if (!el) return;
    const resize = new ResizeObserver(sync);
    resize.observe(el);
    for (const child of el.children) resize.observe(child);
    return () => resize.disconnect();
  }, [watch]);
  const step = (dir: 1 | -1) => {
    const el = body.current;
    el?.scrollBy({ top: dir * Math.max(60, el.clientHeight * 0.6), behavior: "smooth" });
  };
  return (
    <div
      className={
        fill === undefined
          ? "openui-dashboard-scroll"
          : "openui-dashboard-scroll openui-dashboard-scroll-fill"
      }
      style={fill === undefined ? style : { ...style, minHeight: Math.min(fill, maxHeight) }}
    >
      <div
        className="openui-dashboard-scroll-body"
        ref={body}
        onScroll={sync}
        style={fill === undefined ? { maxHeight } : undefined}
        data-overflow={state.overflow ? "" : undefined}
      >
        {children}
      </div>
      {state.down ? <div className="openui-dashboard-scroll-fade" aria-hidden /> : null}
      {state.overflow ? (
        <div className="openui-dashboard-scroll-step" role="group" aria-label={label}>
          <button
            type="button"
            aria-label="Scroll up"
            disabled={!state.up}
            onClick={() => step(-1)}
          >
            <svg viewBox="0 0 12 12" fill="none" aria-hidden>
              <path
                d="m3 7.5 3-3 3 3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Scroll down"
            disabled={!state.down}
            onClick={() => step(1)}
          >
            <svg viewBox="0 0 12 12" fill="none" aria-hidden>
              <path
                d="m3 4.5 3 3 3-3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      ) : null}
    </div>
  );
}
