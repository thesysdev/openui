import { readOpenuiCloudConfig } from "@/lib/openui-cloud/config";
import { unavailableResponse } from "@/lib/openui-cloud/errors";
import { resolveRequestedModel } from "@/lib/openui-cloud/models";
import { hasAllowedOrigin, hasJsonContentType, readLimitedJson } from "@/lib/openui-cloud/request";
import { generateSystemPrompt } from "@openuidev/lang-core";
import { artifactTool } from "@openuidev/lang-core/cloud";
import OpenAI from "openai";
import type { ResponseInputItem } from "openai/resources/responses/responses";

const MAX_INPUT_ITEMS = 16;
const MAX_THREAD_ID_LENGTH = 256;
const SLIDES_ARTIFACT_INSTRUCTION = `Create a premium 5–7 slide visual story, not a text document split into slides. Use a strong cover, varied editorial layouts, concise copy, and image_search-sourced absolute image URLs. Every image must depict the exact film, product, person, or location named beside it—never use a metaphorical substitute or generic filler. Do not reuse one image for distinct entities. Include a chart when supplied quantitative data supports one, never invent factual data, avoid repetitive card grids, and finish with a decisive visual takeaway.`;
const REPORT_ARTIFACT_INSTRUCTION = `Create a premium executive report with a visual cover, clear hierarchy, and a deliberate mix of metrics, charts, tables, imagery, and concise analysis. Use image_search-sourced absolute image URLs only when each image accurately matches its label; never use metaphorical substitutes, unrelated stock photos, or one repeated image for distinct entities. Visualize supplied quantitative data when useful without fabricating facts, vary page composition, and end with specific decisions or next steps.`;

interface CloudChatRequest {
  threadId: string;
  input: ResponseInputItem[];
  model: string;
}

export async function POST(request: Request): Promise<Response> {
  const config = readOpenuiCloudConfig();
  if (!config) return unavailableResponse();
  if (!hasAllowedOrigin(request)) return unavailableResponse(403);
  if (!hasJsonContentType(request)) return unavailableResponse(415);

  let body: CloudChatRequest;
  try {
    const payload = await readLimitedJson(request);
    const parsed = parseCloudChatRequest(payload);
    if (!parsed) return unavailableResponse(400);
    body = parsed;
  } catch {
    return unavailableResponse(400);
  }

  const client = new OpenAI({
    baseURL: `${config.apiOrigin}/v1/embed`,
    apiKey: config.apiKey,
  });

  const stream = (await client.responses.create(
    {
      model: body.model,
      conversation: body.threadId,
      input: body.input,
      stream: true,
      store: true,
      tools: [
        artifactTool({
          artifacts: [
            { type: "slides", instruction: SLIDES_ARTIFACT_INSTRUCTION },
            { type: "report", instruction: REPORT_ARTIFACT_INSTRUCTION },
          ],
        }),
        { type: "web_search" },
        { type: "image_search" },
      ],
      instructions: generateSystemPrompt({
        cloud: true,
        instructions:
          "When creating an artifact, actively use the available web and image search tools to ground its content and visual choices.",
      }),
      // The Cloud Responses endpoint extends the stock OpenAI tool union.
    } as any,
    { signal: request.signal },
  )) as unknown as AsyncIterable<Record<string, unknown>>;

  return createSseResponse(stream, request.signal);
}

function parseCloudChatRequest(value: unknown): CloudChatRequest | null {
  if (!isRecord(value)) return null;

  const threadId = value.threadId;
  if (
    typeof threadId !== "string" ||
    threadId.length === 0 ||
    threadId.length > MAX_THREAD_ID_LENGTH ||
    !/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(threadId)
  ) {
    return null;
  }

  const input = value.input;
  if (
    !Array.isArray(input) ||
    input.length === 0 ||
    input.length > MAX_INPUT_ITEMS ||
    !input.every(isRecord)
  ) {
    return null;
  }

  const model = resolveRequestedModel(value.model);
  if (!model) return null;

  return { threadId, input: input as unknown as ResponseInputItem[], model };
}

function createSseResponse(
  stream: AsyncIterable<Record<string, unknown>>,
  requestSignal: AbortSignal,
): Response {
  const encoder = new TextEncoder();
  let cancelled = false;
  let iterator: AsyncIterator<Record<string, unknown>> | undefined;

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      iterator = stream[Symbol.asyncIterator]();
      while (!cancelled) {
        const next = await iterator.next();
        if (next.done || cancelled) break;
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(next.value)}\n\n`));
      }
      if (!cancelled && !requestSignal.aborted) controller.close();
    },
    async cancel() {
      cancelled = true;
      await iterator?.return?.();
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
