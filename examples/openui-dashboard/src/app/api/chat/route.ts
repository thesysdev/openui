import { NextRequest } from "next/server";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions.mjs";
import { generatePrompt } from "@openuidev/lang-core";
import { promptSpec } from "@/prompt-config";
import { sseResponseFromRunner } from "@/lib/sse-stream";
import { createConnectedLinearMcpClient } from "@/lib/linear-mcp";
import { linearMcpToolsToOpenAI } from "@/lib/linear-openai-tools";

function buildSystemPrompt(toolSpecs: ReturnType<typeof linearMcpToolsToOpenAI>["toolSpecs"]): string {
  return generatePrompt({
    ...promptSpec,
    tools: toolSpecs,
  });
}

export async function POST(req: NextRequest) {
  const { messages } = (await req.json()) as { messages: ChatCompletionMessageParam[] };

  const apiKey = process.env.LLM_API_KEY || process.env.OPENAI_API_KEY || "";
  const baseURL = process.env.LLM_BASE_URL || "https://api.openai.com/v1";
  const model = process.env.LLM_MODEL || "gpt-5.4";

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "Set LLM_API_KEY or OPENAI_API_KEY env var" }),
      { status: 500 },
    );
  }

  let mcpClient;
  try {
    mcpClient = await createConnectedLinearMcpClient();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Linear MCP connection failed";
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }

  const { tools: mcpTools } = await mcpClient.listTools();
  const { openaiTools, toolSpecs } = linearMcpToolsToOpenAI(mcpTools, mcpClient);

  const client = new OpenAI({ apiKey, baseURL });
  const runner = client.chat.completions.runTools({
    model,
    messages: [{ role: "system" as const, content: buildSystemPrompt(toolSpecs) }, ...messages],
    tools: openaiTools,
    stream: true,
    stream_options: { include_usage: true },
  });

  runner.on("totalUsage", (usage) => {
    console.log("[chat] Token usage (total):", usage);
  });
  runner.on("chatCompletion", (completion) => {
    if (completion.usage) {
      console.log("[chat] Token usage (round):", completion.usage);
    }
  });

  let mcpClosed = false;
  const closeMcp = () => {
    if (mcpClosed) return;
    mcpClosed = true;
    void mcpClient.close();
  };
  runner.on("end", closeMcp);
  runner.on("error", closeMcp);

  return sseResponseFromRunner(runner);
}
