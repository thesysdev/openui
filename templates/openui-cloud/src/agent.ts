import { tool } from "@langchain/core/tools";
import { StateSchema } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { generateSystemPrompt } from "@openuidev/lang-core";
import { createAgent, createMiddleware } from "langchain";
import { z } from "zod";
import librarySpec from "./generated/spec.json";
import { requiredEnv } from "./lib/env";
import { DEFAULT_MODEL } from "./lib/models";
import { openui } from "./lib/openui";
import { executeGetWeather, getWeatherTool } from "./lib/tools/get-weather";

// The generated spec carries the library and its prompt options; generateSystemPrompt takes them separately.
const { promptOptions, ...library } = librarySpec;

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

const CloudAgentState = new StateSchema({
  conversationId: z.string(),
  turnStart: z.number().int().nonnegative(),
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

const selectedModel = createMiddleware({
  name: "OpenUICloudModel",
  stateSchema: CloudAgentState,
  wrapModelCall: async (request, handler) => {
    const { model } = request.state as unknown as { model: string };
    return handler({ ...request, model: cloudModel(model) });
  },
});

const persistTurn = createMiddleware({
  name: "OpenUICloudHistory",
  stateSchema: CloudAgentState,
  afterAgent: async (state) => {
    // Save the completed turn in one call: new user message, assistant messages,
    // tool calls, and tool results. Exclude all replayed history.
    await openui.langgraph.conversations.items.create(
      state.conversationId,
      state.messages.slice(state.turnStart),
    );
  },
});

/** LangGraph owns the tool loop; OpenUI Cloud provides Chat Completions. */
export const graph = createAgent({
  model: cloudModel(DEFAULT_MODEL),
  tools: [getWeather],
  systemPrompt: generateSystemPrompt({ cloud: true, library, promptOptions }),
  stateSchema: CloudAgentState,
  middleware: [selectedModel, persistTurn],
});
