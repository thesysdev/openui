import { toSSE } from "./sse";
import type {
  AutofixInput,
  AutofixResult,
  AutofixStream,
  AutofixStreamInput,
  StreamAdapter,
} from "./types";
import { AutofixError } from "./types";

// Stop waiting on cancellation even when an upstream iterator or request is stalled.
async function abortable<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  signal.throwIfAborted();
  let abort!: () => void;
  const cancelled = new Promise<never>((_, reject) => {
    abort = () => reject(signal.reason);
    signal.addEventListener("abort", abort, { once: true });
  });
  try {
    return await Promise.race([promise, cancelled]);
  } finally {
    signal.removeEventListener("abort", abort);
  }
}

// Bind the shared fix function to an adapter and expose native chunks or HTTP streaming.
export function createAutofixStream<Chunk>(
  input: AutofixStreamInput<Chunk>,
  fix: (input: AutofixInput & { generation: string }) => Promise<AutofixResult>,
  adapter: StreamAdapter<Chunk>,
): AutofixStream<Chunk> {
  const controller = new AbortController();
  let consumed = false;

  // Stop both repair work and the upstream SDK stream.
  const cancel = (reason?: unknown) => {
    controller.abort(reason ?? new DOMException("Stream consumer stopped", "AbortError"));
    input.stream.controller?.abort();
  };

  const chunks: AsyncIterable<Chunk> = {
    // Consume the selected adapter once and clean up when iteration ends early.
    async *[Symbol.asyncIterator]() {
      if (consumed)
        throw new AutofixError("Autofix stream can only be consumed once", "stream_consumed");
      consumed = true;
      const signal = controller.signal;
      // Forward the caller's cancellation to the upstream stream and Autofix request.
      const forwardAbort = () => cancel(input.signal?.reason);
      if (input.signal?.aborted) forwardAbort();
      else input.signal?.addEventListener("abort", forwardAbort, { once: true });
      const iterator = adapter.transform(input.stream, async (generation) => {
        const result = await fix({ generation, messages: input.messages, signal });
        signal.throwIfAborted();
        if (result.status === "fix_failed") {
          throw new AutofixError(
            "Could not repair the streamed generation",
            "fix_failed",
            undefined,
            result,
          );
        }
        return result;
      });
      let ended = false;
      try {
        while (true) {
          const next = await abortable(iterator.next(), signal);
          signal.throwIfAborted();
          if (next.done) {
            ended = true;
            break;
          }
          yield next.value;
        }
      } finally {
        input.signal?.removeEventListener("abort", forwardAbort);
        if (!ended) {
          cancel();
          void iterator.return(undefined).catch(() => {});
        }
      }
    },
  };
  return {
    chunks,
    // Serialize the native events in the selected protocol's SSE format.
    toResponse: () => toSSE(chunks, adapter.protocol, cancel),
  };
}
