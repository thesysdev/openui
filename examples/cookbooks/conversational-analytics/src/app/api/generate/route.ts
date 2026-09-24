import OpenAI from "openai";
import { z } from "zod/v4";
import { openDatabase } from "../../../lib/analytics";
import { filterSchema } from "../../../lib/filters";
import { dashboardPrompt } from "../../../lib/prompt";

export const runtime = "nodejs";
const requestSchema = z
  .object({
    question: z.string().trim().min(1).max(600),
    history: z.array(z.string().max(600)).max(5),
    filters: filterSchema,
  })
  .strict();

export async function POST(request: Request) {
  let body;
  try {
    body = requestSchema.parse(await request.json());
  } catch {
    return Response.json(
      { error: "Enter a question of up to 600 characters and supported filters." },
      { status: 400 },
    );
  }
  const apiKey = process.env.THESYS_API_KEY;
  if (!apiKey) {
    return Response.json(
      {
        error:
          "Configure THESYS_API_KEY privately in .env.local and restart to use OpenUI Cloud. The example dashboard works without it.",
      },
      { status: 503 },
    );
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
      { error: "Prepare the dataset before asking a question." },
      { status: 503 },
    );
  } finally {
    db?.close();
  }
  if (!countries.includes(body.filters.country))
    return Response.json({ error: "Unknown country." }, { status: 400 });

  const abort = new AbortController();
  const cancel = () => abort.abort();
  request.signal.addEventListener("abort", cancel, { once: true });
  if (request.signal.aborted) abort.abort();
  try {
    // The OpenAI SDK is a compatible transport for OpenUI Cloud's Gateway.
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
        input: JSON.stringify({
          previousQuestions: body.history,
          currentFilters: body.filters,
          question: body.question,
        }),
        stream: true,
        store: false,
        max_output_tokens: 6000,
      },
      { signal: abort.signal },
    );
    const encoder = new TextEncoder();
    // NDJSON preserves explicit success and failure events even after HTTP headers are sent.
    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: object) =>
          controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
        try {
          let complete = false;
          for await (const event of upstream) {
            if (event.type === "response.output_text.delta")
              send({ type: "delta", text: event.delta });
            if (event.type === "response.completed") complete = true;
            if (
              event.type === "error" ||
              event.type === "response.failed" ||
              event.type === "response.incomplete" ||
              event.type === "response.refusal.delta"
            ) {
              throw new Error("Generation did not complete.");
            }
          }
          if (!complete) throw new Error("Stream ended early.");
          send({ type: "done" });
        } catch {
          if (!abort.signal.aborted)
            send({
              type: "error",
              message: "Generation interrupted. Try again or load the example dashboard.",
            });
        } finally {
          request.signal.removeEventListener("abort", cancel);
          if (!abort.signal.aborted) controller.close();
        }
      },
      cancel() {
        abort.abort();
      },
    });
    return new Response(stream, {
      headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-store" },
    });
  } catch {
    request.signal.removeEventListener("abort", cancel);
    return Response.json(
      {
        error:
          "Could not start OpenUI Cloud generation. Check your Cloud key and model, then retry.",
      },
      { status: 502 },
    );
  }
}
