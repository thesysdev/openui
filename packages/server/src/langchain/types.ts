import type { Client } from "@langchain/langgraph-sdk";

/** Native LangGraph SDK event envelope, shared by runs.stream() and runs.joinStream(). */
export type LangGraphStreamEvent =
  ReturnType<Client["runs"]["joinStream"]> extends AsyncIterable<infer Event> ? Event : never;
