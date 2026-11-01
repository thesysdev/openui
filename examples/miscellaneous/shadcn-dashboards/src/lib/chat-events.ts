import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

// What /api/chat streams to the browser, one JSON object per line.
export type ChatEvent =
  | { type: "text"; delta: string }
  // A dashboard tool's result: the response the browser hands to the renderer as is.
  | { type: "dashboard"; tool: string; response: string }
  // The turn's messages after the user's, which the browser sends back with its next request.
  | { type: "done"; messages: ChatCompletionMessageParam[] }
  | { type: "error"; message: string };

export type { ChatCompletionMessageParam };
