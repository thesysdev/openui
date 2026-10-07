import type { StreamEvent } from "@langchain/langgraph-sdk";

/** Native event envelope shared by LangGraph runs.stream() and runs.joinStream(). */
export interface LangGraphStreamEvent {
  event: StreamEvent;
  data: unknown;
  id?: string;
}
