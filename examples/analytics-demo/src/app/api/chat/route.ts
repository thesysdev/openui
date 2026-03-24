import { readFileSync } from "fs";
import { NextRequest } from "next/server";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions.mjs";
import { join } from "path";

import { tools } from "@/tools/analytics-tools";

const systemPrompt = readFileSync(join(process.cwd(), "src/generated/system-prompt.txt"), "utf-8");

const analyticsSystemPrompt = `${systemPrompt}

You are an analytics assistant. When users ask analytics questions, use the available tools to fetch data, then present the results using charts, tables, and metric cards in openui-lang.

Guidelines for analytics responses:
- Use LineChart or AreaChart for time-series data (revenue over months, trends).
- Use BarChart for comparisons across categories (products, regions, quarters).
- Use PieChart for proportional breakdowns (market share, segment distribution).
- Use Table for detailed data with multiple columns.
- Use TextContent with "large-heavy" size for key metric values.
- Combine multiple visualizations in a single Card when the data supports it (e.g., a summary metric at the top, chart below, table at the bottom).
- Use Callout for notable insights or highlights from the data.
- Always include a title for each visualization.
`;

// ── SSE helpers ──

function sseToolCallStart(
  encoder: TextEncoder,
  tc: { id: string; function: { name: string } },
  index: number,
) {
  return encoder.encode(
    `data: ${JSON.stringify({
      id: `chatcmpl-tc-${tc.id}`,
      object: "chat.completion.chunk",
      choices: [{
        index: 0,
        delta: {
          tool_calls: [{ index, id: tc.id, type: "function", function: { name: tc.function.name, arguments: "" } }],
        },
        finish_reason: null,
      }],
    })}\n\n`,
  );
}

function sseToolCallArgs(
  encoder: TextEncoder,
  tc: { id: string; function: { arguments: string } },
  result: string,
  index: number,
) {
  let enrichedArgs: string;
  try {
    enrichedArgs = JSON.stringify({ _request: JSON.parse(tc.function.arguments), _response: JSON.parse(result) });
  } catch {
    enrichedArgs = tc.function.arguments;
  }
  return encoder.encode(
    `data: ${JSON.stringify({
      id: `chatcmpl-tc-${tc.id}-args`,
      object: "chat.completion.chunk",
      choices: [{
        index: 0,
        delta: { tool_calls: [{ index, function: { arguments: enrichedArgs } }] },
        finish_reason: null,
      }],
    })}\n\n`,
  );
}

// ── Route handler ──

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const model = process.env.OPENAI_MODEL ?? "gpt-4.1";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cleanMessages = (messages as any[])
    .filter((m) => m.role !== "tool")
    .map((m) => {
      if (m.role === "assistant" && m.tool_calls?.length) {
        const { tool_calls: _tc, ...rest } = m; // eslint-disable-line @typescript-eslint/no-unused-vars
        return rest;
      }
      return m;
    });

  const chatMessages: ChatCompletionMessageParam[] = [
    { role: "system", content: analyticsSystemPrompt },
    ...cleanMessages,
  ];

  const encoder = new TextEncoder();
  let controllerClosed = false;

  const readable = new ReadableStream({
    start(controller) {
      const enqueue = (data: Uint8Array) => {
        if (controllerClosed) return;
        try { controller.enqueue(data); } catch { /* already closed */ }
      };
      const close = () => {
        if (controllerClosed) return;
        controllerClosed = true;
        try { controller.close(); } catch { /* already closed */ }
      };

      const pendingCalls: Array<{ id: string; name: string; arguments: string }> = [];
      let callIdx = 0;
      let resultIdx = 0;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const runner = (client.chat.completions as any).runTools({
        model,
        messages: chatMessages,
        tools,
        stream: true,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      runner.on("functionToolCall", (fc: any) => {
        const id = `tc-${callIdx}`;
        pendingCalls.push({ id, name: fc.name, arguments: fc.arguments });
        enqueue(sseToolCallStart(encoder, { id, function: { name: fc.name } }, callIdx));
        callIdx++;
      });

      runner.on("functionToolCallResult", (result: string) => {
        const tc = pendingCalls[resultIdx];
        if (tc) {
          enqueue(sseToolCallArgs(encoder, { id: tc.id, function: { arguments: tc.arguments } }, result, resultIdx));
        }
        resultIdx++;
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      runner.on("chunk", (chunk: any) => {
        const choice = chunk.choices?.[0];
        const delta = choice?.delta;
        if (!delta) return;
        if (delta.content) {
          enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
        }
        if (choice?.finish_reason === "stop") {
          enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
        }
      });

      runner.on("end", () => {
        enqueue(encoder.encode("data: [DONE]\n\n"));
        close();
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      runner.on("error", (err: any) => {
        const msg = err instanceof Error ? err.message : "Stream error";
        console.error("Chat route error:", msg);
        enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
        close();
      });
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
