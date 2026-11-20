import { none } from "eve/channels/auth";
import { defaultEveAuth, eveChannel } from "eve/channels/eve";

import { THREAD_ID_ATTRIBUTE } from "../hooks/gateway-session";

/** Header the browser sends with the OpenUI thread ID; see src/eve-chat.ts. */
const THREAD_ID_HEADER = "x-openui-thread-id";

/**
 * Eve's built-in HTTP channel: serves `/eve/v1/session*` (deliver + resumable
 * NDJSON event stream). `none()` allows anonymous traffic for local development —
 * swap in `bearer()` / `basic()` before exposing this publicly.
 */
export default eveChannel({
  auth: none(),
  // Carry the OpenUI thread ID into the session, so hooks/gateway-session.ts can
  // send it to the Gateway as the session ID.
  onMessage(ctx) {
    const auth = defaultEveAuth(ctx);
    const threadId = ctx.eve.request.headers.get(THREAD_ID_HEADER)?.trim();
    if (!auth || !threadId) return { auth };
    return {
      auth: { ...auth, attributes: { ...auth.attributes, [THREAD_ID_ATTRIBUTE]: threadId } },
    };
  },
});
