import OpenAI from "openai";
import { z } from "zod/v4";
import { f1PromptContext } from "../../../lib/f1/context";
import { isOwnOrigin } from "../../../lib/same-origin";

export const runtime = "nodejs";

// Suggests the starting grid for a new chat: three short follow-on questions drawn from what
// this reader asked before. Same Gateway setup as /api/chat; no tools, one short completion.
const requestSchema = z.object({
  recent: z.array(z.string().trim().min(1).max(600)).min(1).max(12),
});
const answerSchema = z.object({ questions: z.array(z.string().trim().min(1).max(90)).min(3) });

export async function POST(request: Request) {
  if (!isOwnOrigin(request))
    return Response.json({ error: "Local requests only." }, { status: 403 });
  let body;
  try {
    body = requestSchema.parse(await request.json());
  } catch {
    return Response.json({ error: "Send up to 12 recent questions." }, { status: 400 });
  }
  const apiKey = process.env.THESYS_API_KEY;
  if (!apiKey) return Response.json({ error: "Gateway isn't configured." }, { status: 503 });

  const context = await f1PromptContext(request.signal);
  const gateway = new OpenAI({ apiKey, baseURL: "https://api.thesys.dev/v1/embed" });
  try {
    const completion = await gateway.chat.completions.create(
      {
        model: process.env.OPENUI_MODEL || "openai/gpt-5.5",
        messages: [
          {
            role: "system",
            content: [
              "You suggest the next questions a Formula 1 fan might ask an F1 data assistant that answers from OpenF1: results, standings, lap times, gaps, positions, stints, race control, telemetry, weather and team radio.",
              `Today is ${new Date().toISOString().slice(0, 10)}.`,
              context.season ? `Season: ${context.season}` : "",
              "Given the fan's recent questions, write three new questions that follow on from their interests: same drivers, teams or angles, taken somewhere new. Each is about this season, specific, answerable from that data, phrased the way the fan writes, and under 60 characters. Don't repeat a question they already asked.",
              'Reply with JSON only: {"questions": ["…", "…", "…"]}',
            ]
              .filter(Boolean)
              .join("\n"),
          },
          { role: "user", content: body.recent.map((q) => `- ${q}`).join("\n") },
        ],
        max_completion_tokens: 400,
      },
      { signal: request.signal },
    );
    const text = completion.choices[0]?.message?.content ?? "";
    const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
    const { questions } = answerSchema.parse(JSON.parse(json));
    return Response.json({ questions: questions.slice(0, 3) });
  } catch (error) {
    const upstream = error as { status?: number; message?: string };
    return Response.json({ error: upstream.message ?? "Couldn't suggest questions." }, { status: upstream.status ?? 502 });
  }
}
