import { createAutofix } from "@openuidev/server/vercel";
import { defineState } from "eve/context";
import { defineHook, type HookContext } from "eve/hooks";
import {
  storeChatCompletionTurn,
  type PersistStep,
} from "../../src/lib/chat-completion-history.ts";
import librarySpec from "../../src/generated/spec.json" with { type: "json" };

const CONVERSATION_ATTRIBUTE = "openuiConversationId";

type TurnBuffer = {
  conversationId?: string;
  userText: string;
  steps: PersistStep[];
  incomplete?: boolean;
};

const turnBuffer = defineState("openui.chatCompletionTurn", (): TurnBuffer => ({
  userText: "",
  steps: [],
}));

function attributeValue(value: string | readonly string[] | undefined): string | undefined {
  if (typeof value === "string") return value.trim() || undefined;
  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0].trim() || undefined;
  }
  return undefined;
}

function conversationIdFrom(ctx: HookContext): string | undefined {
  const { current, initiator } = ctx.session.auth;
  return (
    attributeValue(current?.attributes[CONVERSATION_ATTRIBUTE]) ??
    attributeValue(initiator?.attributes[CONVERSATION_ATTRIBUTE])
  );
}

function stepAt(steps: PersistStep[], index: number): PersistStep {
  while (steps.length <= index) steps.push({});
  return steps[index]!;
}

function resetTurn(conversationId?: string): TurnBuffer {
  return { conversationId, userText: "", steps: [] };
}

export default defineHook({
  events: {
    "turn.started"(_event, ctx) {
      turnBuffer.update(() => resetTurn(conversationIdFrom(ctx)));
    },
    "message.received"(event) {
      const userText = event.data.message.trim();
      if (!userText) return;
      turnBuffer.update((current) => ({ ...current, userText }));
    },
    "message.completed"(event) {
      if (event.data.finishReason !== "stop" && event.data.finishReason !== "tool-calls") {
        turnBuffer.update((current) => ({ ...current, incomplete: true }));
      }
      const text = event.data.message;
      if (!text?.trim()) return;
      turnBuffer.update((current) => {
        const steps = current.steps.slice();
        const step = stepAt(steps, event.data.stepIndex);
        step.text = (step.text ?? "") + text;
        return { ...current, steps };
      });
    },
    "actions.requested"(event) {
      const toolCalls = event.data.actions.flatMap((action) =>
        action.kind === "tool-call"
          ? [{ toolCallId: action.callId, toolName: action.toolName, input: action.input }]
          : [],
      );
      if (toolCalls.length === 0) return;
      turnBuffer.update((current) => {
        const steps = current.steps.slice();
        const step = stepAt(steps, event.data.stepIndex);
        step.toolCalls = [...(step.toolCalls ?? []), ...toolCalls];
        return { ...current, steps };
      });
    },
    "action.result"(event) {
      const result = event.data.result;
      if (result.kind !== "tool-result") return;
      turnBuffer.update((current) => {
        const steps = current.steps.slice();
        const step = stepAt(steps, event.data.stepIndex);
        step.toolResults = [
          ...(step.toolResults ?? []),
          { toolCallId: result.callId, output: result.output },
        ];
        return { ...current, steps };
      });
    },
    async "turn.completed"() {
      const buffer = turnBuffer.get();
      turnBuffer.update(() => resetTurn(buffer.conversationId));
      if (!buffer.conversationId || buffer.incomplete) return;

      const apiKey = process.env.THESYS_API_KEY;
      if (!apiKey) {
        console.error("Failed to persist chat completion turn: missing THESYS_API_KEY");
        return;
      }

      try {
        const autofix = createAutofix({ apiKey, library: librarySpec });
        const steps: PersistStep[] = [];
        for (const step of buffer.steps) {
          if (!step.text?.trim() || step.toolCalls?.length) {
            steps.push(step);
            continue;
          }
          const repaired = await autofix.ai.fix({ generation: step.text });
          steps.push(
            repaired.status === "fixed"
              ? { ...step, text: `${step.text}\n${repaired.content}\n` }
              : step,
          );
        }
        await storeChatCompletionTurn({
          conversationId: buffer.conversationId,
          user: { role: "user", content: buffer.userText },
          steps,
        });
      } catch {
        console.error(
          "[OpenUI history] Save failed. Reload Cloud history before retrying; automatic retries can duplicate a committed turn.",
          { conversationId: buffer.conversationId },
        );
      }
    },
    "turn.failed"(_event, ctx) {
      turnBuffer.update(() => resetTurn(conversationIdFrom(ctx)));
    },
    "turn.cancelled"(_event, ctx) {
      turnBuffer.update(() => resetTurn(conversationIdFrom(ctx)));
    },
  },
});
