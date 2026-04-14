import { readFileSync } from "fs";
import { join } from "path";
import { NextRequest } from "next/server";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions.mjs";
import { tools, setCurrentThreadId } from "./tools";

const generatedPrompt = readFileSync(
  join(process.cwd(), "src/generated/system-prompt.txt"),
  "utf-8"
);

const SPREADSHEET_INSTRUCTIONS = `
You are a helpful spreadsheet assistant. The user has a live Excel-like spreadsheet visible on the left panel at all times.

CAPABILITIES:
- View and analyze the current table data via the get_table_data tool
- Update individual cells or ranges
- Add formulas (386+ Excel-compatible functions: SUM, AVERAGE, IF, VLOOKUP, etc.)
- Add or delete rows and columns
- Query/filter data

CRITICAL RULES:

1. DO NOT modify the spreadsheet unless the user explicitly asks you to. Requests like "visualize", "show me", "analyze", "summarize" are READ-ONLY. For these, NEVER call update_cells, add_rows, delete_rows, set_formula, or add_column.

2. For READ-ONLY requests: use TextContent, MarkDownRenderer, Table, BarChart, LineChart, PieChart to display information. Do NOT use SpreadsheetTable for read-only requests.

3. For WRITE requests (user explicitly asks to change/add/delete data):
   a. Use the modification tools (update_cells, add_rows, delete_rows, set_formula, add_column).
   b. IMMEDIATELY after add_rows or delete_rows, ALWAYS call recalculate_aggregates to update Total/Average/Sum formulas.
   c. Then call get_table_data to get the updated data.
   d. Then you MUST emit a SpreadsheetTable component with the full updated data and colHeaders. This is how the live spreadsheet gets refreshed. Include it at the END of your response.
   e. Also include a TextContent message explaining what you changed.

4. Only call get_table_data when you need to read data (to answer a question or before/after a modification).

5. For tool calls, use zero-based indices (row 0, col 0 = cell A1). Cell references in formulas use Excel notation (A1, B2, etc.).

6. Common formulas: =SUM(range), =AVERAGE(range), =COUNT(range), =MAX(range), =MIN(range), =IF(condition, true_val, false_val)

IMPORTANT — OUTPUT FORMAT:
You MUST ALWAYS respond using OpenUI Lang syntax as described below. NEVER output plain text or markdown. Every response must define root = Stack([...]). Use TextContent for text paragraphs, MarkDownRenderer for formatted text, Table for tabular summaries, chart components for visualizations, and SpreadsheetTable ONLY after write operations to sync changes to the live spreadsheet.

FOLLOW-UP BUTTONS:
At the END of every response, ALWAYS include 2-3 follow-up suggestion buttons using Buttons([...]) with Button components. These help the user continue the conversation. Buttons without an Action prop automatically send their label as a message to you.

Examples of good follow-ups:
- After showing a summary: "Visualize this data", "Add a new product", "Show growth trends"
- After a modification: "Undo this change", "Show me the updated data", "Add another row"
- After a chart: "Break down by product", "Show as a table instead", "Compare Q1 vs Q4"

The follow-up buttons should be contextually relevant to what you just did.
`;

const systemPrompt = SPREADSHEET_INSTRUCTIONS + "\n\n" + generatedPrompt;

/* eslint-disable @typescript-eslint/no-explicit-any */
function extractText(msg: any): string {
  const content = msg?.content;
  if (typeof content === "string") {
    try {
      const parsed = JSON.parse(content);
      if (parsed?.parts)
        return parsed.parts
          .filter((p: any) => p.type === "text")
          .map((p: any) => p.text)
          .join("");
    } catch {
      /* plain string */
    }
    return content;
  }
  if (Array.isArray(content))
    return content
      .filter((p: any) => p.type === "text")
      .map((p: any) => p.text)
      .join("");
  return JSON.stringify(msg);
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function sseToolCallStart(
  encoder: TextEncoder,
  tc: { id: string; function: { name: string } },
  index: number
) {
  return encoder.encode(
    `data: ${JSON.stringify({
      id: `chatcmpl-tc-${tc.id}`,
      object: "chat.completion.chunk",
      choices: [
        {
          index: 0,
          delta: {
            tool_calls: [
              {
                index,
                id: tc.id,
                type: "function",
                function: { name: tc.function.name, arguments: "" },
              },
            ],
          },
          finish_reason: null,
        },
      ],
    })}\n\n`
  );
}

function sseToolCallArgs(
  encoder: TextEncoder,
  tc: { id: string; function: { arguments: string } },
  result: string,
  index: number
) {
  let enrichedArgs: string;
  try {
    enrichedArgs = JSON.stringify({
      _request: JSON.parse(tc.function.arguments),
      _response: JSON.parse(result),
    });
  } catch {
    enrichedArgs = tc.function.arguments;
  }
  return encoder.encode(
    `data: ${JSON.stringify({
      id: `chatcmpl-tc-${tc.id}-args`,
      object: "chat.completion.chunk",
      choices: [
        {
          index: 0,
          delta: {
            tool_calls: [{ index, function: { arguments: enrichedArgs } }],
          },
          finish_reason: null,
        },
      ],
    })}\n\n`
  );
}

export async function POST(req: NextRequest) {
  const { messages, threadId } = await req.json();

  setCurrentThreadId(threadId ?? "default");

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const lastUserMsg = (messages as any[])
    .filter((m: any) => m.role === "user")
    .pop();
  if (lastUserMsg) extractText(lastUserMsg);

  const cleanMessages = (messages as any[])
    .filter((m) => m.role !== "tool")
    .map((m) => {
      if (m.role === "assistant" && m.tool_calls?.length) {
        const { tool_calls: _tc, ...rest } = m;
        return rest;
      }
      return m;
    });
  /* eslint-enable @typescript-eslint/no-explicit-any */

  const chatMessages: ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...cleanMessages,
  ];

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const encoder = new TextEncoder();
  let controllerClosed = false;

  const readable = new ReadableStream({
    start(controller) {
      const enqueue = (data: Uint8Array) => {
        if (controllerClosed) return;
        try {
          controller.enqueue(data);
        } catch {
          /* closed */
        }
      };
      const close = () => {
        if (controllerClosed) return;
        controllerClosed = true;
        try {
          controller.close();
        } catch {
          /* closed */
        }
      };

      let fullResponse = "";
      const pendingCalls: Array<{
        id: string;
        name: string;
        arguments: string;
      }> = [];
      let callIdx = 0;
      let resultIdx = 0;

      /* eslint-disable @typescript-eslint/no-explicit-any */
      const runner = (client.chat.completions as any).runTools({
        model: process.env.OPENAI_MODEL || "gpt-4o",
        messages: chatMessages,
        tools,
        stream: true,
      });

      runner.on("functionToolCall", (fc: any) => {
        const id = `tc-${callIdx}`;
        pendingCalls.push({ id, name: fc.name, arguments: fc.arguments });
        enqueue(
          sseToolCallStart(encoder, { id, function: { name: fc.name } }, callIdx)
        );
        callIdx++;
      });

      runner.on("functionToolCallResult", (result: string) => {
        const tc = pendingCalls[resultIdx];
        if (tc) {
          enqueue(
            sseToolCallArgs(
              encoder,
              { id: tc.id, function: { arguments: tc.arguments } },
              result,
              resultIdx
            )
          );
        }
        resultIdx++;
      });

      runner.on("chunk", (chunk: any) => {
        const choice = chunk.choices?.[0];
        const delta = choice?.delta;
        if (!delta) return;
        if (delta.content) {
          fullResponse += delta.content;
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

      runner.on("error", (err: any) => {
        const msg = err instanceof Error ? err.message : "Stream error";
        console.error("Chat route error:", msg);
        enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`)
        );
        close();
      });
      /* eslint-enable @typescript-eslint/no-explicit-any */
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
