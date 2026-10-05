import { generateSystemPrompt } from "@openuidev/lang-core";
import { defineDynamic, defineInstructions } from "eve/instructions";
// Eve's runtime module-map loads this file as native ESM, so relative
// imports need an explicit .ts extension. JSON imports also need the
// `with { type: "json" }` attribute.
import librarySpec from "../../src/generated/spec.json" with { type: "json" };
import { promptOptions } from "../../src/lib/prompt-options.ts";

/**
 * Teach the agent to answer in OpenUI Lang. Resolved once per session so the
 * component-library prompt is only attached when a conversation starts.
 */
export default defineDynamic({
  events: {
    "session.started": () =>
      defineInstructions({
        markdown: generateSystemPrompt({ library: librarySpec, promptOptions }),
      }),
  },
});
