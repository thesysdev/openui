import OpenAI from "openai";
import type { ResponseCreateParamsNonStreaming } from "openai/resources/responses/responses";
import { z } from "zod/v4";
import { listDrivers, openDatabase, type Driver } from "../../../lib/f1-data";
import {
  localDemoAccess,
  ownsConversation,
  stoppedToolOutputs,
} from "../../../lib/gateway-session";
import { analyticsPrompt } from "../../../lib/prompt";
import { runFunctionToolLoop } from "../../../lib/tool-loop";
import { executeQueryLapTimes, queryLapTimesTool } from "../../../lib/tools/lap-times";

export const runtime = "nodejs";

// Gateway stores the conversation, so the browser sends only its latest question.
// Accept exactly one bounded user message; never forward browser-supplied history or tool output.
const chatRequestSchema = z.strictObject({
  threadId: z.string().min(1).max(200),
  input: z.tuple([
    z.strictObject({
      type: z.literal("message"),
      role: z.literal("user"),
      content: z.string().trim().min(1).max(600),
    }),
  ]),
});

async function parseChatRequest(request: Request) {
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json")
    throw new Error("Send JSON.");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Send a question.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 16_384) {
        await reader.cancel();
        throw new Error("Request too large.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return chatRequestSchema.parse(JSON.parse(Buffer.concat(chunks).toString("utf8")));
}

export async function POST(request: Request) {
  const denied = localDemoAccess(request);
  if (denied) return denied;
  let body;
  try {
    body = await parseChatRequest(request);
  } catch {
    return Response.json(
      { error: "Send one text question of up to 600 characters and a conversation id." },
      { status: 400 },
    );
  }
  const apiKey = process.env.THESYS_API_KEY;
  if (!apiKey)
    return Response.json(
      {
        error:
          "Configure THESYS_API_KEY privately in .env.local and restart to use OpenUI Gateway.",
      },
      { status: 503 },
    );

  let stopped;
  try {
    if (!(await ownsConversation(body.threadId, request.signal)))
      return Response.json(
        { error: "Conversation not found for this app and user." },
        { status: 403 },
      );
    stopped = await stoppedToolOutputs(body.threadId, request.signal);
  } catch {
    return Response.json(
      { error: "Unable to verify Gateway conversation access." },
      { status: 503 },
    );
  }

  let drivers: Driver[];
  let db;
  try {
    db = openDatabase();
    drivers = listDrivers(db);
  } catch {
    return Response.json(
      { error: "Prepare the race data with npm run prepare:data before asking a question." },
      { status: 503 },
    );
  } finally {
    db?.close();
  }

  const gateway = new OpenAI({ apiKey, baseURL: "https://api.thesys.dev/v1/embed" });
  // App-owned function tools. The loop runs only the names registered here.
  const lapTimesTool = queryLapTimesTool(drivers);
  const functionTools = { [lapTimesTool.name]: executeQueryLapTimes };
  const createParams: ResponseCreateParamsNonStreaming = {
    model: process.env.OPENUI_MODEL || "openai/gpt-5.5",
    instructions: analyticsPrompt(drivers),
    input: [...stopped, ...body.input],
    conversation: body.threadId,
    store: true,
    tools: [lapTimesTool],
    max_output_tokens: 6000,
  };

  let firstStream: AsyncIterable<Record<string, unknown>>;
  try {
    firstStream = (await gateway.responses.create(
      { ...createParams, stream: true },
      { signal: request.signal },
    )) as unknown as AsyncIterable<Record<string, unknown>>;
  } catch (error) {
    const upstream = error as { status?: number; message?: string };
    return Response.json(
      { error: upstream.message ?? "OpenUI Gateway request failed." },
      { status: upstream.status ?? 502 },
    );
  }

  // Forward Gateway's Responses events as SSE, running app-owned tools between model turns.
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enqueue = (event: Record<string, unknown>) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      try {
        await runFunctionToolLoop({
          client: gateway,
          createParams,
          firstStream,
          tools: functionTools,
          enqueue,
          signal: request.signal,
          maxRounds: 3,
        });
      } catch (error) {
        enqueue({ type: "error", message: error instanceof Error ? error.message : String(error) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
