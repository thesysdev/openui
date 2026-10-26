import { useIsQueryLoading, useIsStreaming } from "@openuidev/react-lang";
import { useEffect, useState } from "react";
import { useRowBalance } from "../../core/library/rowBalance";
import { EmptyState, Skeleton, type SkeletonKind } from "../States";

/**
 * What a component without data shows: a skeleton while the dashboard streams
 * or a Query runs, then, once both have settled, an empty message.
 */
export function Pending({
  kind,
  rows,
  empty,
}: {
  kind: SkeletonKind;
  rows?: number;
  empty?: string;
}) {
  useRowBalance();
  const loading = useIsQueryLoading();
  const streaming = useIsStreaming();
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    if (loading || streaming) {
      setSettled(false);
      return;
    }
    const timer = setTimeout(() => setSettled(true), 1500);
    return () => clearTimeout(timer);
  }, [loading, streaming]);
  return settled ? <EmptyState message={empty} /> : <Skeleton kind={kind} rows={rows} />;
}
