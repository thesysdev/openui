import type { StreamSource } from "./types";

function isAsyncIterable<T>(source: StreamSource<T>): source is StreamSource<T> & AsyncIterable<T> {
  return Symbol.asyncIterator in source;
}

/** Yield native events from an async iterable or a ReadableStream. */
export async function* iterateSource<T>(source: StreamSource<T>): AsyncGenerator<T> {
  if (isAsyncIterable(source)) {
    yield* source;
    return;
  }
  const reader = (source as ReadableStream<T>).getReader();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) return;
      yield value;
    }
  } finally {
    reader.releaseLock();
  }
}
