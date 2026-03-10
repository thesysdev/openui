import { useState, type FC } from "react";
import { ChatContext } from "./ChatContext";
import { createChatStore } from "./createChatStore";
import type { ChatProviderProps } from "./types";

export const ChatProvider: FC<ChatProviderProps> = ({ children, ...config }) => {
  const [store] = useState(() => createChatStore(config));

  return <ChatContext.Provider value={store}>{children}</ChatContext.Provider>;
};
