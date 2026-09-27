import { generateSystemPrompt } from "@openuidev/lang-core";
import { defineDynamic, defineInstructions } from "eve/instructions";
import librarySpec from "../../src/generated/spec.json" with { type: "json" };

/**
 * Teach the agent to answer in OpenUI Lang. Resolved once per session so the
 * Cloud system prompt is only attached when a conversation starts.
 */
export default defineDynamic({
  events: {
    "session.started": () =>
      defineInstructions({
        markdown: generateSystemPrompt({
          cloud: true,
          library: librarySpec,
          instructions:
            "Forms must send the current input values to the assistant on submit; use reactive bindings for conditional fields. Do not use a local visibility toggle to reveal a pre-written summary.",
        }),
      }),
  },
});
