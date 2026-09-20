import type { ChatCompletionChunk } from "openai/resources/chat/completions";
import { correctionChunk, createChunkIterator, isUIOutput } from "./openai";
import type {
  AutofixInput,
  AutofixResult,
  AutofixStream,
  AutofixStreamInput,
  AutofixStreamResult,
} from "./types";
import { AutofixError, MAX_AUTOFIX_GENERATION_LENGTH } from "./types";

interface ChoiceState {
  id: string;
  index: number;
  text: string;
  tools: boolean;
  refusal: boolean;
  oversized: boolean;
  done: boolean;
}

type SkipReason = Extract<AutofixStreamResult, { status: "skipped" }>["reason"];

/** Stop waiting immediately on cancellation, even if an upstream iterator is stalled. */
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

// Wrap model chunks with optional repair, per-choice results, and an SSE response helper.
export function createAutofixStream(
  input: AutofixStreamInput,
  fix: (input: AutofixInput & { generation: string }) => Promise<AutofixResult>,
): AutofixStream {
  const controller = new AbortController();
  let resolveResult!: (result: AutofixStreamResult[]) => void;
  let rejectResult!: (error: unknown) => void;
  const result = new Promise<AutofixStreamResult[]>((resolve, reject) => {
    resolveResult = resolve;
    rejectResult = reject;
  });
  // HTTP-only users need not observe result; keep rejection available to callers that do.
  void result.catch(() => {});
  let consumed = false;

  // Forward emissions and append repairs for invalid UI programs before their stop chunks.
  async function* run(): AsyncGenerator<ChatCompletionChunk> {
    const signal = controller.signal;
    // Forward the caller's cancellation reason to this stream.
    const forwardAbort = () => controller.abort(input.signal?.reason);
    if (input.signal?.aborted) forwardAbort();
    else input.signal?.addEventListener("abort", forwardAbort, { once: true });
    let source: AsyncIterator<ChatCompletionChunk> | undefined;
    let ended = false;
    let settled = false;
    const states = new Map<string, ChoiceState>();
    const outcomes: AutofixStreamResult[] = [];
    // Record why a choice passed through without validation or repair.
    const skip = (state: ChoiceState, reason: SkipReason) => {
      state.done = true;
      outcomes.push({
        id: state.id,
        index: state.index,
        status: "skipped",
        reason,
        content: state.oversized ? null : state.text,
      });
    };

    try {
      signal.throwIfAborted();
      source = createChunkIterator(input.source);
      while (true) {
        const next = await abortable(Promise.resolve(source.next()), signal);
        signal.throwIfAborted();
        if (next.done) {
          ended = true;
          break;
        }
        const chunk = next.value;
        const pending: ChoiceState[] = [];
        const forwarded = chunk.choices.map((choice) => {
          const key = JSON.stringify([chunk.id, choice.index]);
          let state = states.get(key);
          if (!state) {
            state = {
              id: chunk.id,
              index: choice.index,
              text: "",
              tools: false,
              refusal: false,
              oversized: false,
              done: false,
            };
            states.set(key, state);
          }
          // Preserve provider trailers/extension events even after this choice finished.
          if (state.done) return choice;
          state.tools ||= !!(choice.delta.tool_calls?.length || choice.delta.function_call);
          state.refusal ||= choice.delta.refusal != null;
          if (choice.delta.content && !state.oversized) {
            if (state.text.length + choice.delta.content.length > MAX_AUTOFIX_GENERATION_LENGTH) {
              state.oversized = true;
              state.text = "";
            } else state.text += choice.delta.content;
          }
          if (!choice.finish_reason) return choice;
          if (
            state.tools ||
            choice.finish_reason === "tool_calls" ||
            choice.finish_reason === "function_call"
          )
            skip(state, "tool_call");
          else if (state.refusal || choice.finish_reason === "content_filter")
            skip(state, "refusal");
          else if (choice.finish_reason !== "stop") skip(state, "incomplete");
          else if (state.oversized) skip(state, "too_large");
          else if (!isUIOutput(state.text)) skip(state, "no_ui");
          else {
            pending.push(state);
            // Forward this chunk's content/tools/metadata immediately; hold only this UI stop.
            return { ...choice, finish_reason: null };
          }
          return choice;
        });
        // In the common passthrough path, preserve the exact original object, not a reconstruction.
        yield pending.length ? { ...chunk, choices: forwarded } : chunk;

        for (const state of pending) {
          signal.throwIfAborted();
          let final = await abortable(
            fix({ generation: state.text, messages: input.messages, signal }),
            signal,
          );
          signal.throwIfAborted();
          if (final.status === "fixed") {
            // Autofix returns the complete corrected program. Forward it without diffing.
            const correction = `\n${final.content}\n`;
            yield correctionChunk(chunk, state.index, correction);
            final = { ...final, content: state.text + correction };
          }
          signal.throwIfAborted();
          state.done = true;
          outcomes.push({ id: state.id, index: state.index, ...final });
          if (final.status === "fix_failed") {
            settled = true;
            resolveResult(outcomes);
            throw new AutofixError(
              "Could not repair the streamed generation",
              "fix_failed",
              undefined,
              final,
            );
          }
          yield correctionChunk(chunk, state.index, null);
        }
      }
      // A missing stop isn't a valid UI completion. Preserve the emitted stream without repairing it.
      for (const state of states.values()) {
        if (!state.done)
          skip(state, state.tools ? "tool_call" : state.refusal ? "refusal" : "incomplete");
      }
      signal.throwIfAborted();
      settled = true;
      resolveResult(outcomes);
    } catch (error) {
      settled = true;
      rejectResult(error);
      throw error;
    } finally {
      input.signal?.removeEventListener("abort", forwardAbort);
      if (!settled) {
        controller.abort(new DOMException("Stream consumer stopped", "AbortError"));
        rejectResult(signal.reason);
      }
      if (!ended) {
        input.source.controller?.abort();
        // Do not wait indefinitely for a stalled upstream iterator to acknowledge return().
        if (source?.return) {
          try {
            void Promise.resolve(source.return()).catch(() => {});
          } catch {
            /* Best-effort cleanup. */
          }
        }
      }
    }
  }

  const chunks: AsyncIterable<ChatCompletionChunk> = {
    // Start the output iterator and prevent the stream from being consumed twice.
    [Symbol.asyncIterator]() {
      if (consumed)
        throw new AutofixError("Autofix stream can only be consumed once", "stream_consumed");
      consumed = true;
      return run();
    },
  };

  return {
    chunks,
    result,
    // Expose the output chunks as a standard Chat Completions SSE response.
    toResponse() {
      const iterator = chunks[Symbol.asyncIterator]();
      const encoder = new TextEncoder();
      const body = new ReadableStream<Uint8Array>({
        // Encode the next chunk as SSE, ending with the standard DONE marker.
        async pull(streamController) {
          try {
            const next = await iterator.next();
            if (next.done) {
              streamController.enqueue(encoder.encode("data: [DONE]\n\n"));
              streamController.close();
            } else
              streamController.enqueue(encoder.encode(`data: ${JSON.stringify(next.value)}\n\n`));
          } catch (error) {
            streamController.error(error);
          }
        },
        // Stop upstream work and reject the result when the response consumer disconnects.
        cancel(reason) {
          const error = reason ?? new DOMException("Response consumer disconnected", "AbortError");
          controller.abort(error);
          input.source.controller?.abort();
          rejectResult(error);
          void iterator.return?.().catch(() => {});
        },
      });
      return new Response(body, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "X-Accel-Buffering": "no",
        },
      });
    },
  };
}
