import { createOpenAI } from "@ai-sdk/openai";
import { defineAgent } from "eve";

const apiKey = process.env.THESYS_API_KEY;
if (!apiKey) throw new Error("Missing required env var: THESYS_API_KEY");

const openai = createOpenAI({
  apiKey,
  baseURL: "https://api.thesys.dev/v1/embed",
});

const model = openai.chat(
  process.env.OPENUI_MODEL ?? "google/gemini-3.6-flash-free",
);

export default defineAgent({
  model,
  // Thesys embed model ids are not in the Vercel AI Gateway catalog; without
  // this override Eve can't size compaction and agent compile fails (no /eve routes).
  modelContextWindowTokens: 1_048_576,
  build: {
    externalDependencies: ["@openuidev/lang-core"],
  },
});
