import { OpenUIClient } from "@openuidev/server";
import { defineState } from "eve/context";
import { defineHook, type HookContext } from "eve/hooks";

/** Reads THESYS_API_KEY; the same user and app as /api/frontend-token. */
const openui = new OpenUIClient({ appId: process.env.APP_ID || undefined });
const userId = process.env.DEMO_USER_ID || "demo-user";

/** Session auth attribute carrying the OpenUI Cloud thread id; set in channels/eve.ts. */
export const THREAD_ID_ATTRIBUTE = "openuiThreadId";

// The Chat Completions shapes saved here (the full union lives in the `openai` package).
type ChatMessage =
  | { role: "user"; content: string }
  | {
      role: "assistant";
      content: string;
      tool_calls?: {
        id: string;
        type: "function";
        function: { name: string; arguments: string };
      }[];
    }
  | { role: "tool"; tool_call_id: string; content: string };

// The turn in progress, collected event by event; durable across hook steps.
const turn = defineState<ChatMessage[]>("openui.history.turn", () => []);

const append = (message: ChatMessage) => turn.update((messages) => [...messages, message]);

function threadIdOf(ctx: HookContext): string | undefined {
  const value = ctx.session.auth.current?.attributes[THREAD_ID_ATTRIBUTE];
  return typeof value === "string" && value ? value : undefined;
}

/** Saves each completed turn so OpenUI Cloud storage can reload the thread. */
export default defineHook({
  events: {
    "message.received"(event) {
      turn.update(() => [{ role: "user", content: event.data.message }]);
    },
    "message.completed"(event) {
      if (event.data.message) append({ role: "assistant", content: event.data.message });
    },
    "actions.requested"(event) {
      const toolCalls = event.data.actions.flatMap((action) =>
        action.kind === "tool-call"
          ? [
              {
                id: action.callId,
                type: "function" as const,
                function: { name: action.toolName, arguments: JSON.stringify(action.input) },
              },
            ]
          : [],
      );
      if (toolCalls.length) append({ role: "assistant", content: "", tool_calls: toolCalls });
    },
    "action.result"(event) {
      const { result } = event.data;
      if (result.kind !== "tool-result") return;
      append({
        role: "tool",
        tool_call_id: result.callId,
        content: typeof result.output === "string" ? result.output : JSON.stringify(result.output),
      });
    },
    async "turn.completed"(_event, ctx) {
      const conversationId = threadIdOf(ctx);
      const messages = turn.get();
      turn.update(() => []);
      if (!conversationId || messages.length === 0) return;
      // A thrown hook fails the turn, so a failed save is only logged.
      try {
        // The thread id comes from the browser: save only to this user's threads.
        const conversation = await openui.conversations.get(conversationId);
        if (conversation.userId !== userId) throw new Error("The thread isn't this user's.");
        await openui.chat.conversations.items.create(conversationId, messages);
      } catch (error) {
        console.error("Failed to save the turn to OpenUI Cloud:", error);
      }
    },
  },
});
