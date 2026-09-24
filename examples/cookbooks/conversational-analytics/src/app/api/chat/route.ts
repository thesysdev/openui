import OpenAI from "openai";
import type { ResponseCreateParamsNonStreaming } from "openai/resources/responses/responses";
import { openDatabase } from "../../../lib/analytics";
import { parseChatRequest } from "../../../lib/chat-request";
import { localDemoAccess, ownsConversation } from "../../../lib/cloud-session";
import { streamCloudTurn } from "../../../lib/cloud-stream";
import { dashboardPrompt } from "../../../lib/prompt";
import { executeSalesDashboard, salesDashboardTool } from "../../../lib/sales-tool";

export const runtime = "nodejs";

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
        error: "Configure THESYS_API_KEY privately in .env.local and restart to use OpenUI Cloud.",
      },
      { status: 503 },
    );

  try {
    if (!(await ownsConversation(body.threadId, request.signal)))
      return Response.json(
        { error: "Conversation not found for this app and user." },
        { status: 403 },
      );
  } catch {
    return Response.json({ error: "Unable to verify Cloud conversation access." }, { status: 503 });
  }

  let countries: string[];
  let db;
  try {
    db = openDatabase();
    countries = [
      "All countries",
      ...(
        db.prepare("SELECT DISTINCT country FROM sales ORDER BY country").all() as {
          country: string;
        }[]
      ).map((row) => row.country),
    ];
  } catch {
    return Response.json(
      {
        error: "Prepare the dataset with python scripts/prepare_data.py before asking a question.",
      },
      { status: 503 },
    );
  } finally {
    db?.close();
  }

  const abort = new AbortController();
  const cancel = () => abort.abort();
  const cleanup = () => request.signal.removeEventListener("abort", cancel);
  request.signal.addEventListener("abort", cancel, { once: true });
  if (request.signal.aborted) abort.abort();

  const cloud = new OpenAI({
    apiKey,
    baseURL: "https://api.thesys.dev/v1/embed",
    timeout: 60000,
    maxRetries: 0,
  });
  const createParams: ResponseCreateParamsNonStreaming = {
    model: process.env.OPENUI_MODEL || "openai/gpt-5.5",
    instructions: dashboardPrompt(countries),
    input: body.input,
    conversation: body.threadId,
    store: true,
    tools: [salesDashboardTool(countries)],
    max_output_tokens: 6000,
  };
  // Open Cloud inside the stream so local headers flush immediately.
  async function* firstStream() {
    const upstream = await cloud.responses.create(
      { ...createParams, stream: true },
      { signal: abort.signal },
    );
    yield* upstream as unknown as AsyncIterable<Record<string, unknown>>;
  }
  return new Response(
    streamCloudTurn(
      {
        client: cloud,
        createParams,
        firstStream: firstStream(),
        tools: { sales_dashboard: executeSalesDashboard },
        maxRounds: 3,
      },
      abort,
      cleanup,
    ),
    {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
      },
    },
  );
}
