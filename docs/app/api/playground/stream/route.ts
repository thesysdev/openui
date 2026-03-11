import { BASE_URL } from "@/lib/source";
import { readFileSync } from "fs";
import { type NextRequest } from "next/server";
import { join } from "path";

const systemPrompt = readFileSync(
  join(process.cwd(), "generated/playground-system-prompt.txt"),
  "utf-8",
);

export async function POST(req: NextRequest) {
  const { model, prompt } = await req.json();

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": `${BASE_URL}/playground`,
      "X-Title": "OpenUI Playground",
    },
    body: JSON.stringify({
      model,
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
    }),
    signal: req.signal,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return Response.json(
      {
        error: (err as { error?: { message?: string } }).error ?? {
          message: `OpenRouter error ${res.status}`,
        },
      },
      { status: res.status },
    );
  }

  return new Response(res.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
}
