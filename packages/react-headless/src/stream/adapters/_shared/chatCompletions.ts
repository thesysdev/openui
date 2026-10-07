import type { ChatCompletionChunk } from "openai/resources/chat/completions";
import { AGUIEvent, EventType } from "../../../types";
import { errorFrameToRunError } from "./errorFrame";
import { isTruncationReason, truncatedRunError } from "./truncation";

/**
 * Maps OpenAI Chat Completions stream chunks to AG-UI events.
 *
 * Shared by `openAIAdapter` (SSE) and `openAIReadableStreamAdapter` (NDJSON),
 * which differ only in how a chunk is framed on the wire. Create one per
 * response and feed each parsed chunk to `push()`. A `RUN_ERROR` ends the run:
 * once `terminated` is true the adapter stops reading and emits nothing else.
 *
 * @internal
 */
export function chatCompletionsMapper() {
  const messageId = crypto.randomUUID();
  const toolCallIds: Record<number, string> = {};
  const openToolCallIds = new Set<string>();
  let messageStarted = false;
  let messageEnded = false;
  let terminated = false;

  function* startMessage(): Generator<AGUIEvent> {
    if (messageStarted) return;
    messageStarted = true;
    yield { type: EventType.TEXT_MESSAGE_START, messageId, role: "assistant" };
  }

  function* endMessage(): Generator<AGUIEvent> {
    if (!messageStarted || messageEnded) return;
    messageEnded = true;
    yield { type: EventType.TEXT_MESSAGE_END, messageId };
  }

  return {
    get terminated() {
      return terminated;
    },

    *push(json: unknown): Generator<AGUIEvent> {
      // An OpenAI-style error object delivered in-stream (`{"error":{…}}`, as
      // the OpenAI SDK, OpenRouter and the OpenUI Gateway emit it under HTTP
      // 200) has no `choices`. Surface it instead of skipping it as an empty
      // chunk, which left the UI with a blank turn and no error.
      const runError = errorFrameToRunError(json);
      if (runError) {
        terminated = true;
        yield runError;
        return;
      }

      const choice = (json as ChatCompletionChunk).choices?.[0];
      const delta = choice?.delta;

      if (delta) {
        // A refusal streams in `delta.refusal` instead of `delta.content`. It is
        // the model's answer to the user, so render it as text rather than
        // ending the turn with an empty message.
        if (delta.content || delta.role || delta.refusal) yield* startMessage();
        if (delta.content) {
          yield { type: EventType.TEXT_MESSAGE_CONTENT, messageId, delta: delta.content };
        }
        if (delta.refusal) {
          yield { type: EventType.TEXT_MESSAGE_CONTENT, messageId, delta: delta.refusal };
        }

        for (const toolCall of delta.tool_calls ?? []) {
          const index = toolCall.index;

          if (toolCall.id) {
            toolCallIds[index] = toolCall.id;
            openToolCallIds.add(toolCall.id);
            yield {
              type: EventType.TOOL_CALL_START,
              toolCallId: toolCall.id,
              toolCallName: toolCall.function?.name || "",
            };
          }

          const toolCallId = toolCallIds[index];
          if (toolCall.function?.arguments && toolCallId) {
            yield {
              type: EventType.TOOL_CALL_ARGS,
              toolCallId,
              delta: toolCall.function.arguments,
            };
          }
        }
      }

      const finishReason = choice?.finish_reason;
      if (!finishReason) return;

      // A token limit or content filter ends the answer early; say so instead
      // of rendering the partial text as if it were complete. Open tool calls
      // are left unended — their arguments may be cut off mid-JSON — and the
      // consumer clears them when it handles the RUN_ERROR.
      if (isTruncationReason(finishReason)) {
        yield* endMessage();
        terminated = true;
        yield truncatedRunError(finishReason);
        return;
      }

      // Every other finish reason ends the model step, so it closes the step's
      // tool calls — not only "tool_calls". Gemini's and several OpenAI-
      // compatible proxies' native endpoints finish a tool-call turn with
      // "stop", which left the call "streaming" forever.
      for (const toolCallId of openToolCallIds) {
        yield { type: EventType.TOOL_CALL_END, toolCallId };
      }
      openToolCallIds.clear();
      yield* endMessage();
    },
  };
}
