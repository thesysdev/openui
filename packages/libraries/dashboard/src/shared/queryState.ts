"use client";

import { useIsQueryLoading, useIsStreaming, useRendererQuery } from "@openuidev/react-lang";
import { useContext } from "react";
import { RefreshingContext } from "./viewState";

/** Plain renderer state consumed by shared visuals. */
export function useQueryState() {
  const streaming = useIsStreaming();
  const fetching = useIsQueryLoading();
  const queryFailed = useRendererQuery().errors.some((error) => error.source === "query");
  return { streaming, fetching, queryFailed };
}

/**
 * The dashboard's first query fetch. A value worked out from query results (revenue / orders)
 * isn't real until they arrive: the language reads the missing numbers as 0. A later refetch
 * is a refresh (RefreshingContext), where every card keeps its numbers.
 */
export function useFirstFetch() {
  const fetching = useIsQueryLoading();
  const refreshing = useContext(RefreshingContext);
  return fetching && !refreshing;
}
