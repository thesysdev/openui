import { eveAdapter, type ChatLLM, type Message } from "@openuidev/react-ui";

// Eve's native HTTP session protocol (same-origin, proxied by `withEve`):
//   POST /eve/v1/session            -> create a session
//   POST /eve/v1/session/:id        -> deliver a follow-up turn
//   GET  /eve/v1/session/:id/stream -> resumable NDJSON event feed
// `eveAdapter` (from @openuidev/react-headless, re-exported by react-ui)
// translates the NDJSON feed into the AG-UI events OpenUI renders.
const EVE_PREFIX = "/eve/v1";
const SESSION_ID_HEADER = "x-eve-session-id";

/** Per-thread cursor. Kept local — Eve 0.18+ renamed/narrowed `SessionState`. */
type EveSessionCursor = {
  sessionId?: string;
  streamIndex: number;
  continuationToken?: string;
};

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

/**
 * Client-side ChatLLM for Eve. OpenUI keeps the transcript in memory for the
 * page session; this adapter maps the current turn onto Eve's session protocol
 * and holds the per-thread Eve cursor in memory so follow-ups resume. Stream
 * translation is `eveAdapter`'s job; its `onEvent` hook advances the cursor so
 * an interrupted or waiting session resumes from `?startIndex=`.
 */
export function createEveLLM(): ChatLLM {
  const sessions = new Map<string, EveSessionCursor>();
  // Cursor for the run in flight. OpenUI finishes consuming one send() stream
  // before starting the next, so a single slot is enough.
  let active: { threadId: string; state: EveSessionCursor } | null = null;

  const send: ChatLLM["send"] = async ({ messages, threadId, signal }): Promise<Response> => {
    const state = sessions.get(threadId) ?? { streamIndex: 0 };

    const deliverPath = state.sessionId
      ? `${EVE_PREFIX}/session/${encodeURIComponent(state.sessionId)}`
      : `${EVE_PREFIX}/session`;
    const deliverBody: Record<string, unknown> = { message: latestUserText(messages) };
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

    const streamIndex = state.sessionId === sessionId ? state.streamIndex : 0;
    active = { threadId, state: { sessionId, continuationToken, streamIndex } };

    const streamPath =
      `${EVE_PREFIX}/session/${encodeURIComponent(sessionId)}/stream` +
      (streamIndex > 0 ? `?startIndex=${streamIndex}` : "");

    const streamed = await fetch(streamPath, { signal });
    if (!streamed.ok || !streamed.body) {
      throw new Error(`Eve session stream GET failed (${streamed.status}).`);
    }
    return streamed;
  };

  return {
    send,
    streamProtocol: eveAdapter({
      onEvent: (event) => {
        if (!active) return;
        const { threadId, state } = active;
        // A completed session is spent: reset so the next message starts a
        // fresh one. Waiting/failed keep the cursor for a resumable read.
        if (event.type === "session.completed") {
          active = null;
          sessions.set(threadId, { streamIndex: 0 });
          return;
        }
        active.state = { ...state, streamIndex: state.streamIndex + 1 };
        sessions.set(threadId, active.state);
        if (event.type === "session.waiting" || event.type === "session.failed") {
          active = null;
        }
      },
    }),
  };
}
