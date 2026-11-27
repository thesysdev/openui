"use client";

import { bundledOnlyList, fetchVersionList } from "@paste/lib/versions/registry";
import type { VersionList } from "@paste/lib/versions/types";
import { useCallback, useEffect, useState } from "react";

export interface VersionListState {
  list: VersionList;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

interface FetchState {
  list: VersionList;
  loading: boolean;
  error: string | null;
}

export function useVersionList(): VersionListState {
  const [state, setState] = useState<FetchState>({
    list: bundledOnlyList(),
    loading: true,
    error: null,
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchVersionList()
      .then((list) => {
        if (!cancelled) setState({ list, loading: false, error: null });
      })
      .catch((err) => {
        if (!cancelled)
          setState((prev) => ({
            ...prev,
            loading: false,
            error: err instanceof Error ? err.message : String(err),
          }));
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => {
    // Event handler, so synchronous state updates are fine here.
    setState((prev) => ({ ...prev, loading: true, error: null }));
    setAttempt((a) => a + 1);
  }, []);

  return { ...state, retry };
}
