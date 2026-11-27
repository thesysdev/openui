import type { ConversationItem, ConversationItemInput } from "./types";

/** Turns one SDK's messages into conversation items, and stored items back into them. */
export abstract class ConversationItemConverter<Input, Output = Input> {
  /** A new turn as items to store. */
  abstract toItems(messages: readonly Input[]): ConversationItemInput[];

  /** Stored items, oldest first, as messages for the model. */
  abstract fromItems(items: readonly ConversationItem[]): Output[];
}
