import { createOpenAI } from "@ai-sdk/openai";
import { AISDKToolkit } from "@assistant-ui/ai-sdk";
import { APICallError, convertToModelMessages, stepCountIs, streamText, type UIMessage } from "ai";
import { baseUrl } from "../../../lib/openui";
import { chatPrompt } from "../../../lib/prompt";
import toolkit from "../../../lib/toolkit";

export const runtime = "nodejs";

// The toolkit's server build: create_dashboard and edit_dashboard, with their `execute`.
const dashboardTools = new AISDKToolkit({ toolkit });

export async function POST(request: Request) {
  // assistant-ui sends the whole thread; the browser keeps it.
  const { messages } = (await request.json()) as { messages: UIMessage[] };
  const apiKey = process.env.THESYS_API_KEY;
  if (!apiKey) throw new Error("Set THESYS_API_KEY in .env.local, then restart.");

  // The chat runs on OpenUI Gateway's Chat Completions API, with the same key as the dashboards.
  const gateway = createOpenAI({ apiKey, baseURL: `${baseUrl}/v1/embed` });
  const tools = await dashboardTools.tools();

  const result = streamText({
    model: gateway.chat(process.env.OPENUI_MODEL || "anthropic/claude-sonnet-5.5"),
    system: chatPrompt,
    messages: await convertToModelMessages(messages, { tools }),
    tools,
    // Calls the dashboard tools the model asks for, then lets it reply.
    stopWhen: stepCountIs(4),
    abortSignal: request.signal,
    // The gateway already falls back across providers; retrying here only delays the error.
    maxRetries: 0,
  });
  return result.toUIMessageStreamResponse({ onError: errorMessage });
}

// Show the gateway's own error message in the chat; anything else stays in the server log.
function errorMessage(error: unknown) {
  console.error(error);
  return APICallError.isInstance(error)
    ? error.message
    : "Something went wrong. Check the server logs.";
}
