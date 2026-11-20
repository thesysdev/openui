import { defineState } from "eve/context";
import { defineHook } from "eve/hooks";

/** The Eve session ID; agent.ts sends it to the Gateway as the session ID. */
export const gatewaySessionId = defineState<string>("openui.gatewaySessionId", () => "");

/** Keeps the session ID for the model calls of each turn. */
export default defineHook({
  events: {
    "turn.started"(_event, ctx) {
      gatewaySessionId.update(() => ctx.session.id);
    },
  },
});
