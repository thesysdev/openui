import { createLangChainStreamResponse } from "@openuidev/langchain";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

/**
 * Local LangGraph server configuration defined via langgraph.json
 */
const API_URL = process.env.LANGGRAPH_API_URL || "http://localhost:2024";
const ASSISTANT_ID = process.env.LANGGRAPH_ASSISTANT_ID || "agent";

/**
 * Proxies the browser <-> LangGraph server. The browser posts native AG-UI
 * messages; {@link createLangChainStreamResponse} converts them to LangChain
 * messages, starts the graph over the protocol-v2 endpoints, and relays only
 * the custom OpenUI channel.
 */
export async function POST(req: NextRequest) {
  return createLangChainStreamResponse(req, {
    apiUrl: API_URL,
    assistantId: ASSISTANT_ID,
    apiKey: process.env.LANGSMITH_API_KEY,
    debug: process.env.NODE_ENV !== "production",
    // The agent sends sessionId to the Gateway, so it groups the thread's turns into one session.
    prepareInput: ({ messages, requestBody }) => ({
      messages,
      sessionId:
        typeof requestBody.threadId === "string" &&
        requestBody.threadId.trim() &&
        !/\p{Cc}/u.test(requestBody.threadId)
          ? requestBody.threadId
          : undefined,
    }),
  });
}
