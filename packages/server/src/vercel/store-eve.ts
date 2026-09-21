import type { HistoryStep, StoreHistoryTransport } from "./persist-turn";
import { storeHistoryTurn } from "./persist-turn";

export type EveHistoryStep = HistoryStep;

export type StoreEveHistoryOptions = StoreHistoryTransport & {
  user: string | { role: "user"; content: string };
  steps: EveHistoryStep[];
};

/**
 * Persist an Eve turn as Conversations API items.
 * Pass the user text and the steps collected from Eve hook events.
 */
export function storeEveHistory(options: StoreEveHistoryOptions) {
  const content = typeof options.user === "string" ? options.user : options.user.content;
  return storeHistoryTurn({
    apiKey: options.apiKey,
    conversationId: options.conversationId,
    apiBaseUrl: options.apiBaseUrl,
    fetch: options.fetch,
    user: { role: "user", content },
    steps: options.steps,
  });
}
