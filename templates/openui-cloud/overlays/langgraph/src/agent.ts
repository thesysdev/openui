import { AIMessage, type BaseMessage, isToolMessage } from "@langchain/core/messages";
import { type ServerTool, tool } from "@langchain/core/tools";
import { StateSchema } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { generateSystemPrompt } from "@openuidev/lang-core";
import { artifactTool } from "@openuidev/thesys-server";
import { createAgent, createMiddleware } from "langchain";
import { z } from "zod";
import { requiredEnv } from "./lib/env";
import { DEFAULT_MODEL } from "./lib/models";
import { executeGetWeather, getWeatherTool } from "./lib/tools/get-weather";

const getWeather = tool(
  async ({ location }, config) =>
    executeGetWeather(JSON.stringify({ location }), { signal: config.signal }),
  {
    name: "get_weather",
    description: getWeatherTool.description,
    schema: z.object({
      location: z.string().trim().min(1).describe("City or place name, e.g. Berlin."),
    }),
  },
);

const appTools = [getWeather];
const appToolNames = new Set<string>(appTools.map(({ name }) => name));
const TOOL_CALL_BLOCK_TYPES = new Set(["tool_call", "tool_call_chunk", "tool_use"]);

function keepAppToolCallBlocks(block: unknown) {
  if (typeof block !== "object" || block === null) return true;
  const { type, name } = block as { type?: unknown; name?: unknown };
  if (typeof type !== "string" || !TOOL_CALL_BLOCK_TYPES.has(type)) return true;
  return typeof name === "string" && appToolNames.has(name);
}

/**
 * Cloud already holds prior turns via `conversation`. For each model step we
 * only send the new items: the latest user message, or every ToolMessage from
 * the current local tool round (parallel tools → multiple trailing ToolMessages).
 */
function cloudStepMessages(messages: BaseMessage[]): BaseMessage[] {
  if (messages.length === 0) return messages;
  const last = messages[messages.length - 1]!;
  if (!isToolMessage(last)) return messages.slice(-1);
  let start = messages.length - 1;
  while (start > 0 && isToolMessage(messages[start - 1]!)) start -= 1;
  return messages.slice(start);
}

// These are provider-executed tools. LangGraph sends their declarations to
// OpenUI Cloud, while Cloud runs them and stores their outputs/artifacts.
const cloudTools = [
  artifactTool({ artifacts: ["slides", "report"] }),
  { type: "web_search" },
  { type: "image_search" },
  // Add provider-executed MCP servers here, for example:
  // { type: "mcp", server_label: "deepwiki", server_url: "https://mcp.deepwiki.com/mcp" },
] as ServerTool[];

const CloudAgentState = new StateSchema({
  conversationId: z.string(),
  model: z.string().default(DEFAULT_MODEL),
});

function cloudModel(model: string, conversationId?: string) {
  return new ChatOpenAI({
    model,
    apiKey: requiredEnv("THESYS_API_KEY"),
    streaming: true,
    useResponsesApi: true,
    configuration: { baseURL: "https://api.thesys.dev/v1/embed" },
    modelKwargs: {
      store: true,
      ...(conversationId ? { conversation: conversationId } : {}),
    },
  });
}

const cloudConversation = createMiddleware({
  name: "OpenUICloudConversation",
  stateSchema: CloudAgentState,
  wrapModelCall: async (request, handler) => {
    const { conversationId, model } = request.state as unknown as {
      conversationId: string;
      model: string;
    };

    const response = await handler({
      ...request,
      model: cloudModel(model, conversationId),
      messages: cloudStepMessages(request.messages),
    });

    // Cloud has already executed its provider tools. Keep only app-owned
    // calls in graph state so LangGraph's ToolNode executes exactly those.
    // ChatOpenAI also derives tool_calls from standard content blocks, so
    // remove Cloud-owned call blocks as well as filtering response.tool_calls.
    const localToolCalls = response.tool_calls?.filter(({ name }) => appToolNames.has(name));
    const localContent = Array.isArray(response.content)
      ? response.content.filter(keepAppToolCallBlocks)
      : response.content;
    const contentChanged =
      Array.isArray(response.content) && localContent.length !== response.content.length;
    if (localToolCalls?.length === response.tool_calls?.length && !contentChanged) {
      return response;
    }

    return new AIMessage({
      id: response.id,
      content: localContent,
      additional_kwargs: response.additional_kwargs,
      response_metadata: response.response_metadata,
      tool_calls: localToolCalls,
      invalid_tool_calls: response.invalid_tool_calls,
      usage_metadata: response.usage_metadata,
    });
  },
});

/**
 * A normal LangGraph agent, invoked in-process by the /api/chat route:
 * LangGraph owns orchestration and local tool execution; OpenUI Cloud is
 * the attached Responses provider.
 */
export const graph = createAgent({
  model: cloudModel(DEFAULT_MODEL),
  tools: [...cloudTools, ...appTools],
  systemPrompt: generateSystemPrompt({ cloud: true }),
  stateSchema: CloudAgentState,
  middleware: [cloudConversation],
});
