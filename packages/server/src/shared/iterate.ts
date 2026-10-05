import type { StreamSource } from "./types";

/** Normalize native event streams and release a reader when consumption stops. */
export async function* iterateSource<T>(
  source: StreamSource<T>,
  signal: AbortSignal,
): AsyncGenerator<T> {
  if (!("getReader" in source)) {
    yield* source as AsyncIterable<T>;
    return;
  }
  const reader = (source as ReadableStream<T>).getReader();
  const cancel = () => {
    void reader.cancel(signal.reason).catch(() => {});
  };
  signal.addEventListener("abort", cancel, { once: true });
  if (signal.aborted) cancel();
  let ended = false;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) {
        ended = true;
        return;
      }
      yield value;
    }
  } finally {
    signal.removeEventListener("abort", cancel);
    if (!ended) await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
