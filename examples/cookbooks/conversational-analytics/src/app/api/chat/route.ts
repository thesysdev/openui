import OpenAI from "openai";
import type { ResponseCreateParamsNonStreaming } from "openai/resources/responses/responses";
import { openDatabase } from "../../../lib/analytics";
import { parseChatRequest } from "../../../lib/chat-request";
import { localDemoAccess, ownsConversation } from "../../../lib/gateway-session";
import { streamGatewayTurn } from "../../../lib/gateway-stream";
import { analyticsPrompt } from "../../../lib/prompt";
import { listDrivers, type Driver } from "../../../lib/race-data";
import { executeRaceQuery, raceQueryTool } from "../../../lib/race-tool";

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
        error:
          "Configure THESYS_API_KEY privately in .env.local and restart to use OpenUI Gateway.",
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

  const abort = new AbortController();
  const cancel = () => abort.abort();
  const cleanup = () => request.signal.removeEventListener("abort", cancel);
  request.signal.addEventListener("abort", cancel, { once: true });
  if (request.signal.aborted) abort.abort();

  const gateway = new OpenAI({
    apiKey,
    baseURL: "https://api.thesys.dev/v1/embed",
    timeout: 60000,
    maxRetries: 0,
  });
  const createParams: ResponseCreateParamsNonStreaming = {
    model: process.env.OPENUI_MODEL || "openai/gpt-5.5",
    instructions: analyticsPrompt(drivers),
    input: body.input,
    conversation: body.threadId,
    store: true,
    tools: [raceQueryTool(drivers)],
    max_output_tokens: 6000,
  };
  // Open Gateway inside the stream so local headers flush immediately.
  async function* firstStream() {
    const upstream = await gateway.responses.create(
      { ...createParams, stream: true },
      { signal: abort.signal },
    );
    yield* upstream as unknown as AsyncIterable<Record<string, unknown>>;
  }
  return new Response(
    streamGatewayTurn(
      {
        client: gateway,
        createParams,
        firstStream: firstStream(),
        tools: { query_race: executeRaceQuery },
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
