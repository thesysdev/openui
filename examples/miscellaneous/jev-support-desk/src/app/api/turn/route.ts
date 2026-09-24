import { decide } from "@/lib/jev";
import { describe, writeScreen } from "@/lib/llm";
import { addScreen, loadScreens, markUsed, whyNotReusable } from "@/lib/screens";
import { requests } from "@/lib/tools";

export const runtime = "nodejs";
const HIT = 0.6;

// Streams one JSON event per line: decision, text (while the LLM writes),
// screen (the program to render), then saved or not_saved.
export async function POST(request: Request) {
  const { text, customerId } = (await request.json()) as { text: string; customerId: string };
  const requestId = crypto.randomUUID();

  const body = new ReadableStream({
    async start(controller) {
      // The page cancels the stream when the customer switches; stop writing then.
      const send = (event: object) =>
        request.signal.aborted ||
        controller.enqueue(new TextEncoder().encode(JSON.stringify(event) + "\n"));
      try {
        const screens = loadScreens();
        const decision = await decide(text, customerId, screens);
        const itemId = decision.item.p >= HIT ? decision.item.id : null;
        requests.set(requestId, { customerId, itemId });

        const match = screens.find((s) => s.id === decision.screen.id);
        const reuse =
          match && decision.screen.p >= HIT && (!match.needsItem || itemId) ? match : null;
        send({ type: "decision", requestId, decision, reuse: reuse?.id ?? null });

        if (reuse) {
          markUsed(reuse.id);
          send({ type: "screen", program: reuse.program });
          return;
        }

        const program = await writeScreen(
          text,
          (t) => send({ type: "text", text: t }),
          request.signal,
        );
        send({ type: "screen", program });

        const problem = whyNotReusable(program);
        if (problem) {
          send({ type: "not_saved", reason: problem });
          return;
        }
        const { title, description } = await describe(text, program);
        // RULES in llm.ts name the context query `ctx`.
        const needsItem = program.includes("ctx.item");
        send({
          type: "saved",
          screen: addScreen({ title, description, program, writtenFor: text, needsItem }),
        });
      } catch (error) {
        send({ type: "error", message: error instanceof Error ? error.message : String(error) });
      } finally {
        if (!request.signal.aborted) controller.close();
      }
    },
  });

  return new Response(body, { headers: { "Content-Type": "application/x-ndjson" } });
}
