import { abortable } from "../core/abort";
import { toSSE } from "./sse";
import type {
  AutofixInput,
  AutofixResult,
  AutofixStream,
  AutofixStreamInput,
  StreamAdapter,
} from "./types";
import { AutofixError } from "./types";

// Bind the shared fix function to an adapter and expose native chunks or HTTP streaming.
export function createAutofixStream<Chunk>(
  input: AutofixStreamInput<Chunk>,
  fix: (input: AutofixInput) => Promise<AutofixResult>,
  adapter: StreamAdapter<Chunk>,
): AutofixStream<Chunk> {
  const controller = new AbortController();
  let consumed = false;
  let last: AutofixResult | null = null;
  let settle!: (value: AutofixResult | null) => void;
  let fail!: (reason: unknown) => void;
  let settled = false;
  const result = new Promise<AutofixResult | null>((resolve, reject) => {
    settle = resolve;
    fail = reject;
  });
  // Ignore rejection unless the caller awaits result.
  result.catch(() => {});

  const resolveOnce = (value: AutofixResult | null) => {
    if (settled) return;
    settled = true;
    settle(value);
  };
  const rejectOnce = (reason: unknown) => {
    if (settled) return;
    settled = true;
    fail(reason);
  };

  // Stop both repair work and the upstream SDK stream.
  const cancel = (reason?: unknown) => {
    controller.abort(reason ?? new DOMException("Stream consumer stopped", "AbortError"));
    input.stream.controller?.abort();
  };

  const chunks: AsyncIterable<Chunk> = {
    async *[Symbol.asyncIterator]() {
      // chunks and toResponse() share this iterator.
      if (consumed)
        throw new AutofixError("Autofix stream can only be consumed once", "stream_consumed");
      consumed = true;
      const signal = controller.signal;
      const forwardAbort = () => cancel(input.signal?.reason);
      if (input.signal?.aborted) forwardAbort();
      else input.signal?.addEventListener("abort", forwardAbort, { once: true });

      const iterator = adapter.transform(input.stream, async (generation) => {
        const next = await fix({ generation, messages: input.messages, signal });
        signal.throwIfAborted();
        last = next;
        if (next.status === "fix_failed") {
          throw new AutofixError(
            "Could not repair the streamed generation",
            "fix_failed",
            undefined,
            next,
          );
        }
        return next;
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
        resolveOnce(last);
      } catch (error) {
        rejectOnce(error);
        throw error;
      } finally {
        input.signal?.removeEventListener("abort", forwardAbort);
        // Early stop: cancel upstream work and reject result.
        if (!ended) {
          cancel();
          void iterator.return(undefined).catch(() => {});
          rejectOnce(signal.reason ?? new DOMException("Stream consumer stopped", "AbortError"));
        }
      }
    },
  };
  return {
    chunks,
    result,
    toResponse: () => toSSE(chunks, adapter.protocol, cancel),
  };
}
