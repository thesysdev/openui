import { randomUUID } from "node:crypto";
import OpenAI from "openai";
import { EventType, type AGUIEvent } from "@ag-ui/core";
import { generateSystemPrompt, type LibrarySpec } from "@openuidev/lang-core";
import { dashboardPromptOptions } from "@openuidev/react-ui/genui-lib/prompt-options";
import spec from "@/generated/dashboard.json";
import type { MiniApp } from "@/lib/miniapp";
import { toolDefinitions } from "./tools";

export const builderTool: OpenAI.Chat.Completions.ChatCompletionTool = {
  type: "function",
  function: {
    name: "build_miniapp",
    description:
      "Create or edit an interactive dashboard MiniApp. Pass the user's complete request, data sources, identifiers, interactions, and supplied records. A null artifactId creates a new app. For edits provide the exact existing ID.",
    parameters: {
      type: "object",
      properties: {
        prompt: { type: "string" },
        name: { type: "string" },
        artifactId: { type: ["string", "null"] },
      },
      required: ["prompt", "name", "artifactId"],
      additionalProperties: false,
    },
  },
};

export async function buildMiniApp(
  args: { prompt: string; name: string; artifactId: string | null },
  context: {
    versions: MiniApp[];
    selectedKey: string | null;
    toolCallId: string;
    parentMessageId: string;
    signal: AbortSignal;
    emit: (event: AGUIEvent) => void;
  },
) {
  const { versions, selectedKey, toolCallId, parentMessageId, signal, emit } = context;
  const candidates = versions
    .filter((app) => app.id === args.artifactId)
    .sort((a, b) => b.version - a.version);
  const previous =
    candidates.find((app) => `${app.id}:${app.version}` === selectedKey) ?? candidates[0];
  if (args.artifactId && !previous)
    throw new Error("Select an existing MiniApp to edit or create a new one.");
  const app: MiniApp = {
    id: previous?.id ?? randomUUID(),
    version: previous ? candidates[0].version + 1 : 1,
    name: args.name || previous?.name || "MiniApp",
    response: "",
    updatedAt: new Date().toISOString(),
  };
  emit({
    type: EventType.TOOL_CALL_START,
    toolCallId,
    toolCallName: "build_miniapp",
    parentMessageId,
  });
  // Stream an artifact-shaped JSON argument so the native renderer can show progress.
  const metadata = { id: app.id, version: app.version, name: app.name, updatedAt: app.updatedAt };
  emit({
    type: EventType.TOOL_CALL_ARGS,
    toolCallId,
    delta: JSON.stringify(metadata).slice(0, -1) + ',"response":"',
  });
  try {
    const client = new OpenAI({
      apiKey: process.env.OPENUI_API_KEY,
      baseURL: `${(process.env.OPENUI_API_BASE_URL ?? "https://api.thesys.dev").replace(/\/$/, "")}/v1/embed`,
      maxRetries: 0,
    });
    const stream = client.chat.completions.stream(
      {
        model: process.env.OPENUI_MODEL ?? "anthropic/claude-sonnet-4.6",
        messages: [
          {
            role: "system",
            content: generateSystemPrompt({
              cloud: true,
              library: spec as LibrarySpec,
              promptOptions: dashboardPromptOptions,
              script: { tools: toolDefinitions },
              ...(previous ? { baseResponse: previous.response } : {}),
              meta: { name: app.name },
            }),
          },
          { role: "user", content: args.prompt },
        ],
      },
      { signal },
    );
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta.content;
      if (!delta) continue;
      app.response += delta;
      emit({
        type: EventType.TOOL_CALL_ARGS,
        toolCallId,
        delta: JSON.stringify(delta).slice(1, -1),
      });
    }
    const completion = await stream.finalChatCompletion();
    if (
      completion.choices[0]?.finish_reason !== "stop" ||
      !app.response.trimEnd().endsWith("]]>openui:end")
    ) {
      throw new Error(
        "MiniApp generation was incomplete. The previous version is still available.",
      );
    }
    emit({ type: EventType.TOOL_CALL_ARGS, toolCallId, delta: '"}' });
    emit({ type: EventType.TOOL_CALL_END, toolCallId });
    emit({
      type: EventType.TOOL_CALL_RESULT,
      messageId: randomUUID(),
      toolCallId,
      content: JSON.stringify(app),
      role: "tool",
    });
    versions.push(app);
    return { id: app.id, name: app.name, version: app.version, status: "ready" };
  } catch (error) {
    if (!signal.aborted) {
      emit({ type: EventType.TOOL_CALL_ARGS, toolCallId, delta: '"}' });
      emit({ type: EventType.TOOL_CALL_END, toolCallId });
      emit({
        type: EventType.TOOL_CALL_RESULT,
        messageId: randomUUID(),
        toolCallId,
        content: JSON.stringify({
          error: error instanceof Error ? error.message : "Generation failed",
        }),
        role: "tool",
      });
    }
    throw error;
  }
}
