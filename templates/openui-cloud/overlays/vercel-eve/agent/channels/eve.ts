import { none } from "eve/channels/auth";
import { defaultEveAuth, eveChannel } from "eve/channels/eve";
import { assertConversationAccess } from "../../src/lib/chat-completion-history.ts";

/** Browser `createEveLLM` sends the Cloud conversation id on every session POST. */
const OPENUI_CONVERSATION_HEADER = "x-openui-conversation-id";
const CONVERSATION_ATTRIBUTE = "openuiConversationId";

/**
 * Eve's built-in HTTP channel: serves `/eve/v1/session*` (deliver + resumable
 * NDJSON event stream). `none()` allows anonymous traffic for local development —
 * swap in `bearer()` / `basic()` before exposing this publicly.
 *
 * `onMessage` copies the Cloud conversation id onto session auth so the persist
 * hook can append this turn without putting the id in model context.
 */
export default eveChannel({
  auth: none(),
  uploadPolicy: "disabled",
  async onMessage(ctx) {
    const caller = defaultEveAuth(ctx);
    const conversationId = await assertConversationAccess(
      ctx.eve.request.headers.get(OPENUI_CONVERSATION_HEADER)?.trim(),
    );
    if (!caller) throw new Error("Missing Eve caller");

    return {
      auth: {
        ...caller,
        attributes: {
          ...caller.attributes,
          [CONVERSATION_ATTRIBUTE]: conversationId,
        },
      },
    };
  },
});
