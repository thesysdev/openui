import { cloudInstructions } from "@/lib/cloud-prompt";
import { tools } from "@/lib/tools";
import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, stepCountIs, streamText, type UIMessage } from "ai";

export async function POST(req: Request) {
  try {
    const { messages }: { messages?: UIMessage[] } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: "messages must be a non-empty UIMessage[]" }, { status: 400 });
    }
    const openai = createOpenAI({
      baseURL: "https://api.thesys.dev/v1/embed",
      apiKey: process.env.THESYS_API_KEY,
    });
    const result = streamText({
      model: openai.chat("google/gemini-3.6-flash-free"),
      system: cloudInstructions(),
      messages: await convertToModelMessages(messages),
      tools,
      stopWhen: stepCountIs(5),
      abortSignal: req.signal,
    });
    return result.toUIMessageStreamResponse({
      onError: (error) => (error instanceof Error ? error.message : "Model request failed"),
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Chat request failed" },
      { status: 500 },
    );
  }
}
