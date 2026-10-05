import type { UIMessage, UIMessageChunk } from "ai";
import { AGUIEvent, EventType, StreamProtocolAdapter } from "../../types";

const MISSING_AI_SDK_MESSAGE =
  'vercelAIAdapter requires the optional peer dependency "ai" (Vercel AI SDK v6 or v7).';
const PROVIDER_EXECUTED_TOOLS_UNSUPPORTED_MESSAGE =
  "Vercel AI SDK provider-executed tools are not supported because AG-UI messages cannot preserve providerExecuted semantics.";
const TOOL_EXECUTION_DENIED_MESSAGE = "Tool execution was denied";

function serialize(value: unknown): string {
  if (typeof value === "string") return value;
  return JSON.stringify(value) ?? String(value);
}

async function parseUIMessageStream(
  body: ReadableStream<Uint8Array>,
): Promise<ReadableStream<UIMessageChunk>> {
  let DefaultChatTransport: typeof import("ai").DefaultChatTransport;

  try {
    ({ DefaultChatTransport } = await import("ai"));
  } catch (cause) {
    throw new Error(MISSING_AI_SDK_MESSAGE, { cause });
  }

  // Some bundlers replace a missing optional peer with an empty module rather
  // than rejecting the dynamic import. Keep that path on the same actionable
  // error instead of failing later with "Class extends undefined".
  if (typeof DefaultChatTransport !== "function") {
    throw new Error(MISSING_AI_SDK_MESSAGE);
  }

  class UIMessageStreamParser extends DefaultChatTransport<UIMessage> {
    parseBody(stream: ReadableStream<Uint8Array>): ReadableStream<UIMessageChunk> {
      return this.processResponseStream(stream);
    }
  }

  return new UIMessageStreamParser().parseBody(body);
}

async function* readChunks(stream: ReadableStream<UIMessageChunk>): AsyncIterable<UIMessageChunk> {
  const reader = stream.getReader();
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

function toolResult(toolCallId: string, content: string, error?: string): AGUIEvent {
  return {
    type: EventType.TOOL_CALL_RESULT,
    messageId: `tool-result-${toolCallId}`,
    toolCallId,
    content,
    role: "tool",
    ...(error !== undefined ? { isError: true, error } : {}),
  } as AGUIEvent;
}

/**
 * Adapter for Vercel AI SDK v6 and v7 UIMessage streams.
 *
 * The AI SDK is loaded only when parsing begins so it can remain an optional
 * peer dependency for consumers that use other stream adapters. Its
 * `DefaultChatTransport` performs the native SSE decoding and chunk validation;
 * this adapter only maps validated UIMessage chunks to AG-UI events.
 */
export const vercelAIAdapter = (): StreamProtocolAdapter => ({
  async *parse(response): AsyncIterable<AGUIEvent> {
    if (!response.body) throw new Error("No response body");

    const chunks = await parseUIMessageStream(response.body);
    const startedTools = new Set<string>();
    const streamedToolArgs = new Set<string>();
    const endedTools = new Set<string>();
    let stepIndex = 0;

    // AG-UI step events are lifecycle-only. Normalize each AI SDK model step
    // into one assistant message lifecycle here so downstream consumers do not
    // need provider-specific step handling. Open it lazily to avoid producing
    // empty messages for steps whose only chunks are ignored by this adapter.
    let activeStep:
      | {
          stepName: string;
          messageId?: string;
          messageStarted: boolean;
          // Per-step, so a new step resets it without an explicit assignment.
          // Only ever read while a step message is open (see beginText).
          sawTools: boolean;
        }
      | undefined;

    const startStepMessage = (preferredMessageId?: string): AGUIEvent | undefined => {
      if (!activeStep || activeStep.messageStarted) return;

      activeStep.messageId ??= preferredMessageId ?? `vercel-ai-message-${stepIndex}`;
      activeStep.messageStarted = true;
      return {
        type: EventType.TEXT_MESSAGE_START,
        messageId: activeStep.messageId,
        role: "assistant",
      };
    };

    // Single entry point for "a text chunk arrived": opens the step's message,
    // or closes it and opens a new one when the text follows tool calls.
    //
    // Text that follows tool calls is a new assistant item: commentary like
    // "Let me do this" stays on the tool-bearing message and the answer text
    // after it gets its own message id, so a consumer splitting on
    // TEXT_MESSAGE_START keeps both. Streams without `start-step` already give
    // each text part a distinct id, so only the step-scoped message needs this.
    const beginText = (partId: string): AGUIEvent[] => {
      if (activeStep?.messageStarted && activeStep.sawTools) {
        const previousId = activeStep.messageId!;
        activeStep.messageId = partId;
        activeStep.sawTools = false;
        return [
          { type: EventType.TEXT_MESSAGE_END, messageId: previousId },
          { type: EventType.TEXT_MESSAGE_START, messageId: partId, role: "assistant" },
        ];
      }

      const event = startStepMessage(partId);
      return event ? [event] : [];
    };

    const toolParent = () =>
      activeStep?.messageId ? { parentMessageId: activeStep.messageId } : {};

    for await (const chunk of readChunks(chunks)) {
      if ("providerExecuted" in chunk && chunk.providerExecuted === true) {
        throw new Error(PROVIDER_EXECUTED_TOOLS_UNSUPPORTED_MESSAGE);
      }

      switch (chunk.type) {
        case "start-step": {
          const stepName = `vercel-ai-step-${++stepIndex}`;
          activeStep = { stepName, messageStarted: false, sawTools: false };
          yield {
            type: EventType.STEP_STARTED,
            stepName,
          };
          break;
        }

        case "finish-step": {
          const stepName = activeStep?.stepName ?? `vercel-ai-step-${++stepIndex}`;
          if (activeStep?.messageStarted && activeStep.messageId) {
            yield {
              type: EventType.TEXT_MESSAGE_END,
              messageId: activeStep.messageId,
            };
          }
          yield {
            type: EventType.STEP_FINISHED,
            stepName,
          };
          activeStep = undefined;
          break;
        }

        case "text-start": {
          for (const event of beginText(chunk.id)) yield event;
          if (!activeStep) {
            yield {
              type: EventType.TEXT_MESSAGE_START,
              messageId: chunk.id,
              role: "assistant",
            };
          }
          break;
        }

        case "text-delta": {
          for (const event of beginText(chunk.id)) yield event;
          yield {
            type: EventType.TEXT_MESSAGE_CONTENT,
            messageId: activeStep?.messageId ?? chunk.id,
            delta: chunk.delta,
          };
          break;
        }

        case "text-end":
          if (!activeStep) {
            yield {
              type: EventType.TEXT_MESSAGE_END,
              messageId: chunk.id,
            };
          }
          break;

        case "tool-input-start":
          if (!startedTools.has(chunk.toolCallId)) {
            const event = startStepMessage();
            if (event) yield event;
            startedTools.add(chunk.toolCallId);
            if (activeStep) activeStep.sawTools = true;
            yield {
              type: EventType.TOOL_CALL_START,
              toolCallId: chunk.toolCallId,
              toolCallName: chunk.toolName,
              ...toolParent(),
            };
          }
          break;

        case "tool-input-delta":
          if (chunk.inputTextDelta) {
            streamedToolArgs.add(chunk.toolCallId);
            yield {
              type: EventType.TOOL_CALL_ARGS,
              toolCallId: chunk.toolCallId,
              delta: chunk.inputTextDelta,
            };
          }
          break;

        case "tool-input-available":
        case "tool-input-error": {
          if (!startedTools.has(chunk.toolCallId)) {
            const event = startStepMessage();
            if (event) yield event;
            startedTools.add(chunk.toolCallId);
            if (activeStep) activeStep.sawTools = true;
            yield {
              type: EventType.TOOL_CALL_START,
              toolCallId: chunk.toolCallId,
              toolCallName: chunk.toolName,
              ...toolParent(),
            };
          }

          if (!streamedToolArgs.has(chunk.toolCallId)) {
            streamedToolArgs.add(chunk.toolCallId);
            yield {
              type: EventType.TOOL_CALL_ARGS,
              toolCallId: chunk.toolCallId,
              delta: serialize(chunk.input),
            };
          }

          if (!endedTools.has(chunk.toolCallId)) {
            endedTools.add(chunk.toolCallId);
            yield {
              type: EventType.TOOL_CALL_END,
              toolCallId: chunk.toolCallId,
            };
          }

          if (chunk.type === "tool-input-error") {
            yield toolResult(chunk.toolCallId, chunk.errorText, chunk.errorText);
          }
          break;
        }

        case "tool-output-available":
          yield toolResult(chunk.toolCallId, serialize(chunk.output));
          break;

        case "tool-output-error":
          yield toolResult(chunk.toolCallId, chunk.errorText, chunk.errorText);
          break;

        case "tool-output-denied":
          yield toolResult(
            chunk.toolCallId,
            TOOL_EXECUTION_DENIED_MESSAGE,
            TOOL_EXECUTION_DENIED_MESSAGE,
          );
          break;

        case "error":
          yield {
            type: EventType.RUN_ERROR,
            message: chunk.errorText,
          };
          return;
      }
    }

    if (activeStep?.messageStarted && activeStep.messageId) {
      yield {
        type: EventType.TEXT_MESSAGE_END,
        messageId: activeStep.messageId,
      };
    }
  },
});
