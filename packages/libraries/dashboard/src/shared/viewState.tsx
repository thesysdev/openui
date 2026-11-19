"use client";

import { createContext, useContext, type ReactNode } from "react";

/* ---------- View states ---------- */

/**
 * Every state a card (or Kpi tile) can be in, besides showing its data:
 *
 *   loading     the model is still writing it (or a host says so): a still line
 *               and block under one shimmer across the whole card. The same
 *               however it's triggered: while streaming, the component's shape
 *               isn't known until its data arrives, so the skeleton never guesses one.
 *   refreshing  live data is being fetched again: the content stays, under a shimmer, with a loader on the corner
 *   empty       nothing exists for this period
 *   no-results  the filters narrowed it to nothing
 *   error       its data didn't load
 *   invalid     the model's definition of it was missing or wrong, so it couldn't be drawn
 *   partial     drawn, but part of it (one series) couldn't be: the rest shows with a note
 *
 * The dashboard itself can also fail as a whole (DashboardError).
 */
export type ViewState =
  "loading" | "refreshing" | "empty" | "no-results" | "error" | "invalid" | "partial";

const ViewStateContext = createContext<ViewState | null>(null);

/**
 * Forces every card and tile below it into one state, for previews and for
 * hosts that know a dashboard is loading or has failed. null renders normally.
 */
export function StateOverride({
  value,
  children,
}: {
  value: ViewState | null;
  children: ReactNode;
}) {
  return <ViewStateContext.Provider value={value}>{children}</ViewStateContext.Provider>;
}

export function useViewState(): ViewState | null {
  return useContext(ViewStateContext);
}
/** True while the dashboard's live data refetches: every card shows the refresh loader. */
export const RefreshingContext = createContext(false);
/** What each resting state says: a card gets a title and the next step; a tile gets the title alone. */
export const STATE_COPY = {
  empty: { title: "No data for this period", tile: "No data", hint: "Try a longer date range." },
  "no-results": {
    title: "No matching data",
    tile: "No results",
    hint: "Try changing or clearing a filter.",
  },
  error: {
    title: "This data didn’t load",
    tile: "Didn’t load",
    hint: "Try fetching the data again.",
  },
  invalid: {
    title: "This card couldn’t be drawn",
    tile: "Couldn’t show",
    hint: "Part of its definition is missing. Ask for it again.",
  },
} as const;
export type MessageState = keyof typeof STATE_COPY;
