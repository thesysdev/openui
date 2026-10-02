import {
  isAIMessage,
  isHumanMessage,
  isToolMessage,
  type BaseMessage,
} from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { StateSchema } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { generateSystemPrompt } from "@openuidev/lang-core";
import { storeChatCompletionHistory } from "@openuidev/server/openai";
import { createAgent, createMiddleware } from "langchain";
import type {
  ChatCompletionMessageParam,
  ChatCompletionUserMessageParam,
} from "openai/resources/chat/completions";
import { z } from "zod";
import { requiredEnv } from "./lib/env";
import librarySpec from "./generated/spec.json";
import { DEFAULT_MODEL } from "./lib/models";
import { executeGetWeather, getWeatherTool } from "./lib/tools/get-weather";

const getWeather = tool(
  async ({ location }, config) =>
    executeGetWeather(JSON.stringify({ location }), { signal: config.signal }),
  {
    name: "get_weather",
    description: getWeatherTool.function.description,
    schema: z.object({
      location: z
        .string()
        .trim()
        .min(1)
        .describe("City or place name, e.g. Berlin."),
    }),
  },
);

const CloudAgentState = new StateSchema({
  conversationId: z.string(),
  model: z.string().default(DEFAULT_MODEL),
});

function cloudModel(model: string) {
  return new ChatOpenAI({
    model,
    apiKey: requiredEnv("THESYS_API_KEY"),
    streaming: true,
    useResponsesApi: false,
    configuration: { baseURL: "https://api.thesys.dev/v1/embed" },
  });
}

/** Convert only the current user turn and its tool rounds for Cloud storage. */
function newTurnMessages(
  messages: BaseMessage[],
): ChatCompletionMessageParam[] {
  const start = messages.findLastIndex(isHumanMessage);
  if (start < 0) return [];
  return messages
    .slice(start)
    .flatMap((message): ChatCompletionMessageParam[] => {
      if (isHumanMessage(message)) {
        return [
          {
            role: "user",
            content:
              message.content as ChatCompletionUserMessageParam["content"],
          },
        ];
      }
      const content =
        typeof message.content === "string"
          ? message.content
          : message.content
              .filter((part) => part.type === "text")
              .map((part) => part.text)
              .join("");
      if (isAIMessage(message)) {
        return [
          {
            role: "assistant",
            content: content || null,
            ...(message.tool_calls?.length
              ? {
                  tool_calls: message.tool_calls.map((call) => ({
                    id: call.id!,
                    type: "function" as const,
                    function: {
                      name: call.name,
                      arguments: JSON.stringify(call.args),
                    },
                  })),
                }
              : {}),
          },
        ];
      }
      if (isToolMessage(message)) {
        return [{ role: "tool", tool_call_id: message.tool_call_id, content }];
      }
      return [];
    });
}

const cloudConversation = createMiddleware({
  name: "OpenUICloudConversation",
  stateSchema: CloudAgentState,
  wrapModelCall: (request, handler) =>
    handler({
      ...request,
      model: cloudModel(request.state.model),
    }),
  afterAgent: async (state) => {
    await storeChatCompletionHistory({
      apiKey: requiredEnv("THESYS_API_KEY"),
      conversationId: state.conversationId,
      messages: newTurnMessages(state.messages),
    });
  },
});

/** LangGraph owns the tool loop; OpenUI Cloud provides Chat Completions and storage. */
export const graph = createAgent({
  model: cloudModel(DEFAULT_MODEL),
  tools: [getWeather],
  systemPrompt: generateSystemPrompt({ cloud: true, library: librarySpec }),
  stateSchema: CloudAgentState,
  middleware: [cloudConversation],
});
