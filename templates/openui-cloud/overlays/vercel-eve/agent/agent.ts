import { createOpenAI } from "@ai-sdk/openai";
import { defineAgent } from "eve";
import { withCloudConversation } from "./cloud-conversation.ts";
import { resolveOpenuiModel } from "../src/lib/models.ts";

const apiKey = process.env.THESYS_API_KEY;
if (!apiKey) throw new Error("Missing required env var: THESYS_API_KEY");

const openai = createOpenAI({
  apiKey,
  baseURL: "https://api.thesys.dev/v1/embed",
});

const model = withCloudConversation(
  openai.responses(resolveOpenuiModel(process.env.OPENUI_MODEL)),
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
