import { createContext, useContext } from "react";
import type { StoreApi } from "zustand";
import type { ChatStore } from "./types";

export const ChatContext = createContext<StoreApi<ChatStore> | null>(null);

export const useChatStore = (): StoreApi<ChatStore> => {
  const store = useContext(ChatContext);
  if (!store) {
    throw new Error("useChatStore must be used within a <ChatProvider>");
  }
  return store;
};
