"use client";

import {
  useAui,
  type RemoteThreadListAdapter,
  type ThreadHistoryAdapter,
} from "@assistant-ui/react";
import type { Message, ThreadStorage } from "@openuidev/react-headless";
import type { UIMessage } from "ai";
import { createAssistantStream } from "assistant-stream";
import { useMemo } from "react";

const textOf = (content: unknown): string =>
  typeof content === "string"
    ? content
    : Array.isArray(content)
      ? content.map((part) => (part?.type === "text" ? part.text : "")).join("")
      : "";

const parse = (json: string): unknown => {
  try {
    return JSON.parse(json);
  } catch {
    return {};
  }
};

/**
 * A stored conversation, as AI SDK messages: each user message, then one assistant message per
 * turn with its text and its dashboard tool calls and their results, so the cards render again.
 */
function toUIMessages(messages: Message[]): UIMessage[] {
  const out: UIMessage[] = [];
  let reply: UIMessage | undefined;
  for (const message of messages) {
    if (message.role === "user") {
      reply = undefined;
      out.push({
        id: message.id,
        role: "user",
        parts: [{ type: "text", text: textOf(message.content) }],
      });
      continue;
    }
    if (message.role !== "assistant" && message.role !== "tool") continue;
    if (!reply) {
      reply = { id: message.id, role: "assistant", parts: [] };
      out.push(reply);
    }
    if (message.role === "assistant") {
      const text = textOf(message.content);
      if (text) reply.parts.push({ type: "text", text });
      for (const call of message.toolCalls ?? []) {
        reply.parts.push({
          type: `tool-${call.function.name}`,
          toolCallId: call.id,
          state: "input-available",
          input: parse(call.function.arguments),
        } as UIMessage["parts"][number]);
      }
    } else {
      const part = reply.parts.find(
        (p) => "toolCallId" in p && p.toolCallId === message.toolCallId,
      ) as { state?: string; output?: unknown } | undefined;
      if (part) Object.assign(part, { state: "output-available", output: message.content });
    }
  }
  return out;
}

/** The first user message, as a title. */
function titleOf(
  messages: readonly { role: string; content: readonly { type: string; text?: string }[] }[],
) {
  const first = messages.find((message) => message.role === "user");
  const text = first?.content
    .map((part) => (part.type === "text" ? part.text : ""))
    .join(" ")
    .trim();
  return (text || "New chat").slice(0, 60);
}

/**
 * assistant-ui's thread list, kept in OpenUI Cloud conversations: the same threads the frontend
 * token reads. The chat route saves each turn with storeChatCompletionHistory, so the browser only
 * creates, lists, renames and deletes threads, and loads a thread's messages when it opens.
 */
export function useCloudThreadList(storage: ThreadStorage): RemoteThreadListAdapter {
  return useMemo<RemoteThreadListAdapter>(() => {
    // Loads the open thread's messages; new ones are saved by the chat route, not here.
    function useHistory() {
      const aui = useAui();
      const history = useMemo<ThreadHistoryAdapter>(
        () => ({
          async load() {
            return { messages: [] };
          },
          async append() {},
          withFormat: (format) => ({
            async load() {
              const { remoteId } = aui.threadListItem.getState();
              if (!remoteId) return { messages: [] };
              const messages = toUIMessages(await storage.getMessages(remoteId));
              return {
                messages: messages.map((message, index) =>
                  format.decode({
                    id: message.id,
                    parent_id: messages[index - 1]?.id ?? null,
                    format: format.format,
                    content: { role: message.role, parts: message.parts } as never,
                  }),
                ),
              };
            },
            async append() {},
          }),
        }),
        [aui],
      );
      return useMemo(() => ({ history }), [history]);
    }

    return {
      async list(params) {
        const { threads, nextCursor } = await storage.listThreads(params?.after);
        return {
          threads: threads.map((thread) => ({
            status: "regular" as const,
            remoteId: thread.id,
            title: thread.title,
          })),
          ...(nextCursor ? { nextCursor } : {}),
        };
      },
      async initialize(threadId) {
        // Titled once its first message is in, by generateTitle.
        const thread = await storage.createThread({ id: threadId, role: "user", content: "" });
        return { remoteId: thread.id };
      },
      async rename(remoteId, title) {
        await storage.updateThread({ id: remoteId, title, createdAt: Date.now() });
      },
      // OpenUI Cloud has no archive; archiving deletes.
      async archive(remoteId) {
        await storage.deleteThread(remoteId);
      },
      async delete(remoteId) {
        await storage.deleteThread(remoteId);
      },
      async fetch(remoteId) {
        return { status: "regular", remoteId };
      },
      async generateTitle(remoteId, messages) {
        const title = titleOf(messages);
        await storage.updateThread({ id: remoteId, title, createdAt: Date.now() });
        return createAssistantStream((controller) => controller.appendText(title));
      },
      unstable_useAdapters: useHistory,
    };
  }, [storage]);
}
