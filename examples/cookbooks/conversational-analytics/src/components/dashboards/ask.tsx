"use client";

import { createContext, useContext, type ButtonHTMLAttributes, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import "../stream-settle.css";
import "./dashboards.css";

/*
 * Everything on a dashboard asks Team Radio about itself: a click starts a new chat with a
 * question written for that item. The page that hosts the dashboards supplies `ask`. So the
 * dashboards need no detail pages: any deeper view is an answer the agent generates.
 */

const AskContext = createContext<(question: string) => void>(() => {});

export const AskProvider = AskContext.Provider;
export const useAsk = () => useContext(AskContext);

/** A bare button that radios in `q`. Styles come from its className; the hover lives in CSS. */
export function Ask({
  q,
  className,
  style,
  label,
  children,
  ...rest
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "title"> & {
  q: string;
  className?: string;
  style?: CSSProperties;
  /** Accessible name when the content is only pictures. */
  label?: string;
  children: ReactNode;
}) {
  const ask = useAsk();
  return (
    <button {...rest} type="button" className={className ? `f1d-ask ${className}` : "f1d-ask"} style={style} aria-label={label} title={q} onClick={() => ask(q)}>
      {children}
    </button>
  );
}

/**
 * A chart that asks about itself. A click on one of its rows (a RankedBars bar, say) asks
 * `row(i)` for that row; a click anywhere else asks `q`.
 */
export function AskChart({ q, row, rowSelector, children }: { q: string; row?: (i: number) => string | undefined; rowSelector?: string; children: ReactNode }) {
  const ask = useAsk();
  const onClick = (e: MouseEvent<HTMLDivElement>) => {
    if (row && rowSelector) {
      const hit = (e.target as HTMLElement).closest(rowSelector);
      if (hit?.parentElement) {
        const i = [...hit.parentElement.querySelectorAll(`:scope > ${rowSelector}`)].indexOf(hit);
        const question = i >= 0 ? row(i) : undefined;
        if (question) return ask(question);
      }
    }
    ask(q);
  };
  return (
    <div
      className="f1d-chart"
      role="button"
      tabIndex={0}
      // No title: the chart's own tooltip shows on hover, and a native one would cover it.
      aria-label={q}
      onClick={onClick}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), ask(q))}
    >
      {children}
    </div>
  );
}

/** Section heading: red eyebrow, wide Saira title and an optional "more" question on the right. */
export function Head({ eyebrow, title, more }: { eyebrow?: ReactNode; title: ReactNode; more?: { label: string; q: string } }) {
  return (
    <div className="f1d-head">
      <div>
        {eyebrow && <div className="f1d-eyebrow">{eyebrow}</div>}
        <h2 className="f1d-title">{title}</h2>
      </div>
      {more && (
        <Ask q={more.q} className="f1d-more">
          {more.label}
        </Ask>
      )}
    </div>
  );
}

/** The cream checkerboard loader at the block's final size, so nothing moves when data lands. */
export function Settle({ height, style }: { height: number; style?: CSSProperties }) {
  return <div className="f1-settle" aria-hidden style={{ height, ...style }} />;
}

/** Shown in place of a block whose data could not load. Same height, so the page holds still. */
export function Missing({ height, what }: { height: number; what: string }) {
  return (
    <div className="f1d-missing" style={{ height }}>
      Couldn&apos;t load {what}. Ask Team Radio below instead.
    </div>
  );
}
