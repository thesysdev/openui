import { createOpenAI } from "@ai-sdk/openai";
import { defineAgent } from "eve";
import { gatewaySessionId } from "./hooks/gateway-session";

const apiKey = process.env.THESYS_API_KEY;
if (!apiKey) throw new Error("Missing required env var: THESYS_API_KEY");

const openai = createOpenAI({
  apiKey,
  baseURL: "https://api.thesys.dev/v1/embed",
  // Sends the OpenUI thread ID, so the Gateway groups a chat's turns into one session.
  fetch: (input, init) => {
    let sessionId = "";
    try {
      sessionId = gatewaySessionId.get();
    } catch {
      // Not in an Eve session: send no session ID.
    }
    if (!sessionId) return fetch(input, init);
    const headers = new Headers(init?.headers);
    headers.set("x-thesys-session-id", sessionId);
    return fetch(input, { ...init, headers });
  },
});

const model = openai.chat(
  process.env.OPENUI_MODEL ?? "google/gemini-3.6-flash-free",
);

export default defineAgent({
  model,
  modelContextWindowTokens: 1_048_576,
  build: {
    externalDependencies: ["@openuidev/lang-core"],
  },
});
