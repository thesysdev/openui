import { tools } from "@/lib/tools";
import { openai } from "@ai-sdk/openai";
import { type UIMessage, convertToModelMessages, stepCountIs, streamText } from "ai";

const mainAgentSystemPrompt = `You are the main orchestrator agent. You MUST use tools to handle user requests — never answer with plain text when a tool can do the job.

MANDATORY RULE — analytics_subagent:
You MUST call the analytics_subagent tool IMMEDIATELY (on your very first step, with no preceding text) for ANY request involving:
  • charts, graphs, plots, visualizations, dashboards
  • tables, data grids, directories, lists of structured data
  • forms, signup forms, contact forms, input layouts
  • KPI cards, summaries, reports, metrics, statistics
  • any UI component, layout, or interactive element
Do NOT respond with text first. Do NOT describe what you will do. Call the tool directly as your first action.

When calling analytics_subagent:
- Pass a detailed task description including all data, fields, layout preferences, and constraints from the user's message.
- Include specific numbers, names, categories, and any example data the user provided.

When NOT to use analytics_subagent:
- Only skip it for purely conversational messages (greetings, opinions, simple factual Q&A with no visual component).
- When in doubt, USE the analytics_subagent.

After the tool returns:
- Add only a brief 1-2 sentence summary. Do not narrate your process.
- Never generate OpenUI, XML, HTML, JSX, or UI markup directly in your text response.`;

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
