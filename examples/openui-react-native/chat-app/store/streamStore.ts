import { useEffect, useRef, useState } from "react";

export type StreamContent = { openui: string; isStreaming: boolean };

const streamStore = new Map<string, StreamContent>();
const streamListeners = new Map<string, Set<() => void>>();

export function pushStream(id: string, content: StreamContent) {
  streamStore.set(id, content);
  streamListeners.get(id)?.forEach((fn) => fn());
}

export function useStreamContent(id: string): StreamContent | undefined {
  const [, rerender] = useState(0);
  const rafRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);

  useEffect(() => {
    if (!streamListeners.has(id)) streamListeners.set(id, new Set());

    const scheduleRender = () => {
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        rerender((n) => n + 1);
      });
    };

    streamListeners.get(id)!.add(scheduleRender);
    if (streamStore.has(id)) scheduleRender();

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      streamListeners.get(id)?.delete(scheduleRender);
      if (streamListeners.get(id)?.size === 0) {
        streamListeners.delete(id);
        streamStore.delete(id);
      }
    };
  }, [id]);

  return streamStore.get(id);
}
