"use client";

import { useContext, type ReactNode } from "react";
import { useActiveFilters } from "../../../shared/filterRegistry";
import { useQueryState } from "../../../shared/queryState";
import {
  RefreshingContext,
  STATE_COPY,
  useViewState,
  type MessageState,
  type ViewState,
} from "../../../shared/viewState";
import { PartNote } from "../PartNote/PartNote";

export type StateMessageProps = {
  state: MessageState;
  compact?: boolean;
  title?: string;
  hint?: string;
};

export type EmptyProps = {
  title?: string;
  hint?: string;
  height?: number;
  /** A state the component knows for certain, e.g. its own asset failed to load. */ state?: MessageState;
};

export type DashboardErrorProps = {
  title?: string;
  hint?: string;
};

export type StateFrameProps = {
  children: ReactNode;
  compact?: boolean;
  auto?: ViewState | null;
};

/** The one shimmer that sweeps across a whole card (or tile) while the model writes it or its data refetches. */
export function Sheen() {
  return <span className="openui-dashboard-sheen" aria-hidden />;
}

/** An empty plot: axes with a flat dashed line where the data would be. */
const EmptyIcon = () => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M2.5 2.5v11h11" />
    <path d="M5.5 9.5h7.5" strokeDasharray="1.2 2.2" />
  </svg>
);

/** A funnel with a slash: the filters let nothing through. */
const NoResultsIcon = () => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M2.5 3h11L9.3 8.2v4.3l-2.6 1V8.2Z" />
    {/* A halo in the tile's surface colour cuts the funnel where the slash crosses it. */}
    <path d="M2 14 14 2" stroke="var(--openui-dashboard-surface)" strokeWidth="3.8" />
    <path d="M2 14 14 2" />
  </svg>
);

/** A broken link: the data could not be reached. */
const ErrorIcon = () => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M6.6 4.4 7.7 3.3a3 3 0 0 1 4.2 4.2L10.8 8.6" />
    <path d="M9.4 11.6 8.3 12.7a3 3 0 0 1-4.2-4.2L5.2 7.4" />
    <path d="M2.5 2.5 4 4M13.5 13.5 12 12" />
  </svg>
);

/** A card outline crossed at its corner: the definition is incomplete. */
const InvalidIcon = () => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <rect x="2.5" y="2.5" width="11" height="11" rx="1.5" />
    {/* The cross sits on the card's corner; a halo in the tile's surface colour cuts the outline around it. */}
    <path
      d="M10.8 1.4l3.6 3.6M14.4 1.4l-3.6 3.6"
      stroke="var(--openui-dashboard-surface)"
      strokeWidth="4"
    />
    <path d="M10.8 1.4l3.6 3.6M14.4 1.4l-3.6 3.6" />
  </svg>
);

const STATE_ICON = {
  empty: EmptyIcon,
  "no-results": NoResultsIcon,
  error: ErrorIcon,
  invalid: InvalidIcon,
} as const;

/** The icon, title and hint of a resting state. */
function StateMessage({ state, compact, title, hint }: StateMessageProps) {
  const Icon = STATE_ICON[state];
  const copy = STATE_COPY[state];
  return (
    <>
      <span className="openui-dashboard-state-icon">
        <Icon />
      </span>
      {compact ? (
        <span className="openui-dashboard-state-title">{copy.tile}</span>
      ) : (
        <span className="openui-dashboard-state-text">
          <span className="openui-dashboard-state-title">{title ?? copy.title}</span>
          <span className="openui-dashboard-state-hint">{hint ?? copy.hint}</span>
        </span>
      )}
    </>
  );
}

/**
 * A component with nothing to draw. It says "no matching data" when a filter
 * is narrowing the data and "no data" otherwise; title and hint override the
 * wording, e.g. for a search.
 */
export function Empty({ title, hint, height, state: forced }: EmptyProps) {
  const filters = useActiveFilters();
  const { streaming, fetching, queryFailed } = useQueryState();
  // No data *yet*: the model is still writing it, or a query is fetching it.
  if (streaming || fetching) {
    return (
      <div
        className="openui-dashboard-empty"
        data-state="loading"
        role="status"
        aria-busy
        style={height ? { minHeight: height } : undefined}
      >
        <span className="openui-dashboard-sr-only">Loading</span>
        <span className="openui-dashboard-skel openui-dashboard-skel-block" aria-hidden />
      </div>
    );
  }
  // No data while a live query failed: the data most likely didn't load, rather
  // than not exist. A failure can't be traced to one card, but an empty one
  // during a failure is the card it hit.
  const state: MessageState =
    forced ?? (queryFailed ? "error" : filters.active ? "no-results" : "empty");
  return (
    <div
      className="openui-dashboard-empty"
      data-state={state}
      role="status"
      style={height ? { minHeight: height } : undefined}
    >
      <StateMessage state={state} title={title} hint={hint} />
    </div>
  );
}

/**
 * The whole dashboard failed: nothing in the program could be drawn. The
 * Dashboard shows it itself when it ends up with no content; hosts can render
 * it when the program doesn't parse at all.
 */
export function DashboardError({
  title = "This dashboard couldn’t be drawn",
  hint = "Its definition has errors. Ask for it again.",
}: DashboardErrorProps) {
  return (
    <div className="openui-dashboard-dashboard-error" role="alert">
      <span className="openui-dashboard-state-icon">
        <InvalidIcon />
      </span>
      <span className="openui-dashboard-state-text">
        <span className="openui-dashboard-state-title">{title}</span>
        <span className="openui-dashboard-state-hint">{hint}</span>
      </span>
    </div>
  );
}

/**
 * Wraps a card's (or tile's) content in its current state. The content stays
 * mounted but invisible underneath, so every state keeps the exact size of the
 * loaded card and nothing reflows when it resolves. compact is for Kpi tiles.
 * auto is the state the card worked out itself (streaming, invalid); a
 * StateOverride above wins over it.
 */
export function StateFrame({ children, compact, auto = null }: StateFrameProps) {
  const override = useViewState();
  const refreshing = useContext(RefreshingContext);
  const state = override ?? auto ?? (refreshing ? "refreshing" : null);
  // Being streamed: its final height isn't known yet, so it holds a card's height.
  const streamed = !override && auto === "loading";
  // Showing its data: plain, refreshing or partial. One fragment with the content
  // first in all three, so the content stays mounted (and keeps its own state:
  // a table's sort and page, a chart's view) when a refetch starts and ends.
  if (!state || state === "refreshing" || state === "partial") {
    return (
      <>
        {children}
        {state === "partial" && !compact ? (
          <PartNote>Part of this couldn’t be drawn.</PartNote>
        ) : null}
        {/* The numbers stay; a shimmer sweeps over the card and a small loader sits on its top-right corner. */}
        {state === "refreshing" ? (
          <>
            <Sheen />
            <span className="openui-dashboard-refresh" role="status">
              <span className="openui-dashboard-sr-only">Updating</span>
              <svg viewBox="0 0 16 16" fill="none" aria-hidden>
                <circle
                  cx="8"
                  cy="8"
                  r="5.5"
                  stroke="currentColor"
                  strokeOpacity="0.2"
                  strokeWidth="1.75"
                />
                <path
                  d="M8 2.5a5.5 5.5 0 0 1 5.5 5.5"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </>
        ) : null}
      </>
    );
  }
  return (
    <div
      className="openui-dashboard-state"
      data-state={state}
      data-compact={compact ? "" : undefined}
      data-streamed={streamed ? "" : undefined}
      aria-busy={state === "loading" || undefined}
    >
      <div className="openui-dashboard-state-content" aria-hidden>
        {children}
      </div>
      <div
        className="openui-dashboard-state-layer"
        role={state === "error" || state === "invalid" ? "alert" : "status"}
      >
        {state === "loading" ? (
          <>
            <span className="openui-dashboard-sr-only">Loading</span>
            {/* Held still: the card (or tile) draws the one shimmer that moves across it. */}
            <span className="openui-dashboard-skel openui-dashboard-skel-line" aria-hidden />
            <span className="openui-dashboard-skel openui-dashboard-skel-block" aria-hidden />
          </>
        ) : (
          <StateMessage state={state} compact={compact} />
        )}
      </div>
    </div>
  );
}
