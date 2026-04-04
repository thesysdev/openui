import { promptSpec } from "@/prompt-config";
import { tools as toolDefs } from "@/tools";
import { generatePrompt, type ToolSpec } from "@openuidev/lang-core";
import { NextRequest } from "next/server";
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions.mjs";
import { z } from "zod";

const BASE_SYSTEM_PROMPT = `You are Tangential Assistant, an AI helper for a project and issue tracking app.
Be concise, practical, and action-oriented.
Always create dashboard. No exceptions.
When asked for planning help, provide clear next steps and tradeoffs.`;

function zodToJsonSchema(schema: Record<string, z.ZodType>): Record<string, unknown> {
  const properties: Record<string, unknown> = {};
  const required: string[] = [];

  for (const [key, zodSchema] of Object.entries(schema)) {
    const jsonSchema = z.toJSONSchema(zodSchema);
    properties[key] = jsonSchema;

    const def = (zodSchema as any)?._zod?.def;
    if (def?.type !== "optional") {
      required.push(key);
    }
  }

  return { type: "object", properties, ...(required.length ? { required } : {}) };
}

const tools: any[] = toolDefs.map((tool) => ({
  type: "function" as const,
  function: {
    name: tool.name,
    description: tool.description,
    parameters: zodToJsonSchema(tool.inputSchema),
    function: async (args: Record<string, unknown>) => JSON.stringify(await tool.execute(args)),
    parse: JSON.parse,
  },
}));

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

function buildSystemPrompt(): string {
  const mcpTools: ToolSpec[] = toolDefs.map((tool) => ({
    name: tool.name,
    description: tool.description,
    inputSchema: zodToJsonSchema(tool.inputSchema),
    outputSchema: z.toJSONSchema(tool.outputSchema) as Record<string, unknown>,
  }));

  const generatedPrompt = generatePrompt({
    ...promptSpec,
    tools: mcpTools,
  });

  return `n${generatedPrompt}\n\n${BASE_SYSTEM_PROMPT}`;
}

export async function POST(req: NextRequest) {
  const { messages } = await req.json();
  const apiKey = process.env.LLM_API_KEY ?? process.env.OPENAI_API_KEY ?? "";
  const baseURL = process.env.LLM_BASE_URL;
  const model = "gpt-5.4";

  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Set LLM_API_KEY or OPENAI_API_KEY env var" }), {
      status: 500,
    });
  }

  const client = new OpenAI({
    apiKey,
    ...(baseURL ? { baseURL } : {}),
  });

  const cleanMessages = (messages as any[])
    .filter((message) => message.role !== "tool")

    .map((message: any) => {
      if (message.role === "assistant" && message.tool_calls?.length) {
        const { tool_calls: _toolCalls, ...rest } = message;
        return rest;
      }
      return message;
    });

  const systemPrompt = buildSystemPrompt();
  // console.log(systemPrompt);
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
        try {
          controller.enqueue(data);
        } catch {
          // no-op: stream may already be closed
        }
      };

      const close = () => {
        if (controllerClosed) return;
        controllerClosed = true;
        try {
          controller.close();
        } catch {
          // no-op: stream may already be closed
        }
      };

      const pendingCalls: Array<{ id: string; name: string; arguments: string }> = [];
      let callIdx = 0;
      let resultIdx = 0;

      const runner = (client.chat.completions as any).runTools({
        model,
        messages: chatMessages,
        tools,
        stream: true,
      });

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

      runner.on("error", (err: any) => {
        const message = err instanceof Error ? err.message : "Stream error";
        enqueue(encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`));
        close();
      });
    },
    cancel() {
      controllerClosed = true;
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
