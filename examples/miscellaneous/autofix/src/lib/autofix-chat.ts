import {
  EventType,
  agUIAdapter,
  fetchLLM,
  identityMessageFormat,
  type ChatLLM,
  type Message,
} from "@openuidev/react-headless";
import {
  chatEventSchema,
  chatInputSchema,
  recentContext,
  type ConversationTurn,
  type RepairReport,
} from "./contract";

/** The message holds generation events; the final report replaces its preview. */
export function readReply(content: string) {
  let generation = "";
  let repairing = false;
  let report: RepairReport | undefined;
  for (const line of content.split("\n").filter(Boolean)) {
    const event = chatEventSchema.parse(JSON.parse(line));
    if (event.type === "delta") generation += event.text;
    if (event.type === "repairing") repairing = true;
    if (event.type === "result") report = event.report;
  }
  return { generation, repairing, report };
}

/** Forward conversation text and final programs, never event logs or diagnostics. */
export function conversationFromMessages(
  messages: Message[],
): ConversationTurn[] {
  const turns: ConversationTurn[] = [];
  for (const message of messages) {
    if (typeof message.content !== "string") continue;
    if (message.role === "user")
      turns.push({ role: "user", content: message.content });
    if (message.role === "assistant") {
      try {
        const report = readReply(message.content).report;
        if (report)
          turns.push({
            role: "assistant",
            content: report.output ?? report.generation,
          });
      } catch {
        /* Interrupted or older-format replies are not conversation context. */
      }
    }
  }
  const input = chatInputSchema.parse({ messages: turns.slice(-100) });
  return recentContext(input.messages);
}

export function createAutofixChat(fetcher: typeof fetch = fetch): ChatLLM {
  const requests = new WeakMap<Response, AbortSignal>();
  const adapter = agUIAdapter();
  return fetchLLM({
    url: "/api/chat",
    messageFormat: {
      ...identityMessageFormat,
      toApi: conversationFromMessages,
    },
    // Keep each response tied to its own signal, including buffered events after cancellation.
    async fetch(url, init) {
      const signal = init?.signal;
      signal?.throwIfAborted();
      const response = await fetcher(url, init);
      signal?.throwIfAborted();
      if (signal) requests.set(response, signal);
      return response;
    },
    streamAdapter: {
      async *parse(response) {
        const signal = requests.get(response);
        let finished = false;
        try {
          signal?.throwIfAborted();
          for await (const event of adapter.parse(response)) {
            signal?.throwIfAborted();
            if (event.type === EventType.TEXT_MESSAGE_END) finished = true;
            yield event;
            if (event.type === EventType.RUN_ERROR) return;
          }
          signal?.throwIfAborted();
          if (!finished)
            throw new Error(
              "Generation ended before a final result arrived. Try again.",
            );
        } finally {
          requests.delete(response);
        }
      },
    },
  });
}
