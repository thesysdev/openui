"use client";

import { useIsQueryLoading, useIsStreaming, useRendererQuery } from "@openuidev/react-lang";

/** Plain renderer state consumed by shared visuals. */
export function useQueryState() {
  const streaming = useIsStreaming();
  const fetching = useIsQueryLoading();
  const queryFailed = useRendererQuery().errors.some((error) => error.source === "query");
  return { streaming, fetching, queryFailed };
}
