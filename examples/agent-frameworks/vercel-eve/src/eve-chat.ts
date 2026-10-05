import {
  eveAdapter,
  type ChatLLM,
  type ChatStorage,
  type Message,
} from "@openuidev/react-headless";
import type { HandleMessageStreamEvent, SessionState } from "eve/client";
import {
  createThreadStore,
  getClientStorage,
  type KVStorage,
  type ThreadStore,
} from "./thread-store";

// Eve's native HTTP session protocol (same-origin, proxied by `withEve`):
//   POST /eve/v1/session            -> create a session, returns { sessionId, continuationToken }
//   POST /eve/v1/session/:id        -> deliver a follow-up turn (with continuationToken)
//   GET  /eve/v1/session/:id/stream -> resumable NDJSON event feed (?startIndex=N)
// We talk to it with plain fetch rather than `eve/client` because the client
// barrel pulls Node-only modules into the browser bundle. The serializable
// SessionState cursor is the same shape `eve/client` exposes, persisted per
// thread so reopening a thread resumes the same Eve conversation.
const EVE_PREFIX = "/eve/v1";
const SESSION_ID_HEADER = "x-eve-session-id";

function messageText(message: Pick<Message, "content">): string {
  const content = message.content as unknown;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) =>
        part && typeof part === "object" && "text" in part ? String(part.text ?? "") : "",
      )
      .join("\n");
  }
  return "";
}

function latestUserText(messages: Message[]): string {
  const user = [...messages].reverse().find((m) => m.role === "user");
  return user ? messageText(user).trim() : "";
}

const sessionKey = (threadId: string) => `eve-openui:session:${threadId}`;

function loadSession(storage: KVStorage, threadId: string): SessionState {
  try {
    const raw = storage.getItem(sessionKey(threadId));
    if (raw) return JSON.parse(raw) as SessionState;
  } catch {
    // fall through to a fresh cursor
  }
  return { streamIndex: 0 };
}

function saveSession(storage: KVStorage, threadId: string, state: SessionState): void {
  storage.setItem(sessionKey(threadId), JSON.stringify(state));
}

/**
 * POSTs the user turn, then returns Eve's raw NDJSON session stream for
 * `eveAdapter()` to parse.
 */
async function openEveStream(
  state: SessionState,
  message: string,
  signal: AbortSignal,
): Promise<{
  response: Response;
  sessionId: string;
  continuationToken?: string;
  startIndex: number;
}> {
  const deliverPath = state.sessionId
    ? `${EVE_PREFIX}/session/${encodeURIComponent(state.sessionId)}`
    : `${EVE_PREFIX}/session`;
  const deliverBody: Record<string, unknown> = { message };
  if (state.sessionId && state.continuationToken) {
    deliverBody.continuationToken = state.continuationToken;
  }

  const delivered = await fetch(deliverPath, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(deliverBody),
    signal,
  });
  if (!delivered.ok) {
    throw new Error(`Eve session POST failed (${delivered.status}): ${await delivered.text()}`);
  }

  const meta = (await delivered.json().catch(() => ({}))) as {
    sessionId?: string;
    continuationToken?: string;
  };
  const sessionId =
    meta.sessionId ?? delivered.headers.get(SESSION_ID_HEADER)?.trim() ?? state.sessionId;
  if (!sessionId) throw new Error("Eve did not return a session id.");
  const continuationToken = meta.continuationToken ?? state.continuationToken;

  const startIndex = state.sessionId === sessionId ? state.streamIndex : 0;
  const streamPath =
    `${EVE_PREFIX}/session/${encodeURIComponent(sessionId)}/stream` +
    (startIndex > 0 ? `?startIndex=${startIndex}` : "");

  const response = await fetch(streamPath, { signal });
  if (!response.ok || !response.body) {
    throw new Error(`Eve session stream GET failed (${response.status}).`);
  }

  return { response, sessionId, continuationToken, startIndex };
}

/**
 * Wires OpenUI's chat surface to an Eve agent over Eve's native session
 * protocol. Returns the `llm` + `storage` adapters `<AgentInterface>` expects:
 * `llm.send` delivers the latest user turn and returns Eve's NDJSON stream;
 * `eveAdapter()` maps that stream to AG-UI.
 */
export function createEveChatProps(
  storage: KVStorage = getClientStorage(),
  store: ThreadStore = createThreadStore(storage),
): { llm: ChatLLM; storage: ChatStorage } {
  type ActiveTurn = {
    threadId: string;
    messages: Message[];
    sessionId?: string;
    continuationToken?: string;
    index: number;
    assistant: string;
    streamedSteps: Set<number>;
    saved: boolean;
  };
  let active: ActiveTurn | null = null;

  const persistTurn = (completed: boolean) => {
    if (!active || active.saved) return;
    active.saved = true;
    saveSession(
      storage,
      active.threadId,
      completed
        ? { streamIndex: 0 }
        : {
            sessionId: active.sessionId,
            continuationToken: active.continuationToken,
            streamIndex: active.index,
          },
    );
    if (active.assistant) {
      store.saveMessages(active.threadId, [
        ...active.messages,
        { id: crypto.randomUUID(), role: "assistant", content: active.assistant } as Message,
      ]);
    }
  };

  const send: ChatLLM["send"] = async ({ messages, threadId, signal }): Promise<Response> => {
    store.saveMessages(threadId, messages);

    const opened = await openEveStream(
      loadSession(storage, threadId),
      latestUserText(messages),
      signal,
    );
    active = {
      threadId,
      messages,
      sessionId: opened.sessionId,
      continuationToken: opened.continuationToken,
      index: opened.startIndex,
      assistant: "",
      streamedSteps: new Set(),
      saved: false,
    };
    return opened.response;
  };

  return {
    llm: {
      send,
      streamProtocol: eveAdapter({
        onEvent: (event: HandleMessageStreamEvent) => {
          if (!active) return;
          active.index += 1;
          if (event.type === "message.appended" && event.data.messageDelta) {
            active.streamedSteps.add(event.data.stepIndex);
            active.assistant += event.data.messageDelta;
          } else if (
            event.type === "message.completed" &&
            event.data.message &&
            !active.streamedSteps.has(event.data.stepIndex)
          ) {
            active.assistant += event.data.message;
          }
          if (event.type === "session.completed") persistTurn(true);
          else if (event.type === "session.waiting" || event.type === "session.failed") {
            persistTurn(false);
          }
        },
      }),
    },
    storage: {
      thread: {
        listThreads: () => store.fetchThreadList(),
        createThread: (firstMessage) => store.createThread(firstMessage),
        getMessages: (threadId) => store.loadThread(threadId),
        updateThread: (thread) => store.updateThread(thread),
        deleteThread: (id) => store.deleteThread(id),
      },
    },
  };
}
