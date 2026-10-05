import { randomUUID } from "node:crypto";
import OpenAI from "openai";
import { EventType, type AGUIEvent } from "@ag-ui/core";
import { generateSystemPrompt, type LibrarySpec } from "@openuidev/lang-core";
import { openuiChatPromptOptions } from "@openuidev/react-ui/genui-lib/prompt-options";
import spec from "@/generated/chat.json";
import type { MiniApp } from "@/lib/miniapp";
import { builderTool, buildMiniApp } from "./builder";

export interface ChatInput {
  threadId: string;
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[];
  artifacts: MiniApp[];
  selectedKey: string | null;
}

export async function runAgent(
  input: ChatInput,
  signal: AbortSignal,
  emit: (event: AGUIEvent) => void,
) {
  const client = new OpenAI({ baseURL: process.env.OPENAI_BASE_URL });
  const versions = [...input.artifacts];
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: [
        generateSystemPrompt({
          library: spec as LibrarySpec,
          promptOptions: openuiChatPromptOptions,
        }),
        "You build interactive dashboard MiniApps. Use build_miniapp for dashboard creation and changes; answer normal questions directly with the chat component library, rooted at Card. Do not use Query or Mutation in chat replies.",
        "Pass the user's actual request into the tool prompt, including source identifiers, supplied rows, units, interactions and requested edits. Sources are public GitHub repositories and npm downloads, or records supplied by the user. Ask for a source when none is specified. Never invent source data.",
        "Use null artifactId for new apps. For edits use the selected app's ID unless the user explicitly chooses another. If no app is selected and the target is ambiguous, ask which one. Preserve unrequested content. After success, confirm briefly without repeating the app in chat.",
        `Available versions: ${JSON.stringify(versions.map(({ id, version, name }) => ({ id, version, name })))}`,
        `Selected version: ${input.selectedKey ?? "none"}.`,
      ].join("\n"),
    },
    ...input.messages,
  ];
  for (let round = 0; round < 5; round++) {
    const messageId = randomUUID();
    const stream = client.chat.completions.stream(
      { model: process.env.OPENAI_MODEL ?? "gpt-5.2", messages, tools: [builderTool] },
      { signal },
    );
    let started = false;
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta.content;
      if (!delta) continue;
      if (!started) {
        emit({ type: EventType.TEXT_MESSAGE_START, messageId, role: "assistant" });
        started = true;
      }
      emit({ type: EventType.TEXT_MESSAGE_CONTENT, messageId, delta });
    }
    const completion = await stream.finalChatCompletion();
    const choice = completion.choices[0];
    if (!choice || !["stop", "tool_calls"].includes(choice.finish_reason))
      throw new Error("The agent response did not finish. Please retry.");
    if (started) emit({ type: EventType.TEXT_MESSAGE_END, messageId });
    const message = choice.message;
    if (!message.tool_calls?.length) return;
    messages.push(message);
    for (const call of message.tool_calls) {
      if (call.type !== "function" || call.function.name !== "build_miniapp")
        throw new Error("Unknown agent tool");
      const result = await buildMiniApp(JSON.parse(call.function.arguments), {
        versions,
        selectedKey: input.selectedKey,
        toolCallId: call.id,
        parentMessageId: messageId,
        signal,
        emit,
      });
      messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(result) });
    }
  }
  throw new Error("The agent reached its tool-round limit. Try a smaller request.");
}
