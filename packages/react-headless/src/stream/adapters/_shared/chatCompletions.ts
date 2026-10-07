import type { ChatCompletionChunk } from "openai/resources/chat/completions";
import { AGUIEvent, EventType } from "../../../types";
import { errorFrameToRunError } from "./errorFrame";
import { truncatedRunError } from "./truncation";

/**
 * Maps OpenAI Chat Completions stream chunks to AG-UI events.
 *
 * Shared by `openAIAdapter` (SSE) and `openAIReadableStreamAdapter` (NDJSON),
 * which differ only in how a chunk is framed on the wire. Create one per
 * response; feed each parsed chunk to `chunk()` and call `end()` once the body
 * is exhausted. A `RUN_ERROR` is terminal: once `failed` is true the adapter
 * stops reading and nothing else is emitted.
 *
 * @internal
 */
export function chatCompletionsMapper() {
  const messageId = crypto.randomUUID();
  const toolCallIds: Record<number, string> = {};
  const openToolCallIds = new Set<string>();
  let messageStarted = false;
  let messageEnded = false;
  let failed = false;

  function* startMessage(): Generator<AGUIEvent> {
    if (messageStarted) return;
    messageStarted = true;
    yield { type: EventType.TEXT_MESSAGE_START, messageId, role: "assistant" };
  }

  // Every finish reason ends the model step, so it closes the step's tool
  // calls — not only "tool_calls". Gemini's and several OpenAI-compatible
  // proxies' native endpoints finish a tool-call turn with "stop", which left
  // the call "streaming" forever.
  function* closeStep(): Generator<AGUIEvent> {
    for (const toolCallId of openToolCallIds) {
      yield { type: EventType.TOOL_CALL_END, toolCallId };
    }
    openToolCallIds.clear();
    if (messageStarted && !messageEnded) {
      messageEnded = true;
      yield { type: EventType.TEXT_MESSAGE_END, messageId };
    }
  }

  return {
    get failed() {
      return failed;
    },

    *chunk(json: unknown): Generator<AGUIEvent> {
      // An OpenAI-style error object delivered in-stream (`{"error":{…}}`, as
      // the OpenAI SDK, OpenRouter and the OpenUI Gateway emit it under HTTP
      // 200) has no `choices`. Surface it instead of skipping it as an empty
      // chunk, which left the UI with a blank turn and no error.
      const runError = errorFrameToRunError(json);
      if (runError) {
        failed = true;
        yield runError;
        return;
      }

      const choice = (json as ChatCompletionChunk).choices?.[0];
      const delta = choice?.delta;

      if (delta) {
        // A refusal streams in `delta.refusal` instead of `delta.content`. It is
        // the model's answer to the user, so render it as text rather than
        // ending the turn with an empty message.
        const refusal = (delta as { refusal?: string | null }).refusal;

        if (delta.content || delta.role || refusal) yield* startMessage();
        if (delta.content) {
          yield { type: EventType.TEXT_MESSAGE_CONTENT, messageId, delta: delta.content };
        }
        if (refusal) {
          yield { type: EventType.TEXT_MESSAGE_CONTENT, messageId, delta: refusal };
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
      if (finishReason) {
        yield* closeStep();
        // A token limit or content filter ends the answer early; say so instead
        // of rendering the partial text as if it were complete.
        if (finishReason === "length" || finishReason === "content_filter") {
          failed = true;
          yield truncatedRunError(finishReason);
        }
      }
    },

    /** Closes anything still open when the stream ends without a finish_reason. */
    *end(): Generator<AGUIEvent> {
      yield* closeStep();
    },
  };
}
