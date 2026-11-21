import { defineState } from "eve/context";
import { defineHook, type HookContext } from "eve/hooks";

/** Session auth attribute carrying the OpenUI thread ID; set in channels/eve.ts. */
export const THREAD_ID_ATTRIBUTE = "openuiThreadId";

/** The OpenUI thread ID; agent.ts sends it to the Gateway as the session ID. */
export const gatewaySessionId = defineState<string>("openui.gatewaySessionId", () => "");

function threadIdOf(ctx: HookContext): string {
  const value = ctx.session.auth.current?.attributes[THREAD_ID_ATTRIBUTE];
  return typeof value === "string" && value.trim() && !/\p{Cc}/u.test(value) ? value : "";
}

/** Keeps the thread ID for the model calls of each turn. */
export default defineHook({
  events: {
    "turn.started"(_event, ctx) {
      gatewaySessionId.update(() => threadIdOf(ctx));
    },
  },
});
