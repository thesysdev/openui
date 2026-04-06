import { NextRequest } from "next/server";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions.mjs";
import { generatePrompt, type ToolSpec } from "@openuidev/lang-core";
import { promptSpec } from "../../../prompt-config";
import { tools as toolDefs } from "../../../tools";
import { z } from "zod";

// ── Convert shared Zod registry → OpenAI function-calling format ──

function zodToJsonSchema(schema: Record<string, z.ZodType>): Record<string, unknown> {
  const properties: Record<string, unknown> = {};
  const required: string[] = [];
  for (const [key, zodSchema] of Object.entries(schema)) {
    const jsonSchema = z.toJSONSchema(zodSchema);
    properties[key] = jsonSchema;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const def = (zodSchema as any)?._zod?.def;
    if (def?.type !== "optional") {
      required.push(key);
    }
  }
  return { type: "object", properties, ...(required.length ? { required } : {}) };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const tools: any[] = toolDefs.map((t) => ({
  type: "function" as const,
  function: {
    name: t.name,
    description: t.description,
    parameters: zodToJsonSchema(t.inputSchema),
    function: async (args: Record<string, unknown>) => JSON.stringify(await t.execute(args)),
    parse: JSON.parse,
  },
}));

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
          delta: { tool_calls: [{ index, function: { arguments: enrichedArgs } }] },
          finish_reason: null,
        },
      ],
    })}\n\n`,
  );
}

// ── Dynamic system prompt ──

function buildSystemPrompt(): string {
  const mcpTools: ToolSpec[] = toolDefs.map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: zodToJsonSchema(t.inputSchema),
    outputSchema: z.toJSONSchema(t.outputSchema) as Record<string, unknown>,
  }));

  return generatePrompt({
    ...promptSpec,
    tools: mcpTools,
  });
}

// ── Route handler using runTools ──

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  // LLM config from env — supports OpenAI-compatible providers (OpenAI, OpenRouter, etc.)
  const apiKey = process.env.LLM_API_KEY ?? process.env.OPENAI_API_KEY ?? "";
  const baseURL = process.env.LLM_BASE_URL; // e.g. "https://openrouter.ai/api/v1"
  const model = process.env.LLM_MODEL ?? "openai/gpt-5.4-mini";

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "Set LLM_API_KEY or OPENAI_API_KEY env var" }),
      { status: 500 },
    );
  }

  const client = new OpenAI({
    apiKey,
    ...(baseURL ? { baseURL } : {}),
  });

  const cleanMessages = (messages as any[])
    .filter((m: any) => m.role !== "tool")
    .map((m: any) => {
      if (m.role === "assistant" && m.tool_calls?.length) {
        const { tool_calls: _tc, ...rest } = m;
        return rest;
      }
      return m;
    });

  const systemPrompt = buildSystemPrompt();
  const chatMessages: ChatCompletionMessageParam[] = [
    { role: "system" as const, content: systemPrompt },
    ...cleanMessages,
  ];

  const encoder = new TextEncoder();
  let controllerClosed = false;

  const readable = new ReadableStream({
    start(controller) {
      const enqueue = (data: Uint8Array) => {
        if (controllerClosed) return;
        try { controller.enqueue(data); } catch { /* closed */ }
      };
      const close = () => {
        if (controllerClosed) return;
        controllerClosed = true;
        try { controller.close(); } catch { /* closed */ }
      };

      const pendingCalls: Array<{ id: string; name: string; arguments: string }> = [];
      let callIdx = 0;
      let resultIdx = 0;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const runOpts: any = {
        model,
        messages: chatMessages,
        tools,
        stream: true,
        reasoning: {
          effort: 'low'
        }
      };
      const runner = (client.chat.completions as any).runTools(runOpts);

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
          enqueue(
            sseToolCallArgs(
              encoder,
              { id: tc.id, function: { arguments: tc.arguments } },
              result,
              resultIdx,
            ),
          );
        }
        resultIdx++;
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let accumulator = "";
      runner.on("chunk", (chunk: any) => {
        const choice = chunk.choices?.[0];
        const delta = choice?.delta;
        if (!delta) return;
        if (delta.content) {
          accumulator += delta.content;
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
        console.error("[chat] Error:", msg);
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
