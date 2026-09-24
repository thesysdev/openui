import OpenAI from "openai";
import { openDatabase } from "../../../lib/analytics";
import { chatRequestSchema, cloudInput } from "../../../lib/chat-request";
import { forwardCloudStream } from "../../../lib/cloud-stream";
import { dashboardPrompt } from "../../../lib/prompt";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body;
  try {
    body = chatRequestSchema.parse(await request.json());
  } catch {
    return Response.json(
      { error: "Send a text question of up to 600 characters and valid conversation context." },
      { status: 400 },
    );
  }
  const apiKey = process.env.THESYS_API_KEY;
  if (!apiKey)
    return Response.json(
      {
        error:
          "Configure THESYS_API_KEY privately in .env.local and restart to use OpenUI Cloud. The example dashboard works without it.",
      },
      { status: 503 },
    );

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
      { error: "Prepare the dataset before asking a question." },
      { status: 503 },
    );
  } finally {
    db?.close();
  }
  let input;
  try {
    input = cloudInput(body, countries);
  } catch {
    return Response.json({ error: "Unknown country." }, { status: 400 });
  }

  const abort = new AbortController();
  const cancel = () => abort.abort();
  const cleanup = () => request.signal.removeEventListener("abort", cancel);
  request.signal.addEventListener("abort", cancel, { once: true });
  if (request.signal.aborted) abort.abort();
  try {
    const cloud = new OpenAI({
      apiKey,
      baseURL: "https://api.thesys.dev/v1/embed",
      timeout: 60000,
      maxRetries: 0,
    });
    const upstream = await cloud.responses.create(
      {
        model: process.env.OPENUI_MODEL || "openai/gpt-5.5",
        instructions: dashboardPrompt(countries),
        input,
        stream: true,
        store: false,
        max_output_tokens: 6000,
      },
      { signal: abort.signal },
    );
    return new Response(forwardCloudStream(upstream, abort, cleanup), {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform" },
    });
  } catch {
    cleanup();
    return Response.json(
      {
        error:
          "Could not start OpenUI Cloud generation. Check your Cloud key and model, then retry.",
      },
      { status: 502 },
    );
  }
}
