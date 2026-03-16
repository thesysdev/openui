import { readFileSync } from "fs";
import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest } from "next/server";
import { join } from "path";

import { tools as toolDefinitions } from "@/tools/analytics-tools";

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

// Map JSON Schema types to Google GenAI types.
const typeMap: Record<string, string> = {
  string: Type.STRING,
  number: Type.NUMBER,
  boolean: Type.BOOLEAN,
  object: Type.OBJECT,
  array: Type.ARRAY,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapProperties(props: Record<string, any>): Record<string, any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: Record<string, any> = {};
  for (const [key, val] of Object.entries(props)) {
    result[key] = { type: typeMap[val.type] ?? Type.STRING, description: val.description };
  }
  return result;
}

// Build Google GenAI function declarations and a lookup for implementations.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const toolImpls: Record<string, (args: any) => Promise<string>> = {};
const functionDeclarations = toolDefinitions.map((t) => {
  toolImpls[t.function.name] = t.function.function;
  const props = t.function.parameters?.properties ?? {};
  return {
    name: t.function.name,
    description: t.function.description,
    parameters: {
      type: Type.OBJECT,
      properties: mapProperties(props),
      required: t.function.parameters?.required ?? [],
    },
  };
});

// ── SSE helper (OpenAI-compatible format for openAIAdapter on the client) ──

function sseContentChunk(encoder: TextEncoder, content: string): Uint8Array {
  return encoder.encode(
    `data: ${JSON.stringify({
      id: "chatcmpl-analytics",
      object: "chat.completion.chunk",
      choices: [{ index: 0, delta: { content }, finish_reason: null }],
    })}\n\n`,
  );
}

// ── Route handler ──

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

  // Convert OpenAI-format messages to Google GenAI contents.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const contents: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const msg of messages as any[]) {
    if (msg.role === "tool") continue;
    const role = msg.role === "assistant" ? "model" : "user";
    if (msg.content) {
      contents.push({ role, parts: [{ text: msg.content }] });
    }
  }

  const encoder = new TextEncoder();
  let controllerClosed = false;

  const readable = new ReadableStream({
    async start(controller) {
      const enqueue = (data: Uint8Array) => {
        if (controllerClosed) return;
        try { controller.enqueue(data); } catch { /* already closed */ }
      };
      const close = () => {
        if (controllerClosed) return;
        controllerClosed = true;
        try { controller.close(); } catch { /* already closed */ }
      };

      try {
        const config = {
          tools: [{ functionDeclarations }],
          systemInstruction: analyticsSystemPrompt,
        };

        // Tool-calling loop: the model may request tools before producing text.
        const MAX_TOOL_ROUNDS = 5;
        for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
          const response = await ai.models.generateContentStream({
            model,
            contents,
            config,
          });

          let hasToolCalls = false;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const functionResponses: any[] = [];

          for await (const chunk of response) {
            // Stream text content to the client.
            if (chunk.text) {
              enqueue(sseContentChunk(encoder, chunk.text));
            }

            // Collect function calls.
            if (chunk.functionCalls && chunk.functionCalls.length > 0) {
              hasToolCalls = true;
              for (const fc of chunk.functionCalls) {
                const impl = toolImpls[fc.name];
                let result: string;
                if (impl) {
                  try {
                    result = await impl(fc.args ?? {});
                  } catch (err) {
                    result = JSON.stringify({ error: String(err) });
                  }
                } else {
                  result = JSON.stringify({ error: `Unknown tool: ${fc.name}` });
                }

                functionResponses.push({
                  name: fc.name,
                  response: JSON.parse(result),
                });
              }
            }
          }

          if (hasToolCalls && functionResponses.length > 0) {
            // Add the model's function call to conversation history.
            contents.push({
              role: "model",
              parts: functionResponses.map((fr) => ({
                functionCall: { name: fr.name, args: {} },
              })),
            });

            // Add function results.
            contents.push({
              role: "user",
              parts: functionResponses.map((fr) => ({
                functionResponse: { name: fr.name, response: fr.response },
              })),
            });

            continue;
          }

          break;
        }

        enqueue(encoder.encode("data: [DONE]\n\n"));
        close();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Stream error";
        console.error("Chat route error:", msg, err);
        enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`));
        enqueue(encoder.encode("data: [DONE]\n\n"));
        close();
      }
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
