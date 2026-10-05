import { cloudInstructions } from "../../src/lib/cloud-prompt";
import { defineDynamic, defineInstructions } from "eve/instructions";

/**
 * Teach the agent to answer in OpenUI Lang. Resolved once per session so the
 * component-library prompt is only attached when a conversation starts.
 */
export default defineDynamic({
  events: {
    "session.started": () =>
      defineInstructions({
        markdown: cloudInstructions(),
      }),
  },
});
