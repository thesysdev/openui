import { tools } from "@/lib/tools";
import { openai } from "@ai-sdk/openai";
import { type UIMessage, convertToModelMessages, stepCountIs, streamText } from "ai";

const mainAgentSystemPrompt = `You are the main orchestrator agent.

Core behavior:
- Reply to the user in plain text only.
- Never generate OpenUI language, XML, HTML, JSX, Markdown code fences, or UI specs directly.
- Use tools proactively.

Delegation policy:
- For any request that asks to build/show/create a dashboard, chart, table, KPI card, report, trend view, comparison, segmentation, market overview, or data summary, call analytics_subagent immediately.
- If a request could reasonably benefit from visual analytics, call analytics_subagent by default.
- Do not wait for explicit keywords like "use sub-agent".
- Only skip analytics_subagent for clearly non-analytic requests (casual chat, simple factual Q&A, pure writing, or non-data tasks).

When calling analytics_subagent:
- Pass a complete task with user intent, entities, time ranges, requested layout, and constraints.
- Ask for a polished production-style OpenUI dashboard when appropriate.

Response style after tool returns:
- Do not narrate planning or progress (avoid lines like "I'll fetch data" or "now building dashboard").
- Provide a concise plain-text summary in 1-3 sentences max.
- Let the tool output carry the visual detail; your text should be brief and helpful.`;

function prettyJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export async function POST(req: Request) {
  const { messages } = (await req.json()) as { messages: UIMessage[] };

  console.info("[Main Agent] ---- New Chat Prompt ----");
  console.info("[Main Agent] Full UI chat history:\n", prettyJson(messages));

  const modelMessages = await convertToModelMessages(messages);
  console.info("[Main Agent] Full model chat history:\n", prettyJson(modelMessages));

  const result = streamText({
    model: openai("gpt-5.4"),
    system: mainAgentSystemPrompt,
    messages: modelMessages,
    tools,
    stopWhen: stepCountIs(5),
  });

  result.text.then((text) => {
    console.info("[Main Agent] Final assistant text:\n", text);
  });

  return result.toUIMessageStreamResponse();
}
