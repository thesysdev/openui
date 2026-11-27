import type { ConversationItem } from "../conversations/types";

/** Items as OpenUI Cloud returns them: each with an id. */
export const stored = (items: object[]) =>
  items.map((item, i) => ({
    id: `item_${i}`,
    object: "conversation.item",
    conversation_id: "conv_1",
    ...item,
  })) as ConversationItem[];
