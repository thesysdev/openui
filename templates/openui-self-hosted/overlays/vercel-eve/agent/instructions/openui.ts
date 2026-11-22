import { generateSystemPrompt } from "@openuidev/lang-core";
import { defineDynamic, defineInstructions } from "eve/instructions";
// Eve's runtime module-map loads this file as native ESM, so relative
// imports need an explicit .ts extension. JSON imports also need the
// `with { type: "json" }` attribute.
import librarySpec from "../../src/generated/spec.json" with { type: "json" };

// The generated spec carries the library and its prompt options; generateSystemPrompt takes them separately.
const { promptOptions, ...library } = librarySpec;

/**
 * Teach the agent to answer in OpenUI Lang. Resolved once per session so the
 * component-library prompt is only attached when a conversation starts.
 */
export default defineDynamic({
  events: {
    "session.started": () =>
      defineInstructions({
        markdown: generateSystemPrompt({ library, promptOptions }),
      }),
  },
});
