import { BASE_URL } from "@/lib/source";
import { readFileSync } from "fs";
import { type NextRequest } from "next/server";
import { join } from "path";

const systemPrompt = readFileSync(
  join(process.cwd(), "generated/playground-system-prompt.txt"),
  "utf-8",
);

const conversationLog: Array<{ role: string; content: string }> = [];

export async function POST(req: NextRequest) {
  const { model, prompt } = await req.json();

  conversationLog.push({ role: "user", content: prompt });

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

  const [streamForClient, streamForLog] = res.body!.tee();

  const reader = streamForLog.getReader();
  const decoder = new TextDecoder();
  let fullResponse = "";
  (async () => {
    let done = false;
    while (!done) {
      const result = await reader.read();
      done = result.done;
      if (result.value) {
        const text = decoder.decode(result.value, { stream: true });
        for (const line of text.split("\n")) {
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            try {
              const json = JSON.parse(line.slice(6));
              const content = json.choices?.[0]?.delta?.content;
              if (content) fullResponse += content;
            } catch {
              /* skip non-JSON lines */
            }
          }
        }
      }
    }
    conversationLog.push({ role: "assistant", content: fullResponse });
    console.info(
      "[OpenUI Lang] Conversation:\n",
      JSON.stringify(
        conversationLog.map((m) => ({ ...m, content: m.content.replace(/\n/g, " ") })),
        null,
        2,
      ),
    );
  })();

  return new Response(streamForClient, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
}
