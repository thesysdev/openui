import { NextRequest } from "next/server";
import OpenAI from "openai";
import { invoiceSchemaMap } from "../../schemas";

let _client: OpenAI | null = null;
function getClient() {
  if (!_client) {
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _client;
}

const BUSINESS_PREAMBLE = `You are an expert accounting assistant that generates structured invoice data.
Given a description of an invoice, extract or generate all relevant fields with realistic data.
Use plausible business names, dates, amounts, and tax calculations.
All monetary amounts should be numbers (not strings). Dates should be in YYYY-MM-DD format.
Ensure line item amounts equal quantity × unitPrice. Ensure totals are arithmetically correct.`;

export async function POST(req: NextRequest) {
  const { userPrompt } = (await req.json()) as {
    userPrompt: string;
  };

  const systemPrompt = invoiceSchemaMap.prompt({
    preamble: BUSINESS_PREAMBLE,
    additionalRules: [
      "All dates must be YYYY-MM-DD format",
      "Monetary amounts must be numbers with up to 2 decimal places",
      "NEVER use arithmetic expressions like 8*125 or 10+20 — always write the pre-computed numeric result (e.g. 1000, 30)",
      "Ensure mathematical consistency: subtotal = sum of item amounts, total = subtotal + tax + shipping",
    ],
  });

  console.log(systemPrompt);

  const stream = await getClient().chat.completions.create({
    model: "gpt-5",
    stream: true,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    reasoning_effort: "minimal",
  });

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      const send = (type: string, content: string) =>
        controller.enqueue(encoder.encode(JSON.stringify({ type, content }) + "\n"));

      try {
        for await (const chunk of stream) {
          const delta = chunk.choices?.[0]?.delta as Record<string, unknown> | undefined;
          if (!delta) continue;

          const thinking =
            (delta.reasoning as string | undefined) ??
            (delta.reasoning_content as string | undefined);
          if (thinking) send("thinking", thinking);

          const content = delta.content as string | undefined;
          if (content) send("content", content);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Stream error";
        send("error", message);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "Cache-Control": "no-cache",
    },
  });
}
