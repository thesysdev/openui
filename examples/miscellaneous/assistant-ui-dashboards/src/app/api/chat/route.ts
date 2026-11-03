import { createOpenAI } from "@ai-sdk/openai";
import { AISDKToolkit } from "@assistant-ui/ai-sdk";
import { convertToModelMessages, stepCountIs, streamText, type UIMessage } from "ai";
import { storeTurn } from "../../../lib/history";
import { baseUrl } from "../../../lib/openui";
import { chatPrompt } from "../../../lib/prompt";
import toolkit from "../../../lib/toolkit";

export const runtime = "nodejs";

// The toolkit's server build: create_dashboard and edit_dashboard, with their `execute`.
const dashboardTools = new AISDKToolkit({ toolkit });

export async function POST(request: Request) {
  // assistant-ui sends the whole thread, and as `id` the OpenUI Cloud conversation it belongs to.
  const { messages, id: conversationId } = (await request.json()) as {
    messages: UIMessage[];
    id?: string;
  };
  const apiKey = process.env.THESYS_API_KEY;
  if (!apiKey) throw new Error("Set THESYS_API_KEY in .env.local, then restart.");

  // OpenUI Gateway's Chat Completions API, which reaches any `provider/model` with one key.
  const gateway = createOpenAI({ apiKey, baseURL: `${baseUrl}/v1/embed` });
  const tools = await dashboardTools.tools();
  const modelMessages = await convertToModelMessages(messages, { tools });
  const question = modelMessages.at(-1);

  const result = streamText({
    model: gateway.chat(process.env.OPENUI_MODEL || "openai/gpt-5.5"),
    system: chatPrompt,
    messages: modelMessages,
    tools,
    // Calls the dashboard tools the model asks for, then lets it reply.
    stopWhen: stepCountIs(4),
    abortSignal: request.signal,
    // Saves the finished turn to the conversation, so the thread reloads with its dashboards.
    onEnd: async ({ responseMessages }) => {
      if (!conversationId || question?.role !== "user") return;
      try {
        await storeTurn(conversationId, [question, ...responseMessages]);
      } catch (error) {
        console.error("Couldn't save the turn to OpenUI Cloud:", error);
      }
    },
  });
  return result.toUIMessageStreamResponse();
}
