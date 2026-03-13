import type { ChatStore, Message } from "./internal";
import { createContext } from "svelte";
import { get, type Readable } from "svelte/store";
import type { StoreApi } from "zustand";

const [consumeChatStoreContext, provideChatStoreContext] = createContext<() => StoreApi<ChatStore>>();
const [consumeMessageStoreContext, provideMessageStoreContext] = createContext<
  () => Readable<Message>
>();

export { provideChatStoreContext, provideMessageStoreContext };

export function getChatStore(): StoreApi<ChatStore> {
  return consumeChatStoreContext()();
}

export function getMessageStore(): Readable<Message> {
  return consumeMessageStoreContext()();
}

export function getMessage(): Message {
  return get(getMessageStore());
}
